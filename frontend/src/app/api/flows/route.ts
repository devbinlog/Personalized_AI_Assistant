import { NextRequest, NextResponse } from 'next/server'
import { getFlows, createFlow } from '@/services/ai/flow-manager'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const flows = await getFlows()
    return NextResponse.json({ flows })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const flow = await createFlow(body)
    return NextResponse.json({ flow }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
