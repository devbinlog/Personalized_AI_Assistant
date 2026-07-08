import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/resolve-user'

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (value == null) return fallback
  if (typeof value !== 'string') return value as unknown as T
  try { return JSON.parse(value) } catch { return fallback }
}

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

    // SQLite/PostgreSQL JSON string fields → parse before returning
    const parsed = {
      ...explanation,
      memoryInfluence: safeJsonParse(explanation.memoryInfluence, []),
      reasoningFactors: safeJsonParse(explanation.reasoningFactors, []),
      memorySnapshot: safeJsonParse(explanation.memorySnapshot, null),
      rankingDetails: safeJsonParse(explanation.rankingDetails, null),
    }

    return NextResponse.json({ explanation: parsed })
  } catch {
    return NextResponse.json({ explanation: null })
  }
}
