import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/ai/provider', () => ({
  getLLMProvider: vi.fn(() => ({
    getFastModel: vi.fn(() => 'mock-fast-model'),
    getModel: vi.fn(() => 'mock-model'),
  })),
}))

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

import { evaluateCandidates } from '@/services/ai/evaluator'
import { generateObject } from 'ai'
import type { GeneratedCandidate } from '@/services/ai/candidate-generator'
import type { PreferenceMemory } from '@/types'

const mockGenerateObject = vi.mocked(generateObject)

const makeCandidates = (count: number): GeneratedCandidate[] =>
  Array.from({ length: count }, (_, i) => ({
    index: i,
    strategy: 'CONCISE' as const,
    content: `Candidate response number ${i} with some content here.`,
  }))

const makeScore = (index: number) => ({
  index,
  strategy: 'CONCISE',
  structure: 0.8,
  readability: 0.75,
  specificity: 0.7,
  completeness: 0.8,
  professionalism: 0.85,
  formatting: 0.9,
  preferenceMatch: 0.6,
  taskMatch: 0.75,
  overall: 0.77,
})

describe('evaluateCandidates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty array when given no candidates', async () => {
    const result = await evaluateCandidates('some query', [], null)
    expect(result).toEqual([])
    // LLM should never be called for empty input
    expect(mockGenerateObject).not.toHaveBeenCalled()
  })

  it('returns one score per candidate when LLM succeeds', async () => {
    const candidates = makeCandidates(3)
    mockGenerateObject.mockResolvedValueOnce({
      object: { scores: [makeScore(0), makeScore(1), makeScore(2)] },
    } as never)

    const result = await evaluateCandidates('Explain closures in JS', candidates, null)

    expect(result).toHaveLength(3)
  })

  it('all score dimensions are between 0 and 1', async () => {
    const candidates = makeCandidates(2)
    mockGenerateObject.mockResolvedValueOnce({
      object: { scores: [makeScore(0), makeScore(1)] },
    } as never)

    const result = await evaluateCandidates('test query', candidates, null)

    for (const score of result) {
      expect(score.structure).toBeGreaterThanOrEqual(0)
      expect(score.structure).toBeLessThanOrEqual(1)
      expect(score.readability).toBeGreaterThanOrEqual(0)
      expect(score.readability).toBeLessThanOrEqual(1)
      expect(score.overall).toBeGreaterThanOrEqual(0)
      expect(score.overall).toBeLessThanOrEqual(1)
    }
  })

  it('falls back to default scores (0.7) when LLM throws', async () => {
    const candidates = makeCandidates(2)
    mockGenerateObject.mockRejectedValueOnce(new Error('LLM error'))

    const result = await evaluateCandidates('test query', candidates, null)

    expect(result).toHaveLength(2)
    // Fallback scores are 0.7 for most dimensions
    for (const score of result) {
      expect(score.structure).toBe(0.7)
      expect(score.overall).toBe(0.7)
    }
  })

  it('includes memory context in prompt when memory is provided', async () => {
    const candidates = makeCandidates(1)
    const memory: Partial<PreferenceMemory> = {
      preferredTone: 'casual',
      preferredLength: 'short',
      preferredStructure: 'bullets',
    }

    mockGenerateObject.mockResolvedValueOnce({
      object: { scores: [makeScore(0)] },
    } as never)

    await evaluateCandidates('test query', candidates, memory as PreferenceMemory)

    const callArgs = mockGenerateObject.mock.calls[0][0] as { prompt: string }
    expect(callArgs.prompt).toContain('casual')
  })
})
