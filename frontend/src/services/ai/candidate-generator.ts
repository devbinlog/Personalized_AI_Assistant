import { generateText } from 'ai'
import { getLLMProvider } from './provider'
import type { TaskAnalysis, PreferenceMemory, ResponseStrategy } from '@/types'
import { LEARNING_CANDIDATES_COUNT } from '@/lib/constants'

const STRATEGY_SETS: ResponseStrategy[][] = [
  ['STRUCTURED', 'CONCISE', 'ANALYTICAL'],
  ['PROFESSIONAL', 'FRIENDLY', 'ACTIONABLE'],
  ['EDUCATIONAL', 'DIRECT', 'COMPREHENSIVE'],
]

function pickStrategies(taskType: string): ResponseStrategy[] {
  if (taskType === 'PROGRAMMING' || taskType === 'RESEARCH') return STRATEGY_SETS[2]
  if (taskType === 'CAREER' || taskType === 'INTERVIEW') return STRATEGY_SETS[1]
  return STRATEGY_SETS[0]
}

const STRATEGY_INSTRUCTIONS: Record<ResponseStrategy, string> = {
  CONCISE: 'Be extremely concise. Get to the point immediately. Minimal words, maximum clarity.',
  STRUCTURED: 'Use clear headings, bullet points, and numbered lists. Organize hierarchically.',
  PROFESSIONAL: 'Use formal, expert-level language. Be authoritative and thorough.',
  ANALYTICAL: 'Break down the problem systematically. Show clear reasoning and analysis.',
  FRIENDLY: 'Be warm, conversational, and encouraging. Use simple accessible language.',
  ACTIONABLE: 'Focus on concrete next steps. Every sentence should drive toward action.',
  EDUCATIONAL: 'Explain concepts clearly with examples. Build understanding progressively.',
  CREATIVE: 'Approach from an unexpected angle. Be imaginative and original.',
  DIRECT: 'Answer first, explain after. No preamble, no filler.',
  COMPREHENSIVE: 'Cover all aspects thoroughly. Leave nothing important unaddressed.',
}

export interface GeneratedCandidate {
  strategy: ResponseStrategy
  content: string
  index: number
}

export async function generateCandidates(
  userMessage: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  taskAnalysis: TaskAnalysis,
  _memory?: PreferenceMemory | null,
): Promise<GeneratedCandidate[]> {
  const provider = getLLMProvider()
  const strategies = pickStrategies(taskAnalysis.taskType)

  const candidatePromises = strategies.map(async (strategy, index) => {
    const instruction = STRATEGY_INSTRUCTIONS[strategy]
    const augmentedSystem = `${systemPrompt}\n\n---\nRESPONSE STYLE: ${instruction}\nStrategy: ${strategy}`

    const { text } = await generateText({
      model: provider.getModel(),
      system: augmentedSystem,
      messages: [
        ...conversationHistory.slice(-8).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userMessage },
      ],
      maxTokens: 1500,
    })

    return { strategy, content: text, index }
  })

  const results = await Promise.allSettled(candidatePromises)
  return results
    .filter((r): r is PromiseFulfilledResult<GeneratedCandidate> => r.status === 'fulfilled')
    .map(r => r.value)
    .slice(0, LEARNING_CANDIDATES_COUNT)
}
