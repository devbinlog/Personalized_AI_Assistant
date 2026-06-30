import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/resolve-user'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const userId = await resolveUserId()

  try {
    if (userId === 'anonymous') return NextResponse.json({ conversations: [] })

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { messages: true } },
      },
    })

    return NextResponse.json({ conversations })
  } catch {
    return NextResponse.json({ conversations: [] })
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await resolveUserId()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  if (userId === 'anonymous') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await prisma.conversation.deleteMany({ where: { id, userId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
