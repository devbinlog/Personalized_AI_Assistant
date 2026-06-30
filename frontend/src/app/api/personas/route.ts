import { NextRequest, NextResponse } from 'next/server'
import { getPersonas, createPersona } from '@/services/ai/persona-manager'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const personas = await getPersonas()
    return NextResponse.json({ personas })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const persona = await createPersona(body)
    return NextResponse.json({ persona }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
