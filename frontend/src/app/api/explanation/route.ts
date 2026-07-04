import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/resolve-user'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const messageId = searchParams.get('messageId')

  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 })

  const userId = await resolveUserId()

  try {
    const explanation = await prisma.responseExplanation.findUnique({
      where: { messageId },
      include: {
        message: {
          select: {
            content: true,
            conversationId: true,
            conversation: { select: { userId: true } },
          },
        },
      },
    })

    if (!explanation) {
      return NextResponse.json({ explanation: null })
    }

    // 해당 메시지가 현재 사용자 소유인지 확인 (정보 유출 방지를 위해 403 대신 404)
    if (explanation.message?.conversation?.userId !== userId) {
      return NextResponse.json({ explanation: null }, { status: 404 })
    }

    return NextResponse.json({ explanation })
  } catch {
    return NextResponse.json({ explanation: null })
  }
}
