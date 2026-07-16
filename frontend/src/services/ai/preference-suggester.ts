import { generateObject } from 'ai'
import { z } from 'zod'
import { getLLMProvider } from './provider'
import { prisma } from '@/lib/prisma'
import type { PreferenceSuggestion } from '@/types'

const SuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      type: z.string(),
      currentValue: z.string().nullable(),
      suggestedValue: z.string(),
      rationale: z.string(),
      evidenceCount: z.number(),
    }),
  ),
})

type SuggestionData = z.infer<typeof SuggestionSchema>

const SYSTEM_PROMPT = `사용자의 AI 응답 선호도 행동 패턴을 분석하여 선호도 업데이트를 선제적으로 제안합니다.

최근 선택에서 강하게 나타나는 패턴을 찾으세요.
일관된 선택이 3번 이상 있을 때만 선호도 업데이트를 제안하세요.
rationale은 사용자가 읽을 수 있는 자연스러운 한국어로 작성하세요.
예시: "최근 8번의 대화에서 구조적 응답 방식을 7번 선택하셨어요. 이 스타일을 기본값으로 설정할까요?"

확신도가 높은 제안만 반환하세요.`

export async function detectSuggestions(
  userId: string,
  recentLogs: Array<{
    id: string
    selectedStrategy: string
    selectedTags: string | string[]
    taskType: string
    domain: string | null
  }>,
  currentMemory: Record<string, unknown> | null,
): Promise<PreferenceSuggestion[]> {
  if (recentLogs.length < 5) return []

  try {
    const provider = getLLMProvider()
    const logSummary = recentLogs
      .map(l => {
        const tags = Array.isArray(l.selectedTags)
          ? l.selectedTags
          : JSON.parse(l.selectedTags || '[]')
        return `strategy=${l.selectedStrategy}, tags=[${tags.join(',')}], type=${l.taskType}`
      })
      .join('\n')

    const result = await generateObject({
      model: provider.getFastModel(),
      schema: SuggestionSchema,
      system: SYSTEM_PROMPT,
      prompt: `Recent ${recentLogs.length} preference logs:\n${logSummary}\n\nCurrent preferences: ${JSON.stringify(currentMemory ?? {})}`,
    })

    const data = result.object as SuggestionData
    if (data.suggestions.length === 0) return []

    const saved = await Promise.all(
      data.suggestions.map(s =>
        prisma.preferenceSuggestion.create({
          data: {
            userId,
            type: s.type,
            currentValue: s.currentValue,
            suggestedValue: s.suggestedValue,
            rationale: s.rationale,
            evidenceCount: s.evidenceCount,
            triggerLogIds: JSON.stringify(recentLogs.slice(0, s.evidenceCount).map(l => l.id)),
            status: 'PENDING',
          },
        }),
      ),
    )

    return saved as unknown as PreferenceSuggestion[]
  } catch {
    return []
  }
}

export async function getPendingSuggestions(userId: string): Promise<PreferenceSuggestion[]> {
  try {
    const suggestions = await prisma.preferenceSuggestion.findMany({
      where: { userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })
    return suggestions as unknown as PreferenceSuggestion[]
  } catch {
    return []
  }
}

export async function respondToSuggestion(
  suggestionId: string,
  accepted: boolean,
): Promise<void> {
  try {
    await prisma.preferenceSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: accepted ? 'ACCEPTED' : 'DECLINED',
        respondedAt: new Date(),
      },
    })
  } catch {}
}
