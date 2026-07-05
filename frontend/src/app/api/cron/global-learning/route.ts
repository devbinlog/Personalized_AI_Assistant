import { NextRequest, NextResponse } from 'next/server'
import { generateGlobalMemory } from '@/services/ai/global-memory-generator'

// Called by Vercel Cron (vercel.json) or external scheduler
// Protected by CRON_SECRET header.
// When CRON_SECRET is not set (local dev), internal calls are allowed without auth.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret) {
    // Production: require matching Bearer token
    const secret = req.headers.get('authorization')
    if (secret !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  // If CRON_SECRET is not set, allow the request (local dev / internal calls)

  try {
    const memory = await generateGlobalMemory()
    return NextResponse.json({ ok: true, memory })
  } catch (e) {
    console.error('[cron/global-learning]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
