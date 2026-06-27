import { generateObject } from 'ai'
import { z } from 'zod'
import { getLLMProvider } from './provider'
import type { GeneratedCandidate } from './candidate-generator'
import type { PreferenceMemory, ResponseStrategy } from '@/types'

const EvaluationSchema = z.object({
  scores: z.array(
    z.object({
      index: z.number(),
      strategy: z.string(),
      structure: z.number().min(0).max(1),
      readability: z.number().min(0).max(1),
      specificity: z.number().min(0).max(1),
      completeness: z.number().min(0).max(1),
      professionalism: z.number().min(0).max(1),
      formatting: z.number().min(0).max(1),
      preferenceMatch: z.number().min(0).max(1),
      taskMatch: z.number().min(0).max(1),
      overall: z.number().min(0).max(1),
    }),
  ),
})

type EvaluationResult = z.infer<typeof EvaluationSchema>

export interface CandidateEvaluation {
  index: number
  strategy: ResponseStrategy
  structure: number
  readability: number
  specificity: number
  completeness: number
  professionalism: number
  formatting: number
  preferenceMatch: number
  taskMatch: number
  overall: number
}

export async function evaluateCandidates(
  userQuery: string,
  candidates: GeneratedCandidate[],
  memory: PreferenceMemory | null,
): Promise<CandidateEvaluation[]> {
  if (candidates.length === 0) return []

  try {
    const provider = getLLMProvider()
    const memoryContext = memory
      ? `User preferences: tone=${memory.preferredTone}, length=${memory.preferredLength}, structure=${memory.preferredStructure}`
      : 'No preference data yet'

    const candidateSummaries = candidates.map(
      c => `Candidate ${c.index} (${c.strategy}): ${c.content.slice(0, 300)}...`,
    )

    const result = await generateObject({
      model: provider.getFastModel(),
      schema: EvaluationSchema,
      system: `You are an AI response evaluator. Score each candidate on 8 dimensions (0.0-1.0).
preferenceMatch: how well does it match the user's known preferences?
taskMatch: how well does it address the actual question?`,
      prompt: `User query: "${userQuery}"
${memoryContext}

Candidates:
${candidateSummaries.join('\n\n')}

Return scores for all ${candidates.length} candidates.`,
    })

    const data = result.object as EvaluationResult
    return data.scores.map(s => ({
      ...s,
      strategy: s.strategy as ResponseStrategy,
    })) as CandidateEvaluation[]
  } catch {
    return candidates.map(c => ({
      index: c.index,
      strategy: c.strategy,
      structure: 0.7,
      readability: 0.7,
      specificity: 0.7,
      completeness: 0.7,
      professionalism: 0.7,
      formatting: 0.7,
      preferenceMatch: 0.5,
      taskMatch: 0.7,
      overall: 0.7,
    }))
  }
}
