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
import { getWinningSystemPrompt } from '@/services/ai/experiment-runner'
import { detectSuggestions } from '@/services/ai/preference-suggester'
import { getMemory, shouldUpdateMemory, generateMemory } from '@/services/ai/memory-generator'
import { generateExplanation } from '@/services/ai/explainer'
import { maybeSummarizeConversation } from '@/services/ai/conversation-summarizer'
import { resolvePersonaForTask } from '@/services/ai/persona-manager'
import { extractAndSavePersonality } from '@/services/ai/personality-extractor'
import { searchWeb, buildSearchContext } from '@/services/search/tavily'
import { searchWithOpenAI } from '@/services/search/openai-search'
import { prisma } from '@/lib/prisma'
import { getOrCreateSession, setSessionCookie } from '@/lib/session'
import { resolveUserContext } from '@/lib/resolve-user'
import { rateLimit } from '@/lib/rate-limit'
import type { ConversationMode } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ── Attached file type (mirrors chat-input.tsx) ───────────────
type AttachedFile = {
  name: string
  type: 'image' | 'text' | 'pdf'
  content: string   // base64 for images/pdf, plain text for text
  mimeType: string
}

async function extractPdfText(base64: string): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
    const buffer = Buffer.from(base64, 'base64')
    const data = await pdfParse(buffer)
    return data.text.slice(0, 8000)
  } catch {
    return '[PDF 텍스트 추출 실패]'
  }
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

  // Rate limit: 20 requests per minute per session
  const rl = rateLimit(`chat:${sessionId}`, 20, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)),
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

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
  const messageCount = history.length // 이전 메시지 수 (0 = 첫 메시지)

  // Inject text + PDF contents into the user message; keep images separate for vision
  const textFiles = files?.filter(f => f.type === 'text') ?? []
  const imageFiles = files?.filter(f => f.type === 'image') ?? []
  const pdfFiles = files?.filter(f => f.type === 'pdf') ?? []

  // Extract text from PDFs server-side
  const pdfTexts = await Promise.all(
    pdfFiles.map(async f => {
      const text = await extractPdfText(f.content)
      return `[PDF 첨부: ${f.name}]\n${text}`
    }),
  )

  const fileContext = [
    ...textFiles.map(f => `[첨부 파일: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\``),
    ...pdfTexts,
  ].join('\n\n')

  const userMessage = fileContext
    ? `${rawUserMessage}\n\n${fileContext}`
    : rawUserMessage

  // ── 0. 성격/스타일 자기 묘사 감지 및 저장 (비동기, 응답 차단 안 함) ──
  // 사용자가 자신에 대해 묘사하는 패턴을 감지해 UserProfile에 저장

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

  // 성격 추출: 비동기로 실행 (응답 지연 없음)
  if (userId !== 'anonymous' && rawUserMessage.length > 15) {
    extractAndSavePersonality(userId, rawUserMessage).catch(() => {})
  }

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
  const activePersona = await resolvePersonaForTask(taskAnalysis.taskType, taskAnalysis.domain)

  // ── 4. Web Search (if needed) ────────────────────────────
  // Priority: Tavily (if key set) → OpenAI search (if key set) → skip
  let searchContext: string | null = null
  if (!backend && taskAnalysis.needsWebSearch) {
    const baseQuery = userMessage.slice(0, 180)
    const hasTavily = !!process.env.TAVILY_API_KEY
    const hasOpenAI = !!process.env.OPENAI_API_KEY

    let searchResults
    if (hasTavily) {
      const searchDays =
        taskAnalysis.taskType === 'SEARCH_REQUIRED' ? 14
        : taskAnalysis.taskType === 'RESEARCH' ? 180
        : 90
      searchResults = await searchWeb(baseQuery, 7, searchDays)
    } else if (hasOpenAI) {
      searchResults = await searchWithOpenAI(baseQuery)
    }

    if (searchResults) searchContext = buildSearchContext(searchResults)
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
      messageCount,
    )
    systemPrompt = built.systemPrompt
    components = built.components
  }
  // A/B 실험 승자 프롬프트 반영
  const winningPrompt = await getWinningSystemPrompt()
  if (winningPrompt) {
    systemPrompt += `\n\nEXPERIMENT OVERRIDE (from A/B test winner):\n${winningPrompt}`
  }

  const promptVersion = await savePromptVersion(userId, systemPrompt, components, memory?.id ?? null)

  // ── 6. LEARNING MODE: return 3 candidates ────────────────
  if (mode === 'LEARNING') {
    const candidates = (
      backend?.candidates ??
      await generateCandidates(userMessage, systemPrompt, history, taskAnalysis, memory, imageFiles)
    ) as Awaited<ReturnType<typeof generateCandidates>>

    // 학습 모드: 사용자가 선택하기 전까지 ASSISTANT 메시지 저장 안 함
    // 후보만 임시로 USER 메시지 ID에 연결해두고, /api/preferences에서 선택 시 저장
    const savedMessageId = undefined

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
    await generateCandidates(userMessage, systemPrompt, history, taskAnalysis, memory, imageFiles)
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
        taskAnalysis: JSON.stringify(taskAnalysis) as never,
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

    // Save evaluation for best candidate
    const bestEval = evaluations.find((e: { index: number }) => e.index === best.index)
    const bestCandidate = ranked.find((c: { index: number }) => c.index === best.index)
    if (bestEval && bestCandidate) {
      await prisma.responseEvaluation.upsert({
        where: { messageId: savedMsg.id },
        create: {
          messageId: savedMsg.id,
          candidateId: bestCandidate.id ?? savedMsg.id,
          // 미측정 차원: 0으로 명시 (측정되지 않음)
          naturalness: 0,
          grammar: 0,
          toneConsistency: 0,
          personaConsistency: 0,
          factualAccuracy: 0,
          hallucinationRisk: 0,
          actionability: 0,
          // 실측 9차원 값
          instructionFollowing: bestEval.taskMatch ?? 0,
          clarity: bestEval.readability ?? 0,
          structure: bestEval.structure ?? 0,
          completeness: bestEval.completeness ?? 0,
          specificity: bestEval.specificity ?? 0,
          readability: bestEval.readability ?? 0,
          formatting: bestEval.formatting ?? 0,
          preferenceMatch: bestEval.preferenceMatch ?? 0,
          // 항상 고정값
          safety: 1.0,
          // 조건부
          searchGrounding: taskAnalysis.needsWebSearch ? 0.8 : 0,
          overallScore: bestEval.overall ?? 0,
        },
        update: {},
      }).catch(() => {})
    }

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

    // 적응형 제안 탐지 (비동기, 응답 차단 안 함)
    if (userId !== 'anonymous') {
      prisma.preferenceLog
        .findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 })
        .then(logs => {
          if (logs.length >= 5) {
            return detectSuggestions(userId, logs as never, memory as never)
          }
        })
        .catch(() => {})
    }

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
