import { generateObject } from 'ai'
import { z } from 'zod'
import { getLLMProvider } from './provider'
import { prisma } from '@/lib/prisma'
import type { PreferenceMemory } from '@/types'
import { MEMORY_UPDATE_THRESHOLD } from '@/lib/constants'

const MemorySchema = z.object({
  preferredTone: z.string().nullable(),
  preferredLength: z.string().nullable(),
  preferredStructure: z.string().nullable(),
  preferredStrategies: z.array(z.string()),
  avoidedPatterns: z.array(z.string()),
  domainPreferences: z.record(z.number()).optional().default({}),
  strategyWeights: z.record(z.number()).optional().default({}),
  rawSummary: z.string().optional().default(''),
})

type MemoryData = z.infer<typeof MemorySchema>

const SYSTEM_PROMPT = `You are analyzing a user's response preference history to build their Preference Memory profile.

Given a list of preference logs (each showing what response strategy and tags they selected), extract:
- preferredTone: "professional", "friendly", "neutral", etc. or null
- preferredLength: "concise", "medium", "detailed" or null
- preferredStructure: "paragraph", "bullet-points", "step-by-step", "structured" or null
- preferredStrategies: top strategies they select most (array of strings)
- avoidedPatterns: patterns they seem to avoid
- domainPreferences: { domain: weight } where weight 0-1 shows preference strength
- strategyWeights: { strategy: score } normalized 0-1
- rawSummary: 2-3문장으로 이 사용자의 선호도를 요약하세요. 반드시 한국어로 작성하세요.`

export async function generateMemory(
  userId: string,
  logs: Array<{
    selectedStrategy: string
    selectedTags: string | string[]
    taskType: string
    domain: string | null
    complexity: string | null
  }>,
): Promise<PreferenceMemory | null> {
  if (logs.length < 3) return null

  try {
    const provider = getLLMProvider()
    const logSummary = logs
      .map((l, i) => {
        const tags = Array.isArray(l.selectedTags)
          ? l.selectedTags
          : JSON.parse(l.selectedTags || '[]')
        return `[${i + 1}] Strategy: ${l.selectedStrategy}, Tags: [${tags.join(', ')}], Task: ${l.taskType}, Domain: ${l.domain ?? 'general'}`
      })
      .join('\n')

    const result = await generateObject({
      model: provider.getFastModel(),
      schema: MemorySchema,
      system: SYSTEM_PROMPT,
      prompt: `Preference logs (${logs.length} total):\n${logSummary}`,
    })

    const data = result.object as MemoryData

    const existing = await prisma.preferenceMemory.findUnique({ where: { userId } })
    const newVersion = (existing?.version ?? 0) + 1

    const memory = await prisma.preferenceMemory.upsert({
      where: { userId },
      create: {
        userId,
        version: 1,
        preferredTone: data.preferredTone,
        preferredLength: data.preferredLength,
        preferredStructure: data.preferredStructure,
        preferredStrategies: JSON.stringify(data.preferredStrategies),
        avoidedPatterns: JSON.stringify(data.avoidedPatterns),
        domainPreferences: data.domainPreferences ? JSON.stringify(data.domainPreferences) : null,
        strategyWeights: data.strategyWeights ? JSON.stringify(data.strategyWeights) : null,
        rawSummary: data.rawSummary,
        logCount: logs.length,
      },
      update: {
        version: newVersion,
        preferredTone: data.preferredTone,
        preferredLength: data.preferredLength,
        preferredStructure: data.preferredStructure,
        preferredStrategies: JSON.stringify(data.preferredStrategies),
        avoidedPatterns: JSON.stringify(data.avoidedPatterns),
        domainPreferences: data.domainPreferences ? JSON.stringify(data.domainPreferences) : null,
        strategyWeights: data.strategyWeights ? JSON.stringify(data.strategyWeights) : null,
        rawSummary: data.rawSummary,
        logCount: logs.length,
        lastUpdatedAt: new Date(),
      },
    })

    if (existing) {
      const diff = computeDiff(existing, data)
      await prisma.preferenceMemoryVersion.create({
        data: {
          memoryId: memory.id,
          version: newVersion,
          snapshot: JSON.stringify(data),
          diff: diff ? JSON.stringify(diff) : null,
          triggerLogCount: logs.length,
        },
      })
    }

    return parseMemoryRow(memory as unknown as Record<string, unknown>)
  } catch (err) {
    console.error('Memory generation failed:', err)
    return null
  }
}

function parseMemoryRow(row: Record<string, unknown>): PreferenceMemory {
  const safeParseArray = (v: unknown): string[] => {
    if (Array.isArray(v)) return v
    if (typeof v === 'string') { try { return JSON.parse(v) } catch { return [] } }
    return []
  }
  const safeParseObj = (v: unknown): Record<string, number> => {
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, number>
    if (typeof v === 'string') { try { return JSON.parse(v) } catch { return {} } }
    return {}
  }
  return {
    ...row,
    preferredStrategies: safeParseArray(row.preferredStrategies),
    avoidedPatterns: safeParseArray(row.avoidedPatterns),
    domainPreferences: safeParseObj(row.domainPreferences),
    strategyWeights: safeParseObj(row.strategyWeights),
  } as unknown as PreferenceMemory
}

export async function getMemory(userId: string): Promise<PreferenceMemory | null> {
  try {
    const row = await prisma.preferenceMemory.findUnique({ where: { userId } })
    if (!row) return null
    return parseMemoryRow(row as unknown as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function shouldUpdateMemory(userId: string): Promise<boolean> {
  try {
    const [logCount, memory] = await Promise.all([
      prisma.preferenceLog.count({ where: { userId } }),
      prisma.preferenceMemory.findUnique({ where: { userId }, select: { logCount: true } }),
    ])
    const lastCount = memory?.logCount ?? 0
    return logCount - lastCount >= MEMORY_UPDATE_THRESHOLD
  } catch {
    return false
  }
}

function computeDiff(
  previous: Record<string, unknown>,
  current: MemoryData,
): Array<{ field: string; previousValue: unknown; currentValue: unknown }> {
  const fields = ['preferredTone', 'preferredLength', 'preferredStructure'] as const
  return fields
    .filter(f => previous[f] !== current[f])
    .map(f => ({ field: f, previousValue: previous[f], currentValue: current[f] }))
}
