import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserContext } from '@/lib/resolve-user'

export async function DELETE() {
  const { userId } = await resolveUserContext()
  if (userId === 'anonymous') {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  await prisma.preferenceLog.deleteMany({ where: { userId } })
  await prisma.preferenceMemory.deleteMany({ where: { userId } })

  return NextResponse.json({ ok: true })
}
