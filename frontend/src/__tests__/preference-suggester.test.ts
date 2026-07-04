import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/ai/provider', () => ({
  getLLMProvider: vi.fn(() => ({
    getFastModel: vi.fn(() => 'mock-model'),
    getModel: vi.fn(() => 'mock-model'),
  })),
}))

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    preferenceSuggestion: {
      create: vi.fn(),
    },
  },
}))

import { detectSuggestions } from '@/services/ai/preference-suggester'
import { generateObject } from 'ai'
import { prisma } from '@/lib/prisma'

const mockGenerateObject = vi.mocked(generateObject)
const mockCreate = vi.mocked(prisma.preferenceSuggestion.create)

const buildLogs = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `log-${i}`,
    selectedStrategy: 'STEP_BY_STEP',
    selectedTags: JSON.stringify(['concise', 'structured']),
    taskType: 'PROGRAMMING',
    domain: 'software',
  }))

describe('detectSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when fewer than 5 logs', async () => {
    const result = await detectSuggestions('user-1', buildLogs(4), null)
    expect(result).toEqual([])
    expect(mockGenerateObject).not.toHaveBeenCalled()
  })

  it('calls LLM when 5 or more logs are provided', async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: { suggestions: [] } } as never)

    await detectSuggestions('user-1', buildLogs(5), null)
    expect(mockGenerateObject).toHaveBeenCalledOnce()
  })

  it('returns empty array on LLM error', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('LLM error'))

    const result = await detectSuggestions('user-1', buildLogs(6), null)
    expect(result).toEqual([])
  })

  it('handles selectedTags as a pre-parsed array', async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: { suggestions: [] } } as never)

    const logsWithArrayTags = buildLogs(5).map(l => ({
      ...l,
      selectedTags: ['concise', 'structured'] as unknown as string,
    }))

    await detectSuggestions('user-1', logsWithArrayTags, null)
    expect(mockGenerateObject).toHaveBeenCalledOnce()
  })

  it('saves and returns suggestions from LLM response', async () => {
    const suggestion = {
      type: 'tone',
      currentValue: null,
      suggestedValue: 'concise',
      rationale: 'You selected concise responses 8 times.',
      evidenceCount: 8,
    }

    mockGenerateObject.mockResolvedValueOnce({ object: { suggestions: [suggestion] } } as never)

    const dbRecord = { id: 'sug-1', ...suggestion, userId: 'user-1', status: 'PENDING' }
    mockCreate.mockResolvedValueOnce(dbRecord as never)

    const result = await detectSuggestions('user-1', buildLogs(8), { preferredTone: null })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'sug-1', type: 'tone', suggestedValue: 'concise' })
    expect(mockCreate).toHaveBeenCalledOnce()
  })
})
