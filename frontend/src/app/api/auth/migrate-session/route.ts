/**
 * POST /api/auth/migrate-session
 *
 * 로그인 직후 호출. 쿠키의 익명 sessionId User가 가진 모든 데이터를
 * 로그인 계정 User로 이전한 뒤 익명 User를 제거한다.
 *
 * - 이미 이전됐거나 익명 User가 없으면 no-op.
 * - 로그인 계정에 이미 데이터가 있으면 병합(덮어쓰지 않음).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SESSION_COOKIE } from '@/lib/constants'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  const authUserId = (session?.user as { id?: string } | undefined)?.id
  if (!authUserId) {
    return NextResponse.json({ migrated: false, reason: 'not logged in' })
  }

  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) {
    return NextResponse.json({ migrated: false, reason: 'no session cookie' })
  }

  // 익명 User 찾기 (sessionId 기반)
  const anonUser = await prisma.user.findUnique({ where: { sessionId } }).catch(() => null)
  if (!anonUser || anonUser.id === authUserId) {
    return NextResponse.json({ migrated: false, reason: 'nothing to migrate' })
  }

  try {
    // 게스트 대화는 이전하지 않고 삭제 (로그인 전 기록은 계정에 남기지 않음)
    const anonConversations = await prisma.conversation.findMany({
      where: { userId: anonUser.id },
      select: { id: true },
    })
    if (anonConversations.length > 0) {
      const convIds = anonConversations.map(c => c.id)
      await prisma.responseCandidate.deleteMany({ where: { message: { conversationId: { in: convIds } } } })
      await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } })
      await prisma.conversation.deleteMany({ where: { userId: anonUser.id } })
    }

    // 나머지 학습 데이터는 계정으로 이전
    await prisma.$transaction([
      prisma.preferenceLog.updateMany({
        where: { userId: anonUser.id },
        data: { userId: authUserId },
      }),
      prisma.promptVersion.updateMany({
        where: { userId: anonUser.id },
        data: { userId: authUserId },
      }),
      prisma.preferenceSuggestion.updateMany({
        where: { userId: anonUser.id },
        data: { userId: authUserId },
      }),
    ])

    // PreferenceMemory: 로그인 계정에 없으면 이전, 있으면 스킵
    const existingMemory = await prisma.preferenceMemory.findUnique({
      where: { userId: authUserId },
    })
    const anonMemory = await prisma.preferenceMemory.findUnique({
      where: { userId: anonUser.id },
    })
    if (anonMemory && !existingMemory) {
      await prisma.preferenceMemory.update({
        where: { userId: anonUser.id },
        data: { userId: authUserId },
      })
    } else if (anonMemory) {
      await prisma.preferenceMemory.delete({ where: { userId: anonUser.id } })
    }

    // UserSettings: 동일하게 없으면 이전
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId: authUserId },
    })
    const anonSettings = await prisma.userSettings.findUnique({
      where: { userId: anonUser.id },
    })
    if (anonSettings && !existingSettings) {
      await prisma.userSettings.update({
        where: { userId: anonUser.id },
        data: { userId: authUserId },
      })
    } else if (anonSettings) {
      await prisma.userSettings.delete({ where: { userId: anonUser.id } })
    }

    // 익명 User 삭제 (sessionId 컬럼을 null로 — cascade 대신 안전하게)
    await prisma.user.delete({ where: { id: anonUser.id } })

    return NextResponse.json({ migrated: true })
  } catch (err) {
    console.error('Session migration failed:', err)
    return NextResponse.json({ migrated: false, reason: 'error' }, { status: 500 })
  }
}
