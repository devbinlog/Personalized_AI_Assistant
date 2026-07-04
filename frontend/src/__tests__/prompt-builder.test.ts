import { describe, it, expect, vi } from 'vitest'

// Mock Prisma and hashString (only needed for savePromptVersion, not tested here)
vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/utils', () => ({ hashString: (s: string) => s.slice(0, 8) }))

import { buildSystemPrompt } from '@/services/ai/prompt-builder'
import type { TaskAnalysis, PreferenceMemory } from '@/types'

const baseTask: TaskAnalysis = {
  taskType: 'PROGRAMMING',
  expectedOutput: 'Code solution',
  complexity: 'MEDIUM',
  domain: 'software',
  needsClarification: false,
  needsWebSearch: false,
  preferredStyle: 'step-by-step',
  confidence: 0.9,
}

const baseMemory: PreferenceMemory = {
  id: 'mem-1',
  userId: 'user-1',
  preferredTone: 'concise',
  preferredLength: 'medium',
  preferredStructure: 'bullet-points',
  preferredStrategies: ['step-by-step', 'examples'],
  avoidedPatterns: ['verbose-intro'],
  domainPreferences: {},
  strategyWeights: {},
  rawSummary: 'User prefers short, structured answers.',
  totalLogs: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('buildSystemPrompt', () => {
  it('returns a non-empty systemPrompt string', () => {
    const { systemPrompt } = buildSystemPrompt(baseTask, null, [], null)
    expect(typeof systemPrompt).toBe('string')
    expect(systemPrompt.length).toBeGreaterThan(0)
  })

  it('includes task context in the system prompt', () => {
    const { systemPrompt } = buildSystemPrompt(baseTask, null, [], null)
    expect(systemPrompt).toContain('PROGRAMMING')
    expect(systemPrompt).toContain('MEDIUM')
  })

  it('includes memory context when memory is provided', () => {
    const { systemPrompt } = buildSystemPrompt(baseTask, baseMemory, [], null)
    expect(systemPrompt).toContain('concise')
    expect(systemPrompt).toContain('step-by-step')
    expect(systemPrompt).toContain('verbose-intro')
  })

  it('omits memory context when memory is null', () => {
    const { systemPrompt } = buildSystemPrompt(baseTask, null, [], null)
    expect(systemPrompt).not.toContain('USER PREFERENCE MEMORY')
  })

  it('includes search context when provided', () => {
    const { systemPrompt } = buildSystemPrompt(baseTask, null, [], 'SEARCH RESULT: TypeScript 5.4 released')
    expect(systemPrompt).toContain('TypeScript 5.4 released')
  })

  it('includes examples context when recent examples are provided', () => {
    const { systemPrompt } = buildSystemPrompt(baseTask, null, ['Example response A', 'Example response B'], null)
    expect(systemPrompt).toContain('Example response A')
  })

  it('limits examples to 2 even when more are provided', () => {
    const { systemPrompt } = buildSystemPrompt(
      baseTask, null,
      ['Ex A', 'Ex B', 'Ex C should be excluded'],
      null,
    )
    expect(systemPrompt).not.toContain('Ex C should be excluded')
  })

  it('returns correct component keys', () => {
    const { components } = buildSystemPrompt(baseTask, baseMemory, [], null)
    expect(components).toHaveProperty('taskContext')
    expect(components).toHaveProperty('memoryContext')
    expect(components).toHaveProperty('examplesContext')
    expect(components).toHaveProperty('persona')
    expect(components).toHaveProperty('flowContext')
    expect(components).toHaveProperty('globalMemoryContext')
  })

  it('uses persona prompt fragment when activePersona is provided', () => {
    const persona = {
      id: 'p1',
      userId: 'user-1',
      name: 'Expert',
      description: 'Technical expert',
      tone: 'professional',
      speakingStyle: 'formal',
      promptFragment: 'You are a world-class software architect.',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const { systemPrompt } = buildSystemPrompt(baseTask, null, [], null, persona as never)
    expect(systemPrompt).toContain('world-class software architect')
  })

  it('includes TODAY date in base persona', () => {
    const { systemPrompt } = buildSystemPrompt(baseTask, null, [], null)
    const year = new Date().getFullYear().toString()
    expect(systemPrompt).toContain(year)
  })
})
