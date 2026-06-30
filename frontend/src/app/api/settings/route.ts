import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/constants'

export const dynamic = 'force-dynamic'

async function resolveUserId(): Promise<string | null> {
  // Prefer authenticated session
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as { id?: string } | undefined
  if (sessionUser?.id) {
    return sessionUser.id
  }

  // Fall back to anonymous session cookie
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return null

  try {
    const user = await prisma.user.findUnique({ where: { sessionId } })
    return user?.id ?? null
  } catch {
    return null
  }
}

export async function GET() {
  const userId = await resolveUserId()
  if (!userId) {
    return NextResponse.json({
      defaultMode: 'NORMAL',
      autoSearch: true,
      showExplanations: true,
      showConfidence: true,
    })
  }

  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId } })
    return NextResponse.json(
      settings ?? {
        defaultMode: 'NORMAL',
        autoSearch: true,
        showExplanations: true,
        showConfidence: true,
      },
    )
  } catch {
    return NextResponse.json({
      defaultMode: 'NORMAL',
      autoSearch: true,
      showExplanations: true,
      showConfidence: true,
    })
  }
}

export async function PATCH(req: NextRequest) {
  const userId = await resolveUserId()
  if (!userId) {
    return NextResponse.json({ error: 'No user session' }, { status: 401 })
  }

  const body = await req.json()
  const { defaultMode, autoSearch, showExplanations, showConfidence } = body

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...(defaultMode !== undefined && { defaultMode }),
        ...(autoSearch !== undefined && { autoSearch }),
        ...(showExplanations !== undefined && { showExplanations }),
        ...(showConfidence !== undefined && { showConfidence }),
      },
      update: {
        ...(defaultMode !== undefined && { defaultMode }),
        ...(autoSearch !== undefined && { autoSearch }),
        ...(showExplanations !== undefined && { showExplanations }),
        ...(showConfidence !== undefined && { showConfidence }),
      },
    })
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
