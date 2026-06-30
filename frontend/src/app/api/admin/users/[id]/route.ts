import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      preferenceMemory: true,
      _count: {
        select: {
          conversations: true,
          preferenceLogs: true,
          promptVersions: true,
          preferenceSuggestions: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
  }

  return NextResponse.json({ user })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  const { role } = await req.json()

  if (!['USER', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: '유효하지 않은 역할입니다.' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
  })

  return NextResponse.json({ user: updated })
}
