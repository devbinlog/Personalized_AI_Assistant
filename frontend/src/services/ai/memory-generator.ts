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
  domainPreferences: z.record(z.number()),
  strategyWeights: z.record(z.number()),
  rawSummary: z.string(),
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
- rawSummary: 2-3 sentence human-readable summary of this user's preferences`

export async function generateMemory(
  userId: string,
  logs: Array<{
    selectedStrategy: string
    selectedTags: string[]
    taskType: string
    domain: string | null
    complexity: string | null
  }>,
): Promise<PreferenceMemory | null> {
  if (logs.length < 3) return null

  try {
    const provider = getLLMProvider()
    const logSummary = logs
      .map(
        (l, i) =>
          `[${i + 1}] Strategy: ${l.selectedStrategy}, Tags: [${l.selectedTags.join(', ')}], Task: ${l.taskType}, Domain: ${l.domain ?? 'general'}`,
      )
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
        preferredStrategies: data.preferredStrategies,
        avoidedPatterns: data.avoidedPatterns,
        domainPreferences: data.domainPreferences as never,
        strategyWeights: data.strategyWeights as never,
        rawSummary: data.rawSummary,
        logCount: logs.length,
      },
      update: {
        version: newVersion,
        preferredTone: data.preferredTone,
        preferredLength: data.preferredLength,
        preferredStructure: data.preferredStructure,
        preferredStrategies: data.preferredStrategies,
        avoidedPatterns: data.avoidedPatterns,
        domainPreferences: data.domainPreferences as never,
        strategyWeights: data.strategyWeights as never,
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
          snapshot: data as never,
          diff: diff as never,
          triggerLogCount: logs.length,
        },
      })
    }

    return memory as unknown as PreferenceMemory
  } catch (err) {
    console.error('Memory generation failed:', err)
    return null
  }
}

export async function getMemory(userId: string): Promise<PreferenceMemory | null> {
  try {
    return (await prisma.preferenceMemory.findUnique({
      where: { userId },
    })) as unknown as PreferenceMemory | null
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
