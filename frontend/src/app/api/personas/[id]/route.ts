import { NextRequest, NextResponse } from 'next/server'
import { updatePersona, deletePersona } from '@/services/ai/persona-manager'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/resolve-user'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 페르소나는 공개 — 인증 불필요
  try {
    const { id } = await params
    const row = await prisma.persona.findUniqueOrThrow({ where: { id } })
    const persona = {
      ...row,
      allowedBehaviors: JSON.parse((row.allowedBehaviors as string) || '[]'),
      forbiddenBehaviors: JSON.parse((row.forbiddenBehaviors as string) || '[]'),
      exampleResponses: JSON.parse((row.exampleResponses as string) || '[]'),
    }
    return NextResponse.json({ persona })
  } catch {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await resolveUserId()
  if (userId === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const persona = await updatePersona(id, body)
    return NextResponse.json({ persona })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await resolveUserId()
  if (userId === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    await deletePersona(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
