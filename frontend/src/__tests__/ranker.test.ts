import { describe, it, expect } from 'vitest'
import { rankCandidates } from '@/services/ai/ranker'
import type { GeneratedCandidate } from '@/services/ai/candidate-generator'
import type { CandidateEvaluation } from '@/services/ai/evaluator'
import type { PreferenceMemory } from '@/types'

// rankCandidates is a pure function — no LLM mocking needed

const makeCandidate = (index: number, strategy: GeneratedCandidate['strategy'] = 'CONCISE'): GeneratedCandidate => ({
  index,
  strategy,
  content: `Response content for candidate ${index}`,
})

const makeEval = (index: number, overall: number, extra: Partial<CandidateEvaluation> = {}): CandidateEvaluation => ({
  index,
  strategy: 'CONCISE',
  structure: overall,
  readability: overall,
  specificity: overall,
  completeness: overall,
  professionalism: overall,
  formatting: overall,
  preferenceMatch: overall,
  taskMatch: overall,
  overall,
  ...extra,
})

describe('rankCandidates', () => {
  it('sorts candidates by score descending', () => {
    const candidates = [makeCandidate(0), makeCandidate(1), makeCandidate(2)]
    const evaluations = [
      makeEval(0, 0.5),
      makeEval(1, 0.9),
      makeEval(2, 0.3),
    ]

    const result = rankCandidates(candidates, evaluations, null)

    expect(result[0].index).toBe(1) // highest score (0.9)
    expect(result[1].index).toBe(0) // mid score (0.5)
    expect(result[2].index).toBe(2) // lowest score (0.3)
  })

  it('applies memory preference bonus to preferred strategy', () => {
    const conciseCandidate = makeCandidate(0, 'CONCISE')
    const structuredCandidate = makeCandidate(1, 'STRUCTURED')

    // Both start with the same base evaluation score
    const evaluations = [makeEval(0, 0.6), makeEval(1, 0.6)]

    const memory: Partial<PreferenceMemory> = {
      preferredStrategies: ['CONCISE'],
      strategyWeights: { CONCISE: 0.5 } as Record<string, number>,
      preferredStructure: null,
    }

    const result = rankCandidates(
      [conciseCandidate, structuredCandidate],
      evaluations,
      memory as PreferenceMemory,
    )

    // CONCISE should rank first due to memory bonus
    expect(result[0].strategy).toBe('CONCISE')
    expect(result[0].score).toBeGreaterThan(result[1].score)
  })

  it('returns rankDetails with strategy, score, and reasons for each candidate', () => {
    const candidates = [makeCandidate(0), makeCandidate(1)]
    const evaluations = [makeEval(0, 0.7), makeEval(1, 0.8)]

    const result = rankCandidates(candidates, evaluations, null)

    for (const ranked of result) {
      expect(ranked.rankDetails).toBeDefined()
      expect(ranked.rankDetails.strategy).toBeDefined()
      expect(typeof ranked.rankDetails.score).toBe('number')
      expect(Array.isArray(ranked.rankDetails.reasons)).toBe(true)
      expect(ranked.rankDetails.reasons.length).toBeGreaterThan(0)
    }
  })

  it('scores are capped at 1.0 even with high memory bonus', () => {
    const candidate = makeCandidate(0, 'CONCISE')
    // Max out all eval scores
    const evaluation = makeEval(0, 1.0)

    const memory: Partial<PreferenceMemory> = {
      preferredStrategies: ['CONCISE'],
      strategyWeights: { CONCISE: 1.0 } as Record<string, number>,
      preferredStructure: null,
    }

    const result = rankCandidates([candidate], [evaluation], memory as PreferenceMemory)

    expect(result[0].score).toBeLessThanOrEqual(1)
  })

  it('handles missing evaluations gracefully — defaults to 0.5', () => {
    const candidates = [makeCandidate(0), makeCandidate(1)]
    // Provide evaluation for only one candidate
    const evaluations = [makeEval(0, 0.8)]

    const result = rankCandidates(candidates, evaluations, null)

    expect(result).toHaveLength(2)
    const noEvalCandidate = result.find(r => r.index === 1)
    expect(noEvalCandidate?.score).toBe(0.5)
  })
})
