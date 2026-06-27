import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { generateSessionId } from './utils'
import { SESSION_COOKIE } from './constants'

export async function getOrCreateSession(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionId) {
    sessionId = generateSessionId()
  }

  try {
    await prisma.user.upsert({
      where: { sessionId },
      create: { sessionId },
      update: {},
    })
  } catch {
    // DB not available — continue with session ID only
  }

  return sessionId
}

export async function getUserBySession(sessionId: string) {
  try {
    return await prisma.user.findUnique({ where: { sessionId } })
  } catch {
    return null
  }
}

export function setSessionCookie(sessionId: string): Record<string, string> {
  return {
    'Set-Cookie': `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
  }
}
