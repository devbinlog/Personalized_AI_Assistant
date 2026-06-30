import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/resolve-user'
import { generateMemory, shouldUpdateMemory } from '@/services/ai/memory-generator'
import { detectSuggestions, getPendingSuggestions } from '@/services/ai/preference-suggester'

export async function POST(req: NextRequest) {
  const userId = await resolveUserId()
  const body = await req.json()
  const { messageId, candidateId, selectedStrategy, selectedTags, taskType, domain, complexity, userQuery } = body

  try {
    if (userId === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 401 })
    }

    // Mark candidate as selected
    await prisma.responseCandidate.update({
      where: { id: candidateId },
      data: { isSelected: true },
    })

    // Save preference log
    const log = await prisma.preferenceLog.create({
      data: {
        userId,
        messageId,
        candidateId,
        selectedStrategy,
        selectedTags: selectedTags ?? [],
        taskType,
        domain,
        complexity,
        userQuery,
      },
    })

    // Trigger memory update if threshold reached
    let memoryUpdated = false
    if (await shouldUpdateMemory(userId)) {
      const logs = await prisma.preferenceLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      await generateMemory(userId, logs)
      memoryUpdated = true
    }

    // Detect preference suggestions (Phase 14)
    const recentLogs = await prisma.preferenceLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    const memory = await prisma.preferenceMemory
      .findUnique({ where: { userId } })
      .catch(() => null)

    const suggestions = await detectSuggestions(userId, recentLogs, memory as Record<string, unknown> | null)
    const pendingSuggestions = await getPendingSuggestions(userId)

    return NextResponse.json({
      success: true,
      logId: log.id,
      memoryUpdated,
      pendingSuggestions,
    })
  } catch (err) {
    console.error('Preference save failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to save preference' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const userId = await resolveUserId()
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20')

  try {
    if (userId === 'anonymous') return NextResponse.json({ logs: [] })

    const logs = await prisma.preferenceLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ logs })
  } catch {
    return NextResponse.json({ logs: [] })
  }
}
