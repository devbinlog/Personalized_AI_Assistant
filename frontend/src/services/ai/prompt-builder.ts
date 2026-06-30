import { prisma } from '@/lib/prisma'
import { hashString } from '@/lib/utils'
import type { PreferenceMemory, TaskAnalysis, PromptComponents, Persona, ConversationFlow, GlobalPreferenceMemory, UserProfile } from '@/types'

const BASE_PERSONA = `You are an Adaptive AI Personal Assistant — a highly capable AI that handles any request.

You help with: programming, writing, research, planning, translation, productivity, career coaching, interview prep, learning, decision making, brainstorming, and any other task.

Be direct, accurate, and genuinely helpful. Adapt your response to the user's needs.`

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
): { systemPrompt: string; components: PromptComponents } {
  // Priority: persona → profile → flow → task → local memory → global memory → summaries → examples → search
  const personaFragment = activePersona?.promptFragment
    ? activePersona.promptFragment
    : activePersona
      ? `Respond in a ${activePersona.tone} tone with ${activePersona.speakingStyle} style.`
      : BASE_PERSONA

  const profileContext = userProfile ? buildProfileContext(userProfile) : ''
  const flowContext = activeFlow
    ? `CONVERSATION FLOW (${activeFlow.name}):\n${activeFlow.fallbackPolicy}`
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

  let systemPrompt = personaFragment
  if (profileContext) systemPrompt += `\n\n${profileContext}`
  if (flowContext) systemPrompt += `\n\n${flowContext}`
  if (taskContext) systemPrompt += `\n\n${taskContext}`
  if (memoryContext) systemPrompt += `\n\n${memoryContext}`
  if (globalMemoryContext) systemPrompt += `\n\n${globalMemoryContext}`
  if (summariesContext) systemPrompt += `\n\n${summariesContext}`
  if (examplesContext) systemPrompt += `\n\n${examplesContext}`
  if (searchContext) systemPrompt += `\n\n${searchContext}`

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
        components: components as never,
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
