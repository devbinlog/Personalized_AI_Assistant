import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getExperimentResults } from '@/services/ai/experiment-runner'
import { resolveUserId } from '@/lib/resolve-user'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await resolveUserId()
  if (userId === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
  } catch {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
}
