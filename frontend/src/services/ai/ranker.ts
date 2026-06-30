import type { CandidateEvaluation } from './evaluator'
import type { GeneratedCandidate } from './candidate-generator'
import type { PreferenceMemory, ResponseStrategy, CandidateRankDetail, ResponseEvaluation } from '@/types'

export interface RankedCandidate extends GeneratedCandidate {
  score: number
  rankDetails: CandidateRankDetail
  evaluationDetail?: Omit<ResponseEvaluation, 'id' | 'createdAt'>
}

export function rankCandidates(
  candidates: GeneratedCandidate[],
  evaluations: CandidateEvaluation[],
  memory: PreferenceMemory | null,
  expandedEvaluations?: Array<Omit<ResponseEvaluation, 'id' | 'createdAt'>>,
): RankedCandidate[] {
  const evalMap = new Map(evaluations.map(e => [e.index, e]))
  const expandedMap = new Map(expandedEvaluations?.map(e => [Number(e.candidateId), e]) ?? [])

  const ranked = candidates.map(candidate => {
    const evaluation = evalMap.get(candidate.index)
    const expanded = expandedMap.get(candidate.index)
    const score = computeScore(candidate.strategy, evaluation, memory, expanded)
    const reasons = buildReasons(candidate.strategy, evaluation, memory, expanded)

    return {
      ...candidate,
      score,
      rankDetails: {
        strategy: candidate.strategy,
        score,
        reasons,
      },
      ...(expanded && { evaluationDetail: expanded }),
    }
  })

  return ranked.sort((a, b) => b.score - a.score)
}

function computeScore(
  strategy: ResponseStrategy,
  evaluation: CandidateEvaluation | undefined,
  memory: PreferenceMemory | null,
  expanded?: Omit<ResponseEvaluation, 'id' | 'createdAt'>,
): number {
  // Use 18-dimension formula when expanded evaluation is available
  if (expanded) {
    return Math.min(
      1,
      expanded.overallScore * 0.4 +
        expanded.preferenceMatch * 0.25 +
        expanded.personaConsistency * 0.15 +
        expanded.instructionFollowing * 0.1 +
        expanded.searchGrounding * 0.1,
    )
  }

  if (!evaluation) return 0.5

  // Legacy 8-dimension weighted average
  const base =
    evaluation.structure * 0.1 +
    evaluation.readability * 0.15 +
    evaluation.specificity * 0.15 +
    evaluation.completeness * 0.15 +
    evaluation.professionalism * 0.1 +
    evaluation.formatting * 0.1 +
    evaluation.taskMatch * 0.15 +
    evaluation.preferenceMatch * 0.1

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
  expanded?: Omit<ResponseEvaluation, 'id' | 'createdAt'>,
): string[] {
  const reasons: string[] = []

  if (expanded) {
    if (expanded.clarity > 0.8) reasons.push('High clarity score')
    if (expanded.instructionFollowing > 0.8) reasons.push('Follows instructions well')
    if (expanded.personaConsistency > 0.8) reasons.push('Strong persona alignment')
    if (expanded.completeness > 0.8) reasons.push('Comprehensive coverage')
  } else if (evaluation) {
    if (evaluation.taskMatch > 0.8) reasons.push('Directly addresses the question')
    if (evaluation.readability > 0.8) reasons.push('High readability score')
    if (evaluation.completeness > 0.8) reasons.push('Comprehensive coverage')
  }

  if (memory) {
    if (memory.preferredStrategies.includes(strategy))
      reasons.push(`Matches your preferred strategy: ${strategy}`)
    if (memory.preferredStructure && strategy === 'STRUCTURED')
      reasons.push(`Matches your preferred structure: ${memory.preferredStructure}`)
    if ((expanded?.preferenceMatch ?? evaluation?.preferenceMatch ?? 0) > 0.7)
      reasons.push('Aligns well with your preference history')
  }

  if (reasons.length === 0) reasons.push('Best overall quality score')

  return reasons
}
