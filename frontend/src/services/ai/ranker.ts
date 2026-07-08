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
    if (expanded.clarity > 0.8) reasons.push('명확성 점수가 높습니다')
    if (expanded.instructionFollowing > 0.8) reasons.push('지시사항을 잘 따릅니다')
    if (expanded.personaConsistency > 0.8) reasons.push('페르소나와 잘 일치합니다')
    if (expanded.completeness > 0.8) reasons.push('답변이 포괄적입니다')
  } else if (evaluation) {
    if (evaluation.taskMatch > 0.8) reasons.push('질문에 직접적으로 답변합니다')
    if (evaluation.readability > 0.8) reasons.push('가독성이 높습니다')
    if (evaluation.completeness > 0.8) reasons.push('답변이 포괄적입니다')
  }

  if (memory) {
    if (memory.preferredStrategies.includes(strategy))
      reasons.push(`선호 전략과 일치합니다: ${strategy}`)
    if (memory.preferredStructure && strategy === 'STRUCTURED')
      reasons.push(`선호 구조와 일치합니다: ${memory.preferredStructure}`)
    if ((expanded?.preferenceMatch ?? evaluation?.preferenceMatch ?? 0) > 0.7)
      reasons.push('선호도 기록과 잘 맞습니다')
  }

  if (reasons.length === 0) reasons.push('전체 품질 점수가 가장 높습니다')

  return reasons
}
