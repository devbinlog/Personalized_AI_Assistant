import { NextRequest, NextResponse } from 'next/server'
import { resolveUserId } from '@/lib/resolve-user'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await resolveUserId()
  if (userId === 'anonymous') return NextResponse.json({ profile: null })

  try {
    const profile = await prisma.userProfile.findUnique({ where: { userId } })
    if (!profile) return NextResponse.json({ profile: null })

    return NextResponse.json({
      profile: {
        ...profile,
        interests: JSON.parse(profile.interests as string || '[]'),
        goals: JSON.parse(profile.goals as string || '[]'),
      },
    })
  } catch {
    return NextResponse.json({ profile: null })
  }
}

export async function PATCH(req: NextRequest) {
  const userId = await resolveUserId()
  if (userId === 'anonymous') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { displayName, occupation, interests, goals, background, language, autoExtract } = body

  try {
    const data: Record<string, unknown> = {}
    if (displayName !== undefined) data.displayName = displayName
    if (occupation !== undefined) data.occupation = occupation
    if (interests !== undefined) data.interests = JSON.stringify(interests)
    if (goals !== undefined) data.goals = JSON.stringify(goals)
    if (background !== undefined) data.background = background
    if (language !== undefined) data.language = language
    if (autoExtract !== undefined) data.autoExtract = autoExtract

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data } as never,
      update: data as never,
    })

    return NextResponse.json({
      profile: {
        ...profile,
        interests: JSON.parse(profile.interests as string || '[]'),
        goals: JSON.parse(profile.goals as string || '[]'),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
