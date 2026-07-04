import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the LLM provider and the 'ai' package before importing analyzeTask
vi.mock('@/services/ai/provider', () => ({
  getLLMProvider: vi.fn(() => ({
    getFastModel: vi.fn(() => 'mock-fast-model'),
    getModel: vi.fn(() => 'mock-model'),
  })),
}))

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

import { analyzeTask } from '@/services/ai/task-analyzer'
import { generateObject } from 'ai'
import type { TaskAnalysis } from '@/types'

const mockGenerateObject = vi.mocked(generateObject)

const VALID_TASK_TYPES = [
  'CONVERSATION', 'KNOWLEDGE', 'PROGRAMMING', 'WRITING', 'TRANSLATION',
  'BRAINSTORMING', 'RESEARCH', 'PLANNING', 'LEARNING', 'PRODUCTIVITY',
  'SUMMARIZATION', 'CAREER', 'INTERVIEW', 'DECISION', 'SEARCH_REQUIRED', 'OTHER',
] as const

describe('analyzeTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a valid TaskAnalysis when LLM succeeds', async () => {
    const mockResult: TaskAnalysis = {
      taskType: 'PROGRAMMING',
      expectedOutput: 'Code solution',
      complexity: 'MEDIUM',
      domain: 'software',
      needsClarification: false,
      needsWebSearch: false,
      preferredStyle: 'step-by-step',
      confidence: 0.9,
    }

    mockGenerateObject.mockResolvedValueOnce({ object: mockResult } as never)

    const result = await analyzeTask('How do I write a binary search in TypeScript?')

    expect(result.taskType).toBe('PROGRAMMING')
    expect(result.complexity).toBe('MEDIUM')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
    expect(VALID_TASK_TYPES).toContain(result.taskType)
  })

  it('falls back to CONVERSATION defaults when LLM throws', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('LLM unavailable'))

    const result = await analyzeTask('Hello, how are you?')

    expect(result.taskType).toBe('CONVERSATION')
    expect(result.complexity).toBe('LOW')
    expect(result.needsWebSearch).toBe(false)
    expect(result.confidence).toBe(0.5)
  })

  it('passes recent messages to the LLM call', async () => {
    const mockResult: TaskAnalysis = {
      taskType: 'KNOWLEDGE',
      expectedOutput: 'Factual answer',
      complexity: 'LOW',
      domain: 'general',
      needsClarification: false,
      needsWebSearch: false,
      preferredStyle: 'concise',
      confidence: 0.8,
    }

    mockGenerateObject.mockResolvedValueOnce({ object: mockResult } as never)

    const recentMessages = [
      { role: 'user', content: 'What is TypeScript?' },
      { role: 'assistant', content: 'TypeScript is a typed superset of JavaScript.' },
    ]

    await analyzeTask('Can you give me an example?', recentMessages)

    const callArgs = mockGenerateObject.mock.calls[0][0] as { messages: unknown[] }
    // Should include the 2 recent messages + 1 current message = 3 total
    expect(callArgs.messages).toHaveLength(3)
  })

  it('returns a taskType that is one of the valid enum values', async () => {
    const mockResult: TaskAnalysis = {
      taskType: 'RESEARCH',
      expectedOutput: 'Research summary',
      complexity: 'HIGH',
      domain: 'science',
      needsClarification: false,
      needsWebSearch: true,
      preferredStyle: 'detailed',
      confidence: 0.85,
    }

    mockGenerateObject.mockResolvedValueOnce({ object: mockResult } as never)

    const result = await analyzeTask('What are the latest advancements in quantum computing?')

    expect(VALID_TASK_TYPES).toContain(result.taskType)
    expect(typeof result.needsWebSearch).toBe('boolean')
  })
})
