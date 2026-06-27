import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateSession } from '@/lib/session'
import { generateMemory, shouldUpdateMemory } from '@/services/ai/memory-generator'
import { detectSuggestions, getPendingSuggestions } from '@/services/ai/preference-suggester'

export async function POST(req: NextRequest) {
  const sessionId = await getOrCreateSession()
  const body = await req.json()
  const { messageId, candidateId, selectedStrategy, selectedTags, taskType, domain, complexity, userQuery } = body

  try {
    const user = await prisma.user.upsert({
      where: { sessionId },
      create: { sessionId },
      update: {},
    })

    // Mark candidate as selected
    await prisma.responseCandidate.update({
      where: { id: candidateId },
      data: { isSelected: true },
    })

    // Save preference log
    const log = await prisma.preferenceLog.create({
      data: {
        userId: user.id,
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
    if (await shouldUpdateMemory(user.id)) {
      const logs = await prisma.preferenceLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      await generateMemory(user.id, logs)
      memoryUpdated = true
    }

    // Detect preference suggestions (Phase 14)
    const recentLogs = await prisma.preferenceLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    const memory = await prisma.preferenceMemory
      .findUnique({ where: { userId: user.id } })
      .catch(() => null)

    const suggestions = await detectSuggestions(user.id, recentLogs, memory as Record<string, unknown> | null)
    const pendingSuggestions = await getPendingSuggestions(user.id)

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
  const sessionId = await getOrCreateSession()
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20')

  try {
    const user = await prisma.user.findUnique({ where: { sessionId } })
    if (!user) return NextResponse.json({ logs: [] })

    const logs = await prisma.preferenceLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ logs })
  } catch {
    return NextResponse.json({ logs: [] })
  }
}
