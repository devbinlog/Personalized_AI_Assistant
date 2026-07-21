import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserContext } from '@/lib/resolve-user'
import { generateRecommendation } from '@/services/ai/execution-recommender'
import type { ExecutionGoal } from '@/types'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'

async function getRecommendationFromLangGraph(
  goal: ExecutionGoal,
  lastUserMessage: string,
  lastAiResponse: string,
): Promise<{ content: string; type: string } | null> {
  try {
    const currentMilestone = goal.milestones?.find(m => m.status === 'IN_PROGRESS') ?? goal.milestones?.[0]
    const currentStep = currentMilestone?.steps?.find(s => s.isCurrent) ?? currentMilestone?.steps?.[0]

    const res = await fetch(`${BACKEND_URL}/api/v1/assistant/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_title: goal.title,
        milestone_title: currentMilestone?.title ?? null,
        step_title: currentStep?.title ?? null,
        last_user_message: lastUserMessage,
        last_ai_response: lastAiResponse,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return await res.json() as { content: string; type: string }
  } catch {
    return null
  }
}

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

    // LangGraph 백엔드 우선 호출 → 실패 시 Next.js 서비스 fallback
    const rec =
      (await getRecommendationFromLangGraph(goal as unknown as ExecutionGoal, lastUserMessage, lastAiResponse)) ??
      (await generateRecommendation(goal as unknown as ExecutionGoal, lastUserMessage, lastAiResponse))

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
