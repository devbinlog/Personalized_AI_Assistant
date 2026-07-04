import { NextRequest, NextResponse } from 'next/server'
import { generateGlobalMemory } from '@/services/ai/global-memory-generator'

// Called by Vercel Cron (vercel.json) or external scheduler
// Protected by CRON_SECRET header
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`

  if (!process.env.CRON_SECRET || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const memory = await generateGlobalMemory()
    return NextResponse.json({ ok: true, memory })
  } catch (e) {
    console.error('[cron/global-learning]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
