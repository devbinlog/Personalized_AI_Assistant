import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateSession } from '@/lib/session'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionId = await getOrCreateSession()
  const { id } = await params

  try {
    const user = await prisma.user.findUnique({ where: { sessionId } })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            responseCandidates: { orderBy: { index: 'asc' } },
            explanation: true,
          },
        },
      },
    })

    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ conversation })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
