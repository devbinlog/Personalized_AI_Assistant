import { NextRequest, NextResponse } from 'next/server'
import { getFlows, createFlow } from '@/services/ai/flow-manager'
import { resolveUserId } from '@/lib/resolve-user'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await resolveUserId()
  if (userId === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const flows = await getFlows()
    return NextResponse.json({ flows })
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
    const flow = await createFlow(body)
    return NextResponse.json({ flow }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
