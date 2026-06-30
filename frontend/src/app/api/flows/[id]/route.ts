import { NextRequest, NextResponse } from 'next/server'
import { updateFlow, deleteFlow } from '@/services/ai/flow-manager'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const row = await prisma.conversationFlow.findUniqueOrThrow({ where: { id } })
    const flow = { ...row, steps: JSON.parse((row.steps as string) || '[]') }
    return NextResponse.json({ flow })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 404 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const flow = await updateFlow(id, body)
    return NextResponse.json({ flow })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteFlow(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
