import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateSession } from '@/lib/session'
import type { DashboardStats } from '@/types'

export async function GET(_req: NextRequest) {
  const sessionId = await getOrCreateSession()

  try {
    const user = await prisma.user.findUnique({ where: { sessionId } })
    if (!user) return NextResponse.json(emptyStats())

    const [
      totalConversations,
      totalMessages,
      totalPreferenceLogs,
      learningModeConversations,
      memory,
      latestPrompt,
      preferenceLogs,
      recentConvs,
    ] = await Promise.all([
      prisma.conversation.count({ where: { userId: user.id } }),
      prisma.message.count({
        where: { conversation: { userId: user.id } },
      }),
      prisma.preferenceLog.count({ where: { userId: user.id } }),
      prisma.conversation.count({ where: { userId: user.id, mode: 'LEARNING' } }),
      prisma.preferenceMemory.findUnique({ where: { userId: user.id } }),
      prisma.promptVersion.findFirst({
        where: { userId: user.id },
        orderBy: { version: 'desc' },
      }),
      prisma.preferenceLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.conversation.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { createdAt: true },
      }),
    ])

    // Top strategies
    const strategyCounts = preferenceLogs.reduce<Record<string, number>>((acc, l) => {
      acc[l.selectedStrategy] = (acc[l.selectedStrategy] ?? 0) + 1
      return acc
    }, {})
    const topStrategies = Object.entries(strategyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([strategy, count]) => ({ strategy: strategy as never, count }))

    // Top tags
    const tagCounts = preferenceLogs.reduce<Record<string, number>>((acc, l) => {
      for (const tag of l.selectedTags) {
        acc[tag] = (acc[tag] ?? 0) + 1
      }
      return acc
    }, {})
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag: tag as never, count }))

    // Activity by day (last 14 days)
    const activityMap = new Map<string, { conversations: number; preferences: number }>()
    for (const conv of recentConvs) {
      const day = conv.createdAt.toISOString().split('T')[0]
      const entry = activityMap.get(day) ?? { conversations: 0, preferences: 0 }
      entry.conversations += 1
      activityMap.set(day, entry)
    }
    for (const log of preferenceLogs.slice(0, 30)) {
      const day = log.createdAt.toISOString().split('T')[0]
      const entry = activityMap.get(day) ?? { conversations: 0, preferences: 0 }
      entry.preferences += 1
      activityMap.set(day, entry)
    }
    const recentActivity = Array.from(activityMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, data]) => ({ date, ...data }))

    const stats: DashboardStats = {
      totalConversations,
      totalMessages,
      totalPreferenceLogs,
      learningModeConversations,
      topStrategies,
      topTags,
      memoryVersion: memory?.version ?? 0,
      promptVersion: latestPrompt?.version ?? 0,
      recentActivity,
    }

    return NextResponse.json(stats)
  } catch (err) {
    console.error('Analytics failed:', err)
    return NextResponse.json(emptyStats())
  }
}

function emptyStats(): DashboardStats {
  return {
    totalConversations: 0,
    totalMessages: 0,
    totalPreferenceLogs: 0,
    learningModeConversations: 0,
    topStrategies: [],
    topTags: [],
    memoryVersion: 0,
    promptVersion: 0,
    recentActivity: [],
  }
}
