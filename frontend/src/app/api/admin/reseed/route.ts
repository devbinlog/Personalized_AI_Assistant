import { NextRequest, NextResponse } from 'next/server'
import { forceReseedPersonas } from '@/services/ai/persona-manager'
import { forceReseedFlows } from '@/services/ai/flow-manager'

export async function POST(req: NextRequest) {
  const seedSecret = process.env.SEED_SECRET
  if (!seedSecret) {
    return NextResponse.json({ error: 'SEED_SECRET not configured' }, { status: 500 })
  }
  const authHeader = req.headers.get('x-seed-secret')
  if (authHeader !== seedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await forceReseedPersonas()
  await forceReseedFlows()

  return NextResponse.json({ ok: true, message: '페르소나 5개 + 플로우 3개 한국어로 리시드 완료' })
}
