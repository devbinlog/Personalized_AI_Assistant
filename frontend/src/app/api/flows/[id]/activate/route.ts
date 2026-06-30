import { NextRequest, NextResponse } from 'next/server'
import { activateFlow } from '@/services/ai/flow-manager'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const flow = await activateFlow(id)
    return NextResponse.json({ flow })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
