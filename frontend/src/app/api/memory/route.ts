import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/resolve-user'
import { getMemory, generateMemory } from '@/services/ai/memory-generator'

export async function GET(_req: NextRequest) {
  const userId = await resolveUserId()
  if (userId === 'anonymous') return NextResponse.json({ memory: null, versions: [], logCount: 0, threshold: 3 })

  try {
    const [memory, logCount] = await Promise.all([
      getMemory(userId),
      prisma.preferenceLog.count({ where: { userId } }),
    ])
    const versions = await prisma.preferenceMemoryVersion.findMany({
      where: { memoryId: memory?.id ?? '' },
      orderBy: { version: 'desc' },
      take: 10,
    }).catch(() => [])

    const threshold = 3
    const lastCount = memory?.logCount ?? 0
    const nextUpdateIn = Math.max(0, threshold - (logCount - lastCount))

    return NextResponse.json({ memory, versions, logCount, threshold, nextUpdateIn })
  } catch {
    return NextResponse.json({ memory: null, versions: [], logCount: 0, threshold: 3 })
  }
}

export async function POST(_req: NextRequest) {
  const userId = await resolveUserId()
  if (userId === 'anonymous') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const logs = await prisma.preferenceLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    if (logs.length < 3) {
      return NextResponse.json({
        error: '학습 모드를 3회 이상 사용해야 선호도 메모리가 생성됩니다.',
      }, { status: 400 })
    }

    const memory = await generateMemory(userId, logs)
    return NextResponse.json({ memory, updated: true })
  } catch {
    return NextResponse.json({ error: 'Memory generation failed' }, { status: 500 })
  }
}
