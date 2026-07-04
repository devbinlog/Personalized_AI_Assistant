import { NextRequest, NextResponse } from 'next/server'
import { getPersonas, createPersona } from '@/services/ai/persona-manager'
import { resolveUserId } from '@/lib/resolve-user'

export const dynamic = 'force-dynamic'

export async function GET() {
  // 페르소나는 공개 — 인증 불필요
  try {
    const personas = await getPersonas()
    return NextResponse.json({ personas })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = await resolveUserId()
  if (userId === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const persona = await createPersona(body)
    return NextResponse.json({ persona }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
