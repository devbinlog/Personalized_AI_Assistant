import { NextResponse } from 'next/server'
import { getGlobalMemory, generateGlobalMemory } from '@/services/ai/global-memory-generator'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const memory = await getGlobalMemory()
    return NextResponse.json({ memory })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST() {
  try {
    const memory = await generateGlobalMemory()
    return NextResponse.json({ memory })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
