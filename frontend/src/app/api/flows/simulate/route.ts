import { NextRequest, NextResponse } from 'next/server'
import { getActiveFlow, simulateFlow } from '@/services/ai/flow-manager'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { input, flowId } = await req.json()
    let flow = null
    if (flowId) {
      const row = await prisma.conversationFlow.findUnique({ where: { id: flowId } })
      if (row) flow = { ...row, steps: JSON.parse((row.steps as string) || '[]') }
    } else {
      flow = await getActiveFlow()
    }
    if (!flow) return NextResponse.json({ error: 'No flow found' }, { status: 404 })
    const result = simulateFlow(input as string, flow as Parameters<typeof simulateFlow>[1])
    return NextResponse.json({ result, flowName: flow.name })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
