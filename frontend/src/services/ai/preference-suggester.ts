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

const SYSTEM_PROMPT = `You are analyzing a user's AI preference behavior to proactively suggest preference updates.

Look for strong emerging patterns in their recent selections.
Only suggest a preference update if there's clear evidence (3+ consistent selections).
Write rationale as a human-readable explanation the user will see.
Example rationale: "In your last 8 conversations about programming, you selected structured step-by-step responses 7 times. Would you like to set this as your default for technical questions?"

Return only high-confidence suggestions.`

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
