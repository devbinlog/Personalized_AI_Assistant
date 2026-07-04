import { NextRequest, NextResponse } from 'next/server'
import { getExperiments, createExperiment } from '@/services/ai/experiment-runner'
import { resolveUserId } from '@/lib/resolve-user'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await resolveUserId()
  if (userId === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const experiments = await getExperiments()
    return NextResponse.json({ experiments })
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
    const experiment = await createExperiment(body)
    return NextResponse.json({ experiment }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
