import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function computeGoalProgress(milestones: { steps: { status: string }[] }[]): number {
  const steps = milestones.flatMap(m => m.steps)
  if (steps.length === 0) return 0
  const done = steps.filter(s => s.status === 'COMPLETED' || s.status === 'SKIPPED').length
  return Math.round((done / steps.length) * 100)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> },
) {
  try {
    const { id: goalId, stepId } = await params
    const body = await req.json()
    const { status, userNote } = body as { status: string; userNote?: string }

    // 단계 업데이트
    await prisma.executionStep.update({
      where: { id: stepId },
      data: {
        status,
        isCurrent: status === 'IN_PROGRESS',
        completedAt: status === 'COMPLETED' ? new Date() : null,
        ...(userNote !== undefined && { userNote }),
        updatedAt: new Date(),
      },
    })

    // 완료 시: isCurrent 해제 후 다음 단계 활성화
    if (status === 'COMPLETED' || status === 'SKIPPED') {
      const step = await prisma.executionStep.findUnique({
        where: { id: stepId },
        include: { milestone: { include: { goal: { include: { milestones: { include: { steps: { orderBy: { order: 'asc' } } } } } } } } },
      })

      if (step) {
        // 현재 마일스톤 내 다음 미완료 단계
        const siblingsInOrder = await prisma.executionStep.findMany({
          where: { milestoneId: step.milestoneId },
          orderBy: { order: 'asc' },
        })
        const nextSibling = siblingsInOrder.find(s => s.order > step.order && s.status === 'PENDING')

        if (nextSibling) {
          await prisma.executionStep.update({
            where: { id: nextSibling.id },
            data: { status: 'IN_PROGRESS', isCurrent: true },
          })
        } else {
          // 마일스톤 완료 처리
          const allDone = siblingsInOrder.every(s =>
            s.id === stepId
              ? true
              : s.status === 'COMPLETED' || s.status === 'SKIPPED',
          )
          if (allDone) {
            await prisma.executionMilestone.update({
              where: { id: step.milestoneId },
              data: { status: 'COMPLETED', updatedAt: new Date() },
            })
            // 다음 마일스톤 활성화
            const goal = step.milestone.goal
            const milestones = await prisma.executionMilestone.findMany({
              where: { goalId },
              orderBy: { order: 'asc' },
            })
            const currMsIdx = milestones.findIndex(m => m.id === step.milestoneId)
            const nextMs = milestones[currMsIdx + 1]
            if (nextMs) {
              await prisma.executionMilestone.update({
                where: { id: nextMs.id },
                data: { status: 'IN_PROGRESS', updatedAt: new Date() },
              })
              const firstStep = await prisma.executionStep.findFirst({
                where: { milestoneId: nextMs.id },
                orderBy: { order: 'asc' },
              })
              if (firstStep) {
                await prisma.executionStep.update({
                  where: { id: firstStep.id },
                  data: { status: 'IN_PROGRESS', isCurrent: true },
                })
              }
            } else {
              // 모든 마일스톤 완료 → 목표 완료
              await prisma.executionGoal.update({
                where: { id: goalId },
                data: { status: 'COMPLETED', progress: 100, updatedAt: new Date() },
              })
            }
            void goal
          }
        }
      }
    }

    // 진행률 재계산
    const updatedGoal = await prisma.executionGoal.findUnique({
      where: { id: goalId },
      include: { milestones: { include: { steps: true } } },
    })
    if (updatedGoal) {
      const progress = computeGoalProgress(updatedGoal.milestones)
      await prisma.executionGoal.update({
        where: { id: goalId },
        data: { progress, updatedAt: new Date() },
      })
    }

    // 최신 목표 반환
    const finalGoal = await prisma.executionGoal.findUnique({
      where: { id: goalId },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { steps: { orderBy: { order: 'asc' } } },
        },
      },
    })
    return NextResponse.json({ goal: finalGoal })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
