import { NextRequest, NextResponse } from 'next/server'
import { activatePersona } from '@/services/ai/persona-manager'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const persona = await activatePersona(id)
    return NextResponse.json({ persona })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
