import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateSession } from '@/lib/session'
import { getMemory, generateMemory } from '@/services/ai/memory-generator'

export async function GET(_req: NextRequest) {
  const sessionId = await getOrCreateSession()

  try {
    const user = await prisma.user.findUnique({ where: { sessionId } })
    if (!user) return NextResponse.json({ memory: null })

    const memory = await getMemory(user.id)
    const versions = await prisma.preferenceMemoryVersion.findMany({
      where: { memoryId: memory?.id ?? '' },
      orderBy: { version: 'desc' },
      take: 10,
    }).catch(() => [])

    return NextResponse.json({ memory, versions })
  } catch {
    return NextResponse.json({ memory: null, versions: [] })
  }
}

export async function POST(_req: NextRequest) {
  const sessionId = await getOrCreateSession()

  try {
    const user = await prisma.user.findUnique({ where: { sessionId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const logs = await prisma.preferenceLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    if (logs.length < 3) {
      return NextResponse.json({
        error: 'Not enough preference data yet. Use Learning Mode to collect preferences.',
      }, { status: 400 })
    }

    const memory = await generateMemory(user.id, logs)
    return NextResponse.json({ memory, updated: true })
  } catch {
    return NextResponse.json({ error: 'Memory generation failed' }, { status: 500 })
  }
}
