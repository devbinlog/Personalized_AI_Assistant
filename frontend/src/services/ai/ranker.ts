import type { CandidateEvaluation } from './evaluator'
import type { GeneratedCandidate } from './candidate-generator'
import type { PreferenceMemory, ResponseStrategy, CandidateRankDetail } from '@/types'

export interface RankedCandidate extends GeneratedCandidate {
  score: number
  rankDetails: CandidateRankDetail
}

export function rankCandidates(
  candidates: GeneratedCandidate[],
  evaluations: CandidateEvaluation[],
  memory: PreferenceMemory | null,
): RankedCandidate[] {
  const evalMap = new Map(evaluations.map(e => [e.index, e]))

  const ranked = candidates.map(candidate => {
    const evaluation = evalMap.get(candidate.index)
    const score = computeScore(candidate.strategy, evaluation, memory)
    const reasons = buildReasons(candidate.strategy, evaluation, memory)

    return {
      ...candidate,
      score,
      rankDetails: {
        strategy: candidate.strategy,
        score,
        reasons,
      },
    }
  })

  return ranked.sort((a, b) => b.score - a.score)
}

function computeScore(
  strategy: ResponseStrategy,
  evaluation: CandidateEvaluation | undefined,
  memory: PreferenceMemory | null,
): number {
  if (!evaluation) return 0.5

  // Base: weighted average of evaluation dimensions
  const base =
    evaluation.structure * 0.1 +
    evaluation.readability * 0.15 +
    evaluation.specificity * 0.15 +
    evaluation.completeness * 0.15 +
    evaluation.professionalism * 0.1 +
    evaluation.formatting * 0.1 +
    evaluation.taskMatch * 0.15 +
    evaluation.preferenceMatch * 0.1

  // Memory bonus: boost strategies the user has historically preferred
  let memoryBonus = 0
  if (memory) {
    const weights = memory.strategyWeights as Record<string, number>
    if (weights?.[strategy]) memoryBonus = weights[strategy] * 0.2

    if (memory.preferredStrategies.includes(strategy)) memoryBonus += 0.1
  }

  return Math.min(1, base + memoryBonus)
}

function buildReasons(
  strategy: ResponseStrategy,
  evaluation: CandidateEvaluation | undefined,
  memory: PreferenceMemory | null,
): string[] {
  const reasons: string[] = []

  if (evaluation) {
    if (evaluation.taskMatch > 0.8) reasons.push('Directly addresses the question')
    if (evaluation.readability > 0.8) reasons.push('High readability score')
    if (evaluation.completeness > 0.8) reasons.push('Comprehensive coverage')
  }

  if (memory) {
    if (memory.preferredStrategies.includes(strategy))
      reasons.push(`Matches your preferred strategy: ${strategy}`)
    if (memory.preferredStructure && strategy === 'STRUCTURED')
      reasons.push(`Matches your preferred structure: ${memory.preferredStructure}`)
    if (evaluation?.preferenceMatch && evaluation.preferenceMatch > 0.7)
      reasons.push('Aligns well with your preference history')
  }

  if (reasons.length === 0) reasons.push('Best overall quality score')

  return reasons
}
