import { NextRequest, NextResponse } from 'next/server'
import { runExperiment } from '@/services/ai/experiment-runner'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const experiment = await runExperiment(id)
    return NextResponse.json({ experiment })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
