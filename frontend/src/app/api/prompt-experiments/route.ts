import { NextRequest, NextResponse } from 'next/server'
import { getExperiments, createExperiment } from '@/services/ai/experiment-runner'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const experiments = await getExperiments()
    return NextResponse.json({ experiments })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const experiment = await createExperiment(body)
    return NextResponse.json({ experiment }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
