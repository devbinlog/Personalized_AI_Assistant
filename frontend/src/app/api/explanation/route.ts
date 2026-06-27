import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const sessionId = await getOrCreateSession()
  const { searchParams } = new URL(req.url)
  const messageId = searchParams.get('messageId')

  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 })

  try {
    const explanation = await prisma.responseExplanation.findUnique({
      where: { messageId },
      include: { message: { select: { content: true, conversationId: true } } },
    })

    if (!explanation) return NextResponse.json({ explanation: null })

    return NextResponse.json({ explanation })
  } catch {
    return NextResponse.json({ explanation: null })
  }
}
