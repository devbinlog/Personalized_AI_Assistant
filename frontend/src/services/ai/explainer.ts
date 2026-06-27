import { generateObject } from 'ai'
import { z } from 'zod'
import { getLLMProvider } from './provider'
import type { PreferenceMemory, ResponseStrategy, ResponseExplanation, ConfidenceBreakdown } from '@/types'
import type { RankedCandidate } from './ranker'
import type { CandidateEvaluation } from './evaluator'
import { prisma } from '@/lib/prisma'

const ExplanationSchema = z.object({
  memoryInfluence: z.array(z.string()).max(5),
  reasoningFactors: z.array(z.string()).max(5),
})

type ExplanationData = z.infer<typeof ExplanationSchema>

export async function generateExplanation(
  messageId: string,
  userQuery: string,
  selectedCandidate: RankedCandidate,
  allCandidates: RankedCandidate[],
  evaluation: CandidateEvaluation | undefined,
  memory: PreferenceMemory | null,
  promptVersion: number,
): Promise<ResponseExplanation> {
  const confidence = computeConfidence(selectedCandidate, evaluation, memory)

  let memoryInfluence: string[] = []
  let reasoningFactors: string[] = []

  try {
    const provider = getLLMProvider()
    const memoryContext = memory
      ? `Preference memory (v${memory.version}): tone=${memory.preferredTone}, structure=${memory.preferredStructure}, preferred=${memory.preferredStrategies.join(', ')}`
      : 'No preference memory yet'

    const result = await generateObject({
      model: provider.getFastModel(),
      schema: ExplanationSchema,
      system: `Generate a concise, product-level explanation of why a specific AI response was selected.
Do NOT expose chain-of-thought or internal LLM reasoning.
Write from the perspective of the AI system explaining its personalization decisions.
Each item should be one clear sentence the user can understand.`,
      prompt: `Selected strategy: ${selectedCandidate.strategy}
User query: "${userQuery}"
${memoryContext}
Selection score: ${selectedCandidate.score.toFixed(2)}

Generate memoryInfluence (how memory shaped this choice) and reasoningFactors (why this response fits this query).`,
    })

    const data = result.object as ExplanationData
    memoryInfluence = data.memoryInfluence
    reasoningFactors = data.reasoningFactors
  } catch {
    memoryInfluence = memory
      ? [`Preference Memory v${memory.version} influenced strategy selection`]
      : ['No preference data available yet']
    reasoningFactors = [
      `${selectedCandidate.strategy} strategy scored highest for this query type`,
      ...selectedCandidate.rankDetails.reasons,
    ]
  }

  const explanation: Omit<ResponseExplanation, 'id' | 'createdAt'> = {
    messageId,
    selectedStrategy: selectedCandidate.strategy,
    confidence: confidence.overall,
    memoryInfluence,
    reasoningFactors,
    memorySnapshot: memory,
    rankingDetails: allCandidates.map(c => ({
      strategy: c.strategy,
      score: c.score,
      reasons: c.rankDetails.reasons,
    })),
    promptVersion,
  }

  try {
    const saved = await prisma.responseExplanation.create({
      data: {
        messageId,
        selectedStrategy: explanation.selectedStrategy,
        confidence: explanation.confidence,
        memoryInfluence: explanation.memoryInfluence,
        reasoningFactors: explanation.reasoningFactors,
        memorySnapshot: (memory ?? {}) as never,
        rankingDetails: (explanation.rankingDetails ?? []) as never,
        promptVersion: explanation.promptVersion,
      },
    })
    return { ...explanation, id: saved.id, createdAt: saved.createdAt }
  } catch {
    return { ...explanation, id: 'temp', createdAt: new Date() }
  }
}

function computeConfidence(
  selected: RankedCandidate,
  evaluation: CandidateEvaluation | undefined,
  memory: PreferenceMemory | null,
): ConfidenceBreakdown {
  const preferenceMatch = evaluation?.preferenceMatch ?? 0.5
  const promptMatch = memory ? 0.8 : 0.5
  const taskMatch = evaluation?.taskMatch ?? 0.7
  const searchConfidence = 0.8
  const recentSimilarity = memory ? Math.min(1, (memory.logCount ?? 0) / 20) : 0

  const overall =
    preferenceMatch * 0.3 +
    promptMatch * 0.2 +
    taskMatch * 0.25 +
    searchConfidence * 0.1 +
    recentSimilarity * 0.15

  return { preferenceMatch, promptMatch, taskMatch, searchConfidence, recentSimilarity, overall }
}
