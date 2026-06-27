import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateSession } from '@/lib/session'

export async function GET(_req: NextRequest) {
  const sessionId = await getOrCreateSession()

  try {
    const user = await prisma.user.findUnique({ where: { sessionId } })
    if (!user) return NextResponse.json({ conversations: [] })

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
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
  const sessionId = await getOrCreateSession()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  try {
    const user = await prisma.user.findUnique({ where: { sessionId } })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.conversation.deleteMany({ where: { id, userId: user.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
