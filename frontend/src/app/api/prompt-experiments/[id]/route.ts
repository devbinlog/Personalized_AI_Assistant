import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getExperimentResults } from '@/services/ai/experiment-runner'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const row = await prisma.promptExperiment.findUniqueOrThrow({ where: { id } })
    const results = await getExperimentResults(id)
    const experiment = {
      ...row,
      testInputs: JSON.parse((row.testInputs as string) || '[]'),
      results,
    }
    return NextResponse.json({ experiment })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 404 })
  }
}
