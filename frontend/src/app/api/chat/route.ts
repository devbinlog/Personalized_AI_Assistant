/**
 * Chat API — core of the Adaptive AI Assistant
 *
 * NORMAL mode:  analyze → (search?) → build prompt → generate 3 candidates
 *               → evaluate → rank → stream best candidate → save explanation
 *
 * LEARNING mode: same pipeline but return all 3 candidates (no streaming)
 *               → user selects → preference logged → memory updated
 *
 * Step 2.5 — LangGraph backend orchestration:
 *   Calls FastAPI/LangGraph at LANGGRAPH_BACKEND_URL before local pipeline.
 *   Uses backend task_analysis, system_prompt, and candidates when available.
 *   Falls back to local processing if backend is unreachable (timeout: 8s).
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
import { maybeSummarizeConversation } from '@/services/ai/conversation-summarizer'
import { resolvePersonaForTask } from '@/services/ai/persona-manager'
import { searchWeb, buildSearchContext } from '@/services/search/tavily'
import { prisma } from '@/lib/prisma'
import { getOrCreateSession, setSessionCookie } from '@/lib/session'
import { resolveUserContext } from '@/lib/resolve-user'
import type { ConversationMode } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ── Attached file type (mirrors chat-input.tsx) ───────────────
type AttachedFile = {
  name: string
  type: 'image' | 'text'
  content: string   // base64 for images, plain text for text
  mimeType: string
}

// ── LangGraph backend response types ─────────────────────────
type BackendCandidate = {
  strategy: string
  content: string
  index: number
  score: number
  reasons: string[]
}

type BackendResponse = {
  task_analysis: {
    taskType: string
    complexity: string
    domain: string
    needsWebSearch: boolean
    expectedOutput: string
    preferredStyle: string
  }
  system_prompt: string
  candidates: BackendCandidate[]
  best_candidate: BackendCandidate | null
  explanation: Record<string, unknown> | null
}

export async function POST(req: NextRequest) {
  const sessionId = await getOrCreateSession()

  const body = await req.json()
  const {
    messages,
    conversationId,
    mode = 'NORMAL',
    files,
  }: {
    messages: Array<{ role: string; content: string }>
    conversationId?: string
    mode?: ConversationMode
    files?: AttachedFile[]
  } = body

  const rawUserMessage = messages[messages.length - 1]?.content ?? ''
  const history = messages.slice(0, -1)

  // Inject text file contents into the user message
  const textFiles = files?.filter(f => f.type === 'text') ?? []
  const imageFiles = files?.filter(f => f.type === 'image') ?? []
  const fileContext = textFiles
    .map(f => `[첨부 파일: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n\n')
  const userMessage = fileContext
    ? `${rawUserMessage}\n\n${fileContext}`
    : rawUserMessage

  // ── 1. Get user + memory (NextAuth 우선, 쿠키 폴백) ──────
  const { userId } = await resolveUserContext()
  const [userProfile, recentSummaries] = await Promise.all([
    userId !== 'anonymous'
      ? prisma.userProfile.findUnique({ where: { userId } }).catch(() => null)
      : null,
    userId !== 'anonymous'
      ? prisma.conversation.findMany({
          where: { userId, summary: { not: null } },
          orderBy: { updatedAt: 'desc' },
          take: 3,
          select: { summary: true, title: true },
        }).then(cs => cs.map(c => `[${c.title ?? '대화'}] ${c.summary}`)).catch(() => [])
      : [],
  ])

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

  // ── 2.5. LangGraph backend orchestration (optional) ──────
  let backend: BackendResponse | null = null
  const LANGGRAPH_URL = process.env.LANGGRAPH_BACKEND_URL ?? 'http://localhost:8000'
  try {
    const ctrl = new AbortController()
    const abortTimer = setTimeout(() => ctrl.abort(), 8000)
    const backendRes = await fetch(`${LANGGRAPH_URL}/api/v1/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_message: userMessage,
        mode,
        user_id: userId,
        session_id: sessionId,
        conversation_history: history,
        memory: memory
          ? {
              preferredTone: memory.preferredTone,
              preferredLength: memory.preferredLength,
              preferredStrategies: memory.preferredStrategies,
              rawSummary: memory.rawSummary,
            }
          : {},
      }),
      signal: ctrl.signal,
    })
    clearTimeout(abortTimer)
    if (backendRes.ok) backend = await backendRes.json()
  } catch {
    // LangGraph backend unavailable — local pipeline fallback
  }

  // ── 3. Task Analysis ─────────────────────────────────────
  const taskAnalysis = backend?.task_analysis
    ? (backend.task_analysis as Awaited<ReturnType<typeof analyzeTask>>)
    : await analyzeTask(userMessage, history)

  // ── 3.5. Auto-resolve persona based on task type ─────────
  const activePersona = await resolvePersonaForTask(taskAnalysis.taskType)

  // ── 4. Web Search (if needed) ────────────────────────────
  // Skip if backend already handled search in its pipeline
  let searchContext: string | null = null
  if (!backend && taskAnalysis.needsWebSearch) {
    const searchQuery = userMessage.slice(0, 200)
    const results = await searchWeb(searchQuery)
    searchContext = buildSearchContext(results)
  }

  // ── 5. Build prompt ──────────────────────────────────────
  let systemPrompt: string
  let components: ReturnType<typeof buildSystemPrompt>['components']
  if (backend) {
    systemPrompt = backend.system_prompt
    components = {
      taskContext: '',
      memoryContext: '',
      examplesContext: '',
      persona: '',
      userRequest: '',
      flowContext: '',
      globalMemoryContext: '',
    }
  } else {
    const built = buildSystemPrompt(
      taskAnalysis, memory, [], searchContext,
      activePersona, undefined, undefined,
      userProfile as never,
      recentSummaries as string[],
    )
    systemPrompt = built.systemPrompt
    components = built.components
  }
  const promptVersion = await savePromptVersion(userId, systemPrompt, components, memory?.id ?? null)

  // ── 6. LEARNING MODE: return 3 candidates ────────────────
  if (mode === 'LEARNING') {
    const candidates = (
      backend?.candidates ??
      await generateCandidates(userMessage, systemPrompt, history, taskAnalysis, memory)
    ) as Awaited<ReturnType<typeof generateCandidates>>

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
    if (backend) headers['X-Backend'] = 'langgraph'

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
  const candidates = (
    backend?.candidates ??
    await generateCandidates(userMessage, systemPrompt, history, taskAnalysis, memory)
  ) as Awaited<ReturnType<typeof generateCandidates>>

  // Use backend ranking when available, otherwise rank locally
  let evaluations: Awaited<ReturnType<typeof evaluateCandidates>> = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ranked: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let best: any

  if (backend?.best_candidate && backend.candidates.length > 0) {
    ranked = backend.candidates
    best = backend.best_candidate
  } else {
    evaluations = await evaluateCandidates(userMessage, candidates, memory)
    ranked = rankCandidates(candidates, evaluations, memory)
    best = ranked[0]
  }

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
      ranked.map((c: BackendCandidate) =>
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
      evaluations.find((e: { index: number }) => e.index === best.index),
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

  // Build the final user message content (text + optional images)
  type UserContent = string | Array<{ type: 'text'; text: string } | { type: 'image'; image: string; mimeType: string }>
  let finalUserContent: UserContent = userMessage
  if (imageFiles.length > 0) {
    finalUserContent = [
      { type: 'text', text: userMessage },
      ...imageFiles.map(f => ({ type: 'image' as const, image: f.content, mimeType: f.mimeType })),
    ]
  }

  const stream = streamText({
    model: provider.getModel(),
    system: systemPrompt,
    messages: [
      ...history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: finalUserContent },
    ],
    maxTokens: 2000,
    onFinish: async ({ text }) => {
      if (savedMessageId) {
        await prisma.message.update({
          where: { id: savedMessageId },
          data: { content: text },
        }).catch(() => {})
      }
      if (convId) await maybeSummarizeConversation(convId).catch(() => {})
    },
  })

  const response = stream.toDataStreamResponse()

  // Attach metadata headers
  const newHeaders = new Headers(response.headers)
  newHeaders.set('X-Conversation-Id', convId ?? '')
  newHeaders.set('X-Message-Id', savedMessageId ?? '')
  newHeaders.set('X-Strategy', best.strategy)
  newHeaders.set('X-Confidence', best.score?.toFixed(2) ?? '0.75')
  newHeaders.set('X-Task-Type', taskAnalysis.taskType)
  newHeaders.set('X-Search-Used', String(taskAnalysis.needsWebSearch))
  if (backend) newHeaders.set('X-Backend', 'langgraph')

  const setCookie = setSessionCookie(sessionId)
  Object.entries(setCookie).forEach(([k, v]) => newHeaders.set(k, v))

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  })
}
