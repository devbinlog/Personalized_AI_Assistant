import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/resolve-user'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await resolveUserId()
  const { id } = await params

  if (userId === 'anonymous') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await resolveUserId()
  const { id } = await params
  if (userId === 'anonymous') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { executionGoalId } = await req.json()
    await prisma.conversation.updateMany({
      where: { id, userId },
      data: { executionGoalId: executionGoalId ?? null },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
