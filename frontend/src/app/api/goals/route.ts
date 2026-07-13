import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserContext } from '@/lib/resolve-user'
import { planJourney } from '@/services/ai/journey-planner'
import { getMemory } from '@/services/ai/memory-generator'

export const dynamic = 'force-dynamic'

function computeProgress(milestones: { steps: { status: string }[] }[]): number {
  const steps = milestones.flatMap(m => m.steps)
  if (steps.length === 0) return 0
  const done = steps.filter(s => s.status === 'COMPLETED' || s.status === 'SKIPPED').length
  return Math.round((done / steps.length) * 100)
}

export async function GET() {
  try {
    const { userId } = await resolveUserContext()
    const goals = await prisma.executionGoal.findMany({
      where: { userId, status: { not: 'ARCHIVED' } },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { steps: { orderBy: { order: 'asc' } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ goals })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await resolveUserContext()
    const body = await req.json()
    const { title, description, category = 'general', context } = body as {
      title: string
      description?: string
      category?: string
      context?: string
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: '목표 제목이 필요합니다.' }, { status: 400 })
    }

    const [memory, userProfile] = await Promise.all([
      getMemory(userId),
      userId !== 'anonymous'
        ? prisma.userProfile.findUnique({ where: { userId } }).catch(() => null)
        : null,
    ])

    // AI가 여정 계획 자동 생성
    const plan = await planJourney(title, description ?? null, category, memory, userProfile as never)

    // DB에 저장
    const goal = await prisma.executionGoal.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() ?? null,
        category,
        context: context ? JSON.stringify(context) : null,
        milestones: {
          create: plan.milestones.map((m, mi) => ({
            title: m.title,
            description: m.description,
            order: mi,
            status: mi === 0 ? 'IN_PROGRESS' : 'PENDING',
            steps: {
              create: m.steps.map((s, si) => ({
                title: s.title,
                description: s.description,
                instruction: s.instruction,
                order: si,
                status: mi === 0 && si === 0 ? 'IN_PROGRESS' : 'PENDING',
                isCurrent: mi === 0 && si === 0,
              })),
            },
          })),
        },
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { steps: { orderBy: { order: 'asc' } } },
        },
      },
    })

    return NextResponse.json({ goal })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
