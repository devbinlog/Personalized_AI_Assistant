/**
 * resolveUserId — canonical user ID resolution across all API routes
 *
 * Priority:
 *   1. NextAuth JWT session (logged-in users — device-independent)
 *   2. Cookie-based anonymous session (creates/finds a User row by sessionId)
 *   3. 'anonymous' string fallback (DB unavailable)
 */
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from './constants'

export async function resolveUserId(): Promise<string> {
  // 1. NextAuth session (logged-in)
  const session = await getServerSession(authOptions)
  const authId = (session?.user as { id?: string } | undefined)?.id
  if (authId) return authId

  // 2. Anonymous session cookie
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return 'anonymous'

  try {
    const user = await prisma.user.upsert({
      where: { sessionId },
      create: { sessionId },
      update: {},
    })
    return user.id
  } catch {
    return sessionId
  }
}

/** Returns { userId, sessionId } — sessionId needed for cookie / LangGraph */
export async function resolveUserContext(): Promise<{ userId: string; sessionId: string }> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value ?? ''

  const session = await getServerSession(authOptions)
  const authId = (session?.user as { id?: string } | undefined)?.id
  if (authId) return { userId: authId, sessionId }

  if (!sessionId) return { userId: 'anonymous', sessionId: '' }

  try {
    const user = await prisma.user.upsert({
      where: { sessionId },
      create: { sessionId },
      update: {},
    })
    return { userId: user.id, sessionId }
  } catch {
    return { userId: sessionId, sessionId }
  }
}
