import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/resolve-user'
import { respondToSuggestion, getPendingSuggestions } from '@/services/ai/preference-suggester'

export async function GET(_req: NextRequest) {
  const userId = await resolveUserId()
  if (userId === 'anonymous') return NextResponse.json({ suggestions: [] })

  try {
    const suggestions = await getPendingSuggestions(userId)
    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}

export async function POST(req: NextRequest) {
  const { suggestionId, accepted } = await req.json()

  try {
    await respondToSuggestion(suggestionId, accepted)

    if (accepted) {
      const suggestion = await prisma.preferenceSuggestion.findUnique({ where: { id: suggestionId } })
      if (suggestion) {
        const updateData: Record<string, unknown> = {}
        if (suggestion.type === 'tone') updateData.preferredTone = suggestion.suggestedValue
        if (suggestion.type === 'length') updateData.preferredLength = suggestion.suggestedValue
        if (suggestion.type === 'structure') updateData.preferredStructure = suggestion.suggestedValue

        if (Object.keys(updateData).length > 0) {
          await prisma.preferenceMemory.updateMany({
            where: { userId: suggestion.userId },
            data: { ...updateData, lastUpdatedAt: new Date() },
          }).catch(() => {})
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
