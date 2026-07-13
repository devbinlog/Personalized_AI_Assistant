import { prisma } from '@/lib/prisma'
import { hashString } from '@/lib/utils'
import type { PreferenceMemory, TaskAnalysis, PromptComponents, Persona, ConversationFlow, GlobalPreferenceMemory, UserProfile } from '@/types'

function buildBasePersona(): string {
  const now = new Date()
  // Always use KST (UTC+9) regardless of server location
  const kstDate = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(now)
  const kstTime = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(now)
  const kstIsoDate = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
  }).format(now) // gives YYYY-MM-DD

  return `You are an Adaptive AI Personal Assistant — a highly capable AI that handles any request.

You help with: programming, writing, research, planning, translation, productivity, career coaching, interview prep, learning, decision making, brainstorming, and any other task.

Be direct, accurate, and genuinely helpful. Adapt your response to the user's needs.

CURRENT DATE AND TIME (KST, Korea Standard Time UTC+9): ${kstDate} ${kstTime} (${kstIsoDate})
When answering questions about current events, trending content, rankings, recent releases, prices, or anything time-sensitive — use this date as your reference. If web search results are provided in the context, prioritize them over your training data. If no search results are provided and the answer may have changed since your training, explicitly acknowledge that your information may be outdated.

LANGUAGE RULE: Always detect the language of the user's latest message and respond in that exact same language. If the user writes in Korean, respond in Korean. If in English, respond in English. Never switch languages unless explicitly asked.`
}

export function buildSystemPrompt(
  taskAnalysis: TaskAnalysis,
  memory: PreferenceMemory | null,
  recentExamples: string[],
  searchContext: string | null,
  activePersona?: Persona | null,
  activeFlow?: ConversationFlow | null,
  globalMemory?: GlobalPreferenceMemory | null,
  userProfile?: UserProfile | null,
  recentSummaries?: string[],
  messageCount?: number,
): { systemPrompt: string; components: PromptComponents } {
  // Priority: persona → profile → flow → task → local memory → global memory → summaries → examples → search
  const personaFragment = activePersona?.promptFragment
    ? activePersona.promptFragment
    : activePersona
      ? `Respond in a ${activePersona.tone} tone with ${activePersona.speakingStyle} style.`
      : buildBasePersona()

  const profileContext = userProfile ? buildProfileContext(userProfile) : ''
  const flowContext = activeFlow
    ? buildFlowContext(activeFlow)
    : ''

  const taskContext = buildTaskContext(taskAnalysis)
  const memoryContext = memory ? buildMemoryContext(memory) : ''
  const globalMemoryContext =
    globalMemory?.summary
      ? `GLOBAL LEARNING INSIGHTS:\n${globalMemory.summary}`
      : ''
  const summariesContext =
    recentSummaries && recentSummaries.length > 0
      ? `RECENT CONVERSATION CONTEXT:\n${recentSummaries.join('\n---\n')}`
      : ''
  const examplesContext = recentExamples.length > 0 ? buildExamplesContext(recentExamples) : ''

  // 초기 대화(3번 이내)에서 스타일 파악 질문 추가
  const onboardingInstruction = (messageCount !== undefined && messageCount <= 2 && !memory)
    ? `\n\nONBOARDING GUIDANCE: This is one of the user's first few messages (message #${messageCount + 1}). After answering their question naturally, add a brief personalization question at the end — ask about their preferred response style (concise vs detailed, bullet points vs prose, formal vs casual). Keep it short, 1-2 sentences max, conversational. Example: "참고로, 답변이 더 간결했으면 좋겠나요, 아니면 상세한 편이 좋으신가요?" Adjust language to match the user's language.`
    : ''

  let systemPrompt = personaFragment
  if (profileContext) systemPrompt += `\n\n${profileContext}`
  if (flowContext) systemPrompt += `\n\n${flowContext}`
  if (taskContext) systemPrompt += `\n\n${taskContext}`
  if (memoryContext) systemPrompt += `\n\n${memoryContext}`
  if (globalMemoryContext) systemPrompt += `\n\n${globalMemoryContext}`
  if (summariesContext) systemPrompt += `\n\n${summariesContext}`
  if (examplesContext) systemPrompt += `\n\n${examplesContext}`
  if (searchContext) systemPrompt += `\n\n${searchContext}`
  if (onboardingInstruction) systemPrompt += onboardingInstruction

  return {
    systemPrompt,
    components: {
      taskContext,
      memoryContext,
      examplesContext,
      persona: personaFragment,
      userRequest: '',
      flowContext,
      globalMemoryContext,
    },
  }
}

function buildTaskContext(task: TaskAnalysis): string {
  return `TASK CONTEXT:
- Type: ${task.taskType} | Complexity: ${task.complexity} | Domain: ${task.domain}
- Expected output: ${task.expectedOutput}
- Preferred style: ${task.preferredStyle}`
}

function buildMemoryContext(memory: PreferenceMemory): string {
  const lines: string[] = ['USER PREFERENCE MEMORY (apply these):']
  if (memory.preferredTone) lines.push(`- Tone: ${memory.preferredTone}`)
  if (memory.preferredLength) lines.push(`- Length: ${memory.preferredLength}`)
  if (memory.preferredStructure) lines.push(`- Structure: ${memory.preferredStructure}`)
  if (memory.preferredStrategies.length > 0)
    lines.push(`- Preferred: ${memory.preferredStrategies.join(', ')}`)
  if (memory.avoidedPatterns.length > 0)
    lines.push(`- Avoid: ${memory.avoidedPatterns.join(', ')}`)
  if (memory.rawSummary) lines.push(`\nContext: ${memory.rawSummary}`)
  return lines.join('\n')
}

function buildExamplesContext(examples: string[]): string {
  return `RECENT HIGH-QUALITY EXAMPLES:\n${examples.slice(0, 2).map((e, i) => `[${i + 1}] ${e}`).join('\n\n')}`
}

function buildFlowContext(flow: ConversationFlow): string {
  const lines: string[] = [`CONVERSATION FLOW — "${flow.name}" (domain: ${flow.domain})`]
  if (flow.description) lines.push(`Purpose: ${flow.description}`)
  if (flow.triggerCondition) lines.push(`Trigger: ${flow.triggerCondition}`)

  const steps = Array.isArray(flow.steps)
    ? flow.steps
    : JSON.parse((flow.steps as unknown as string) || '[]')

  if (steps.length > 0) {
    lines.push('Steps to follow in order:')
    steps.forEach((s: { name: string; instruction: string; searchPolicy?: string }, i: number) => {
      lines.push(`  ${i + 1}. ${s.name}: ${s.instruction}${s.searchPolicy && s.searchPolicy !== 'auto' ? ` [search: ${s.searchPolicy}]` : ''}`)
    })
  }
  if (flow.fallbackPolicy) lines.push(`Fallback: ${flow.fallbackPolicy}`)
  if (flow.clarificationPolicy) lines.push(`On unclear input: ${flow.clarificationPolicy}`)
  return lines.join('\n')
}

function buildProfileContext(profile: UserProfile): string {
  const lines: string[] = ['USER PROFILE (personalize responses based on this):']
  if (profile.displayName) lines.push(`- Name: ${profile.displayName}`)
  if (profile.occupation) lines.push(`- Occupation: ${profile.occupation}`)
  const interests = Array.isArray(profile.interests)
    ? profile.interests
    : JSON.parse(profile.interests as unknown as string || '[]')
  if (interests.length > 0) lines.push(`- Interests: ${interests.join(', ')}`)
  const goals = Array.isArray(profile.goals)
    ? profile.goals
    : JSON.parse(profile.goals as unknown as string || '[]')
  if (goals.length > 0) lines.push(`- Current goals: ${goals.join(', ')}`)
  if (profile.background) lines.push(`- Background: ${profile.background}`)
  lines.push(`- Language preference: ${profile.language}`)
  return lines.join('\n')
}

export async function savePromptVersion(
  userId: string,
  systemPrompt: string,
  components: PromptComponents,
  memoryId: string | null,
): Promise<number> {
  try {
    const latest = await prisma.promptVersion.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    })
    const version = (latest?.version ?? 0) + 1
    await prisma.promptVersion.create({
      data: {
        userId,
        version,
        systemPrompt,
        components: JSON.stringify(components) as never,
        memoryHash: memoryId ? hashString(memoryId) : null,
        tokenCount: Math.ceil(systemPrompt.length / 4),
      },
    })
    return version
  } catch {
    return 1
  }
}

export async function getLatestPromptVersion(userId: string) {
  try {
    return await prisma.promptVersion.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    })
  } catch {
    return null
  }
}
