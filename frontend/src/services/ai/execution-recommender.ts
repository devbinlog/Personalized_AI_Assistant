import { generateObject } from 'ai'
import { z } from 'zod'
import { getLLMProvider } from './provider'
import type { ExecutionGoal } from '@/types'

const RecommendationSchema = z.object({
  content: z.string(),
  type: z.enum(['NEXT_ACTION', 'REPLANNING', 'WARNING', 'INSIGHT']),
})

export async function generateRecommendation(
  goal: ExecutionGoal,
  lastUserMessage: string,
  lastAiResponse: string,
): Promise<{ content: string; type: string }> {
  const currentMilestone = goal.milestones.find(m => m.status === 'IN_PROGRESS') ?? goal.milestones[0]
  const currentStep = currentMilestone?.steps.find(s => s.isCurrent) ?? currentMilestone?.steps[0]
  const completedCount = goal.milestones.flatMap(m => m.steps).filter(s => s.status === 'COMPLETED').length
  const totalCount = goal.milestones.flatMap(m => m.steps).length

  try {
    const provider = getLLMProvider()
    const result = await generateObject({
      model: provider.getFastModel(),
      schema: RecommendationSchema,
      system: `당신은 목표 달성 코치입니다. 사용자의 현재 진행 상황을 파악하고 다음 행동을 추천하세요.
추천은 구체적이고 실행 가능해야 합니다. 한국어로 2~3문장으로 작성하세요.`,
      prompt: `목표: "${goal.title}" (진행률 ${goal.progress.toFixed(0)}%, ${completedCount}/${totalCount} 단계 완료)
현재 마일스톤: ${currentMilestone?.title ?? '없음'}
현재 단계: ${currentStep?.title ?? '없음'}

방금 나눈 대화:
사용자: ${lastUserMessage.slice(0, 300)}
AI: ${lastAiResponse.slice(0, 500)}

이 대화를 바탕으로 사용자가 다음에 해야 할 행동을 추천하세요.
남은 단계를 고려해 가장 적절한 다음 액션을 제안하세요.`,
    })
    return result.object as { content: string; type: string }
  } catch {
    const nextStep = currentMilestone?.steps.find(s => s.status === 'PENDING')
    return {
      content: nextStep
        ? `다음 단계로 "${nextStep.title}"을 진행해보세요. 궁금한 점이 있으면 언제든지 질문하세요.`
        : `현재 마일스톤이 잘 진행되고 있습니다. 계속 이어가세요!`,
      type: 'NEXT_ACTION',
    }
  }
}
