import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserContext } from '@/lib/resolve-user'
import { generateRecommendation } from '@/services/ai/execution-recommender'
import type { ExecutionGoal } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: goalId } = await params
    const { userId } = await resolveUserContext()
    const body = await req.json()
    const { lastUserMessage = '', lastAiResponse = '' } = body as {
      lastUserMessage?: string
      lastAiResponse?: string
    }

    const goal = await prisma.executionGoal.findFirst({
      where: { id: goalId, userId },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { steps: { orderBy: { order: 'asc' } } },
        },
      },
    })
    if (!goal) return NextResponse.json({ error: '목표를 찾을 수 없습니다.' }, { status: 404 })

    const rec = await generateRecommendation(goal as unknown as ExecutionGoal, lastUserMessage, lastAiResponse)

    const saved = await prisma.executionRecommendation.create({
      data: {
        goalId,
        content: rec.content,
        type: rec.type,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ recommendation: saved })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: goalId } = await params
    const { recommendationId, status } = await req.json() as { recommendationId: string; status: string }
    await prisma.executionRecommendation.update({
      where: { id: recommendationId, goalId },
      data: { status },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
