import { generateObject } from 'ai'
import { z } from 'zod'
import { getLLMProvider } from './provider'
import type { PreferenceMemory, UserProfile } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  career: '커리어',
  learning: '학습',
  project: '프로젝트',
  health: '건강',
  startup: '창업',
  personal: '개인',
  general: '일반',
}

const JourneySchema = z.object({
  milestones: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      steps: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          instruction: z.string(),
        }),
      ).min(1).max(6),
    }),
  ).min(2).max(7),
})

export type JourneyPlan = z.infer<typeof JourneySchema>

export async function planJourney(
  goalTitle: string,
  goalDescription: string | null,
  category: string,
  memory: PreferenceMemory | null,
  userProfile: UserProfile | null,
): Promise<JourneyPlan> {
  const provider = getLLMProvider()

  const categoryLabel = CATEGORY_LABELS[category] ?? category
  const profileCtx = userProfile
    ? `사용자 직업: ${userProfile.occupation ?? '미기재'}, 관심사: ${Array.isArray(userProfile.interests) ? userProfile.interests.join(', ') : '미기재'}`
    : ''
  const memoryCtx = memory?.rawSummary
    ? `사용자 선호 스타일: ${memory.rawSummary}`
    : ''

  try {
    const result = await generateObject({
      model: provider.getModel(),
      schema: JourneySchema,
      system: `당신은 목표 달성을 위한 전략적 여정을 설계하는 전문 코치입니다.
사용자의 목표를 분석하고, 달성 가능한 마일스톤과 구체적인 실행 단계로 분해하세요.

규칙:
- 마일스톤은 논리적 순서로 배치하세요 (선행 조건 순서 준수)
- 각 단계(step)는 하루~일주일 내 완료 가능한 단위로 설정하세요
- instruction은 AI가 그 단계를 도울 때 따라야 할 구체적인 지침입니다
- 모든 텍스트는 한국어로 작성하세요
- 카테고리(${categoryLabel})에 맞는 실용적인 계획을 세우세요`,
      prompt: `목표: "${goalTitle}"
${goalDescription ? `상세 설명: ${goalDescription}` : ''}
카테고리: ${categoryLabel}
${profileCtx}
${memoryCtx}

이 목표를 달성하기 위한 여정 계획을 생성해주세요.
마일스톤 2~7개, 각 마일스톤당 단계 1~6개로 구성하세요.`,
    })
    return result.object as JourneyPlan
  } catch {
    // Fallback: rule-based minimal journey
    return {
      milestones: [
        {
          title: '준비 및 계획',
          description: '목표 달성을 위한 기초 준비',
          steps: [
            { title: '현황 파악', description: '현재 상태와 목표 gap 분석', instruction: `사용자의 "${goalTitle}" 목표 달성을 돕기 위해 현재 상황을 파악하고 출발점을 명확히 하세요.` },
            { title: '리소스 확인', description: '필요한 자원과 시간 계획', instruction: `"${goalTitle}"을 위해 필요한 리소스(시간, 도구, 지식)를 함께 파악하세요.` },
          ],
        },
        {
          title: '실행',
          description: '핵심 활동 수행',
          steps: [
            { title: '첫 번째 행동', description: '가장 중요한 첫 단계 실행', instruction: `"${goalTitle}" 달성을 위한 첫 번째 구체적 행동을 취할 수 있도록 도우세요.` },
          ],
        },
        {
          title: '완료 및 검토',
          description: '목표 달성 확인 및 회고',
          steps: [
            { title: '결과 검토', description: '달성 여부 확인 및 다음 스텝 도출', instruction: `"${goalTitle}" 목표의 달성 여부를 함께 검토하고 성과를 정리하세요.` },
          ],
        },
      ],
    }
  }
}
