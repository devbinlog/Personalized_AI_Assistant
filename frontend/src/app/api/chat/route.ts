/**
 * Chat API — core of the Adaptive AI Assistant
 *
 * NORMAL mode:  analyze → (search?) → build prompt → generate 3 candidates
 *               → evaluate → rank → stream best candidate → save explanation
 *
 * LEARNING mode: same pipeline but return all 3 candidates (no streaming)
 *               → user selects → preference logged → memory updated
 *
 * Pipeline mirrors the LangGraph StateGraph architecture in /backend:
 *   task_analyzer_node → search_node → candidate_generator_node
 *   → evaluation_node → ranking_node → response_formatter_node
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
import type { ConversationMode, TaskType, ComplexityLevel } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ── LangGraph backend integration ────────────────────────────
type LangGraphResult = {
  mode: string
  candidates: Array<{ strategy: string; content: string; index: number; score: number; reasons: string[] }>
  best_candidate: { strategy: string; content: string; index: number; score: number } | null
  explanation: {
    selectedStrategy: string
    confidence: number
    memoryInfluence: string[]
    reasoningFactors: string[]
    rankingDetails: Array<{ strategy: string; score: number }>
  } | null
  task_analysis: {
    taskType: string
    complexity: string
    domain: string
    needsWebSearch: boolean
    expectedOutput: string
    preferredStyle: string
  }
  system_prompt: string
  evaluation_rubric: unknown[]
}

async function callLangGraph(payload: {
  user_message: string
  mode: string
  user_id: string
  session_id: string
  conversation_history: Array<{ role: string; content: string }>
  memory: Record<string, unknown>
  active_persona: Record<string, unknown>
  active_flow: Record<string, unknown>
  global_memory: Record<string, unknown>
}): Promise<LangGraphResult | null> {
  const baseUrl = process.env.LANGGRAPH_BACKEND_URL
  if (!baseUrl) return null
  try {
    const res = await fetch(`${baseUrl}/api/v1/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    return await res.json() as LangGraphResult
  } catch {
    return null
  }
}

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
    language = 'ko',
    files,
  }: {
    messages: Array<{ role: string; content: string }>
    conversationId?: string
    mode?: ConversationMode
    language?: 'ko' | 'en'
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

  // ── 1.5. Try LangGraph backend (optional orchestration layer) ─
  // Falls back silently to local pipeline if backend is unavailable
  const lgResult = await callLangGraph({
    user_message: userMessage,
    mode,
    user_id: userId,
    session_id: sessionId,
    conversation_history: history,
    memory: (memory ?? {}) as Record<string, unknown>,
    active_persona: {},
    active_flow: {},
    global_memory: {},
  })

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
  // Use LangGraph result if available, otherwise run locally
  const taskAnalysis = lgResult?.task_analysis
    ? {
        taskType: lgResult.task_analysis.taskType as TaskType,
        complexity: lgResult.task_analysis.complexity as ComplexityLevel,
        domain: lgResult.task_analysis.domain,
        needsWebSearch: lgResult.task_analysis.needsWebSearch,
        expectedOutput: lgResult.task_analysis.expectedOutput,
        preferredStyle: lgResult.task_analysis.preferredStyle,
        needsClarification: false,
        confidence: 0.8,
      }
    : await analyzeTask(userMessage, history)

  // ── 3.5. Auto-resolve persona + active flow ─────────────
  const [activePersona, activeFlow] = await Promise.all([
    resolvePersonaForTask(taskAnalysis.taskType, taskAnalysis.domain),
    prisma.conversationFlow.findFirst({ where: { isActive: true } }).catch(() => null),
  ])

  // ── 4. Web Search (if needed) ────────────────────────────
  // Skip if LangGraph already handled context; otherwise run locally
  // Priority: Tavily (if key set) → OpenAI search (if key set) → skip
  let searchContext: string | null = null
  if (!lgResult && taskAnalysis.needsWebSearch) {
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
  // Use LangGraph system_prompt if available; otherwise build locally
  const built = buildSystemPrompt(
    taskAnalysis, memory, [], searchContext,
    activePersona, activeFlow as never, undefined,
    userProfile as never,
    recentSummaries as string[],
    messageCount,
  )
  let systemPrompt = lgResult?.system_prompt ?? built.systemPrompt
  const components = built.components
  // 언어 오버라이드: 사용자가 명시적으로 영어를 선택한 경우
  if (language === 'en') {
    systemPrompt += '\n\n[CRITICAL LANGUAGE OVERRIDE — this rule takes absolute priority over all previous language rules, including the LANGUAGE RULE above]: The user has explicitly switched the interface to English mode. You MUST respond in English only, regardless of what language the user writes in. Do NOT follow the "detect language" rule for this conversation. Every response must be in English.'
  }
  // A/B 실험 승자 프롬프트 반영
  const winningPrompt = await getWinningSystemPrompt()
  if (winningPrompt) {
    systemPrompt += `\n\nEXPERIMENT OVERRIDE (from A/B test winner):\n${winningPrompt}`
  }

  const promptVersion = await savePromptVersion(userId, systemPrompt, components, memory?.id ?? null)

  // ── 6. LEARNING MODE: return 3 candidates ────────────────
  if (mode === 'LEARNING') {
    const candidates = lgResult?.candidates?.length
      ? lgResult.candidates
      : await generateCandidates(userMessage, systemPrompt, history, taskAnalysis, memory, imageFiles)

    // 학습 모드: 사용자가 선택하기 전까지 ASSISTANT 메시지 저장 안 함
    // 후보만 임시로 USER 메시지 ID에 연결해두고, /api/preferences에서 선택 시 저장
    const savedMessageId = undefined

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
  // Use LangGraph candidates + best if available; otherwise run local pipeline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let candidates: any[]
  let evaluations: Awaited<ReturnType<typeof evaluateCandidates>> = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ranked: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let best: any

  if (lgResult?.candidates?.length && lgResult.best_candidate) {
    candidates = lgResult.candidates
    ranked = lgResult.candidates.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    best = lgResult.best_candidate
  } else {
    candidates = await generateCandidates(userMessage, systemPrompt, history, taskAnalysis, memory, imageFiles)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ranked.map((c: any) =>
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

  const setCookie = setSessionCookie(sessionId)
  Object.entries(setCookie).forEach(([k, v]) => newHeaders.set(k, v))

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  })
}
