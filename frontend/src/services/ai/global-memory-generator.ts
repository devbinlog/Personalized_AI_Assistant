import { prisma } from '@/lib/prisma'
import type { GlobalPreferenceMemory, ResponseStrategy } from '@/types'

function dbToGlobal(row: Record<string, unknown>): GlobalPreferenceMemory {
  return {
    ...row,
    mostSelectedStrategies: JSON.parse((row.mostSelectedStrategies as string) || '[]'),
    commonReasonTags: JSON.parse((row.commonReasonTags as string) || '[]'),
    domainPreferences: JSON.parse((row.domainPreferences as string) || '[]'),
    globallyAvoidedPatterns: JSON.parse((row.globallyAvoidedPatterns as string) || '[]'),
    highPerformingPatterns: JSON.parse((row.highPerformingPatterns as string) || '[]'),
    lowPerformingPatterns: JSON.parse((row.lowPerformingPatterns as string) || '[]'),
    personaPerformance: JSON.parse((row.personaPerformance as string) || '[]'),
    flowPerformance: JSON.parse((row.flowPerformance as string) || '[]'),
  } as GlobalPreferenceMemory
}

export async function getGlobalMemory(): Promise<GlobalPreferenceMemory | null> {
  try {
    const row = await prisma.globalPreferenceMemory.findFirst({ orderBy: { updatedAt: 'desc' } })
    return row ? dbToGlobal(row as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export async function shouldUpdateGlobalMemory(): Promise<boolean> {
  const current = await prisma.globalPreferenceMemory.findFirst({ orderBy: { updatedAt: 'desc' } })
  const totalLogs = await prisma.preferenceLog.count()
  if (!current) return totalLogs >= 1
  return totalLogs - current.totalLogsAnalyzed >= 50
}

export async function generateGlobalMemory(): Promise<GlobalPreferenceMemory> {
  const logs = await prisma.preferenceLog.findMany({ orderBy: { createdAt: 'desc' } })

  const strategyCounts: Record<string, number> = {}
  const tagCounts: Record<string, number> = {}
  const domainStrategyMap: Record<string, Record<string, number>> = {}

  for (const log of logs) {
    const strategy = log.selectedStrategy
    strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1

    const tags: string[] = JSON.parse((log.selectedTags as string) || '[]')
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }

    const domain = log.domain || 'general'
    if (!domainStrategyMap[domain]) domainStrategyMap[domain] = {}
    domainStrategyMap[domain][strategy] = (domainStrategyMap[domain][strategy] || 0) + 1
  }

  const mostSelectedStrategies = Object.entries(strategyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([strategy, count]) => ({ strategy: strategy as ResponseStrategy, count }))

  const commonReasonTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }))

  const domainPreferences = Object.entries(domainStrategyMap).map(([domain, strategies]) => {
    const best = Object.entries(strategies).sort((a, b) => b[1] - a[1])[0]
    return {
      domain,
      strategy: (best?.[0] ?? 'STRUCTURED') as ResponseStrategy,
      avgScore: 0.75,
    }
  })

  const summary =
    mostSelectedStrategies.length > 0
      ? `${logs.length}개 인터랙션 분석 완료. 최다 전략: ${mostSelectedStrategies[0].strategy}. 최다 태그: ${commonReasonTags[0]?.tag ?? '없음'}.`
      : '아직 선호도 데이터가 없습니다.'

  const data = {
    mostSelectedStrategies: JSON.stringify(mostSelectedStrategies),
    commonReasonTags: JSON.stringify(commonReasonTags),
    domainPreferences: JSON.stringify(domainPreferences),
    globallyAvoidedPatterns: JSON.stringify([]),
    highPerformingPatterns: JSON.stringify(
      mostSelectedStrategies.slice(0, 3).map(s => s.strategy),
    ),
    lowPerformingPatterns: JSON.stringify([]),
    personaPerformance: JSON.stringify([]),
    flowPerformance: JSON.stringify([]),
    summary,
    totalLogsAnalyzed: logs.length,
    updatedAt: new Date(),
  }

  const existing = await prisma.globalPreferenceMemory.findFirst()
  let row: Record<string, unknown>
  if (existing) {
    row = (await prisma.globalPreferenceMemory.update({
      where: { id: existing.id },
      data: data as never,
    })) as Record<string, unknown>
  } else {
    row = (await prisma.globalPreferenceMemory.create({
      data: data as never,
    })) as Record<string, unknown>
  }

  return dbToGlobal(row)
}
