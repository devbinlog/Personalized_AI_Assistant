import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const sessionId = await getOrCreateSession()
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '10')

  try {
    const user = await prisma.user.findUnique({ where: { sessionId } })
    if (!user) return NextResponse.json({ versions: [] })

    const versions = await prisma.promptVersion.findMany({
      where: { userId: user.id },
      orderBy: { version: 'desc' },
      take: limit,
    })

    return NextResponse.json({ versions })
  } catch {
    return NextResponse.json({ versions: [] })
  }
}
