import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserContext } from '@/lib/resolve-user'

export const dynamic = 'force-dynamic'

function computeProgress(milestones: { steps: { status: string }[] }[]): number {
  const steps = milestones.flatMap(m => m.steps)
  if (steps.length === 0) return 0
  const done = steps.filter(s => s.status === 'COMPLETED' || s.status === 'SKIPPED').length
  return Math.round((done / steps.length) * 100)
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { userId } = await resolveUserContext()
    const goal = await prisma.executionGoal.findFirst({
      where: { id, userId },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { steps: { orderBy: { order: 'asc' } } },
        },
        recommendations: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })
    if (!goal) return NextResponse.json({ error: '목표를 찾을 수 없습니다.' }, { status: 404 })
    return NextResponse.json({ goal })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { userId } = await resolveUserContext()
    const body = await req.json()
    const { status, title, description } = body as {
      status?: string
      title?: string
      description?: string
    }

    const goal = await prisma.executionGoal.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        updatedAt: new Date(),
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { steps: { orderBy: { order: 'asc' } } },
        },
      },
    })

    const progress = computeProgress(goal.milestones)
    const updated = await prisma.executionGoal.update({
      where: { id },
      data: { progress },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { steps: { orderBy: { order: 'asc' } } },
        },
      },
    })

    void userId
    return NextResponse.json({ goal: updated })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { userId } = await resolveUserContext()
    await prisma.executionGoal.deleteMany({ where: { id, userId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
