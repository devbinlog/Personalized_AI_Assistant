import { NextRequest, NextResponse } from 'next/server'
import { updatePersona, deletePersona } from '@/services/ai/persona-manager'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 404 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const persona = await updatePersona(id, body)
    return NextResponse.json({ persona })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deletePersona(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
