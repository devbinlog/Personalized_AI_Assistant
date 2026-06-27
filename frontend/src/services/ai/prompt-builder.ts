import { prisma } from '@/lib/prisma'
import { hashString } from '@/lib/utils'
import type { PreferenceMemory, TaskAnalysis, PromptComponents } from '@/types'

const BASE_PERSONA = `You are an Adaptive AI Personal Assistant — a highly capable AI that handles any request.

You help with: programming, writing, research, planning, translation, productivity, career coaching, interview prep, learning, decision making, brainstorming, and any other task.

Be direct, accurate, and genuinely helpful. Adapt your response to the user's needs.`

export function buildSystemPrompt(
  taskAnalysis: TaskAnalysis,
  memory: PreferenceMemory | null,
  recentExamples: string[],
  searchContext: string | null,
): { systemPrompt: string; components: PromptComponents } {
  const taskContext = buildTaskContext(taskAnalysis)
  const memoryContext = memory ? buildMemoryContext(memory) : ''
  const examplesContext = recentExamples.length > 0 ? buildExamplesContext(recentExamples) : ''

  let systemPrompt = BASE_PERSONA
  if (taskContext) systemPrompt += `\n\n${taskContext}`
  if (memoryContext) systemPrompt += `\n\n${memoryContext}`
  if (examplesContext) systemPrompt += `\n\n${examplesContext}`
  if (searchContext) systemPrompt += `\n\n${searchContext}`

  return {
    systemPrompt,
    components: {
      taskContext,
      memoryContext,
      examplesContext,
      persona: BASE_PERSONA,
      userRequest: '',
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
