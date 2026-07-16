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

  const isFirstMessage = !lastUserMessage && !lastAiResponse

  try {
    const provider = getLLMProvider()
    const result = await generateObject({
      model: provider.getFastModel(),
      schema: RecommendationSchema,
      system: `당신은 목표 달성 코치입니다. 사용자가 현재 단계에서 구체적으로 행동하도록 유도하는 질문을 던지세요.
지시나 조언이 아니라 사용자의 생각/현황을 이끌어내는 질문 형태로 작성하세요.
예: "지금 가장 막히는 부분이 뭐예요?", "이 단계에서 어디까지 해봤어요?", "어떤 방향으로 접근하려고 해요?"
한국어로 1~2문장, 자연스럽고 따뜻한 말투로 작성하세요.`,
      prompt: isFirstMessage
        ? `목표: "${goal.title}"
현재 단계: ${currentStep?.title ?? currentMilestone?.title ?? '시작'}

이 목표를 처음 시작하는 사용자에게 현재 상황을 파악하기 위한 첫 번째 질문을 하세요.
사용자가 어디서부터 시작해야 할지 함께 파악하는 가벼운 도입 질문이어야 합니다.`
        : `목표: "${goal.title}"
현재 마일스톤: ${currentMilestone?.title ?? '없음'}
현재 단계: ${currentStep?.title ?? '없음'}

방금 나눈 대화:
사용자: ${lastUserMessage.slice(0, 300)}
AI: ${lastAiResponse.slice(0, 500)}

이 대화를 이어받아 현재 단계에서 사용자가 더 깊이 생각하거나 행동하도록 유도하는 후속 질문을 하세요.`,
    })
    return result.object as { content: string; type: string }
  } catch {
    const stepTitle = currentStep?.title ?? currentMilestone?.title ?? '목표'
    return {
      content: isFirstMessage
        ? `"${goal.title}"을 시작하게 됐군요! 지금 어떤 상황인지 간단히 얘기해줄 수 있어요?`
        : `"${stepTitle}"에서 지금 어디까지 진행해봤어요? 막히는 부분이 있으면 같이 풀어봐요.`,
      type: 'NEXT_ACTION',
    }
  }
}
