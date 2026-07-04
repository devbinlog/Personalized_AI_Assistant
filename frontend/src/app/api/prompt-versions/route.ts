import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/resolve-user'

export async function GET(req: NextRequest) {
  const userId = await resolveUserId()
  if (userId === 'anonymous') return NextResponse.json({ versions: [] })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '10')

  try {
    const versions = await prisma.promptVersion.findMany({
      where: { userId },
      orderBy: { version: 'desc' },
      take: limit,
    })
    return NextResponse.json({ versions })
  } catch {
    return NextResponse.json({ versions: [] })
  }
}
