/**
 * Chat API — core of the Adaptive AI Assistant
 *
 * NORMAL mode:  analyze → (search?) → build prompt → generate 3 candidates
 *               → evaluate → rank → stream best candidate → save explanation
 *
 * LEARNING mode: same pipeline but return all 3 candidates (no streaming)
 *               → user selects → preference logged → memory updated
 */
import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { getLLMProvider } from '@/services/ai/provider'
import { analyzeTask } from '@/services/ai/task-analyzer'
import { generateCandidates } from '@/services/ai/candidate-generator'
import { evaluateCandidates } from '@/services/ai/evaluator'
import { rankCandidates } from '@/services/ai/ranker'
import { buildSystemPrompt, savePromptVersion } from '@/services/ai/prompt-builder'
import { getMemory, shouldUpdateMemory, generateMemory } from '@/services/ai/memory-generator'
import { generateExplanation } from '@/services/ai/explainer'
import { searchWeb, buildSearchContext } from '@/services/search/tavily'
import { prisma } from '@/lib/prisma'
import { getOrCreateSession, setSessionCookie } from '@/lib/session'
import type { ConversationMode } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const sessionId = await getOrCreateSession()

  const body = await req.json()
  const {
    messages,
    conversationId,
    mode = 'NORMAL',
  }: {
    messages: Array<{ role: string; content: string }>
    conversationId?: string
    mode?: ConversationMode
  } = body

  const userMessage = messages[messages.length - 1]?.content ?? ''
  const history = messages.slice(0, -1)

  // ── 1. Get user + memory ─────────────────────────────────
  let userId: string
  try {
    const user = await prisma.user.upsert({
      where: { sessionId },
      create: { sessionId },
      update: {},
    })
    userId = user.id
  } catch {
    userId = sessionId
  }

  const memory = await getMemory(userId)

  // ── 2. Ensure conversation exists ────────────────────────
  let convId = conversationId
  try {
    if (!convId) {
      const conv = await prisma.conversation.create({
        data: {
          userId,
          mode,
          title: userMessage.slice(0, 60),
        },
      })
      convId = conv.id
    }

    await prisma.message.create({
      data: {
        conversationId: convId,
        role: 'USER',
        content: userMessage,
      },
    })
  } catch {}

  // ── 3. Task Analysis ─────────────────────────────────────
  const taskAnalysis = await analyzeTask(userMessage, history)

  // ── 4. Web Search (if needed) ────────────────────────────
  let searchContext: string | null = null
  if (taskAnalysis.needsWebSearch) {
    const searchQuery = userMessage.slice(0, 200)
    const results = await searchWeb(searchQuery)
    searchContext = buildSearchContext(results)
  }

  // ── 5. Build prompt ──────────────────────────────────────
  const { systemPrompt, components } = buildSystemPrompt(
    taskAnalysis,
    memory,
    [],
    searchContext,
  )
  const promptVersion = await savePromptVersion(userId, systemPrompt, components, memory?.id ?? null)

  // ── 6. LEARNING MODE: return 3 candidates ────────────────
  if (mode === 'LEARNING') {
    const candidates = await generateCandidates(
      userMessage,
      systemPrompt,
      history,
      taskAnalysis,
      memory,
    )

    // Save assistant message with candidates
    let savedMessageId: string | undefined
    try {
      const savedMsg = await prisma.message.create({
        data: {
          conversationId: convId!,
          role: 'ASSISTANT',
          content: candidates[0]?.content ?? '',
          taskAnalysis: taskAnalysis as never,
          searchUsed: taskAnalysis.needsWebSearch,
        },
      })
      savedMessageId = savedMsg.id

      await Promise.all(
        candidates.map(c =>
          prisma.responseCandidate.create({
            data: {
              messageId: savedMsg.id,
              strategy: c.strategy,
              content: c.content,
              index: c.index,
            },
          }),
        ),
      )
    } catch {}

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...setSessionCookie(sessionId),
    }
    if (convId) headers['X-Conversation-Id'] = convId
    if (savedMessageId) headers['X-Message-Id'] = savedMessageId

    return NextResponse.json(
      {
        mode: 'LEARNING',
        candidates,
        taskAnalysis,
        conversationId: convId,
        messageId: savedMessageId,
      },
      { headers },
    )
  }

  // ── 7. NORMAL MODE: generate → evaluate → rank → stream ──
  const candidates = await generateCandidates(
    userMessage,
    systemPrompt,
    history,
    taskAnalysis,
    memory,
  )

  const evaluations = await evaluateCandidates(userMessage, candidates, memory)
  const ranked = rankCandidates(candidates, evaluations, memory)
  const best = ranked[0]

  // Save message + candidates + explanation
  let savedMessageId: string | undefined
  try {
    const savedMsg = await prisma.message.create({
      data: {
        conversationId: convId!,
        role: 'ASSISTANT',
        content: best.content,
        taskAnalysis: taskAnalysis as never,
        searchUsed: taskAnalysis.needsWebSearch,
      },
    })
    savedMessageId = savedMsg.id

    await Promise.all(
      ranked.map(c =>
        prisma.responseCandidate.create({
          data: {
            messageId: savedMsg.id,
            strategy: c.strategy,
            content: c.content,
            index: c.index,
            isSelected: c.index === best.index,
            score: c.score,
          },
        }),
      ),
    )

    // XAI explanation
    await generateExplanation(
      savedMsg.id,
      userMessage,
      best,
      ranked,
      evaluations.find(e => e.index === best.index),
      memory,
      promptVersion,
    )

    // Adaptive memory update
    if (await shouldUpdateMemory(userId)) {
      const logs = await prisma.preferenceLog
        .findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 })
        .catch(() => [])
      if (logs.length > 0) await generateMemory(userId, logs)
    }
  } catch {}

  // ── 8. Stream the best response ──────────────────────────
  const provider = getLLMProvider()
  const stream = streamText({
    model: provider.getModel(),
    system: systemPrompt,
    messages: [
      ...history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ],
    maxTokens: 2000,
    onFinish: async ({ text }) => {
      if (savedMessageId) {
        await prisma.message.update({
          where: { id: savedMessageId },
          data: { content: text },
        }).catch(() => {})
      }
    },
  })

  const response = stream.toDataStreamResponse()

  // Attach metadata headers
  const newHeaders = new Headers(response.headers)
  newHeaders.set('X-Conversation-Id', convId ?? '')
  newHeaders.set('X-Message-Id', savedMessageId ?? '')
  newHeaders.set('X-Strategy', best.strategy)
  newHeaders.set('X-Confidence', best.score.toFixed(2))
  newHeaders.set('X-Task-Type', taskAnalysis.taskType)
  newHeaders.set('X-Search-Used', String(taskAnalysis.needsWebSearch))

  const setCookie = setSessionCookie(sessionId)
  Object.entries(setCookie).forEach(([k, v]) => newHeaders.set(k, v))

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  })
}
