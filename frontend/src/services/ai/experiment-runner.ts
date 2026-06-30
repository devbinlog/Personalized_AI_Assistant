import { generateText } from 'ai'
import { getLLMProvider } from './provider'
import { prisma } from '@/lib/prisma'
import { evaluateCandidatesExpanded } from './expanded-evaluator'
import type { PromptExperiment, PromptExperimentResult } from '@/types'

function dbToExperiment(row: Record<string, unknown>): PromptExperiment {
  return {
    ...row,
    testInputs: JSON.parse((row.testInputs as string) || '[]'),
    results: undefined,
  } as PromptExperiment
}

export async function getExperiments(): Promise<PromptExperiment[]> {
  const rows = await prisma.promptExperiment.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map(r => dbToExperiment(r as Record<string, unknown>))
}

export async function getExperimentResults(id: string): Promise<PromptExperimentResult[]> {
  const rows = await prisma.promptExperimentResult.findMany({
    where: { experimentId: id },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(r => ({
    ...r,
    evaluationA: JSON.parse((r.evaluationA as string) || '{}'),
    evaluationB: JSON.parse((r.evaluationB as string) || '{}'),
  })) as PromptExperimentResult[]
}

export async function createExperiment(
  data: Pick<PromptExperiment, 'name' | 'description' | 'promptA' | 'promptB' | 'testInputs'>,
): Promise<PromptExperiment> {
  const row = await prisma.promptExperiment.create({
    data: {
      ...data,
      testInputs: JSON.stringify(data.testInputs),
      status: 'DRAFT',
    } as never,
  })
  return dbToExperiment(row as Record<string, unknown>)
}

export async function runExperiment(id: string): Promise<PromptExperiment> {
  const expRow = await prisma.promptExperiment.findUniqueOrThrow({ where: { id } })
  const exp = dbToExperiment(expRow as Record<string, unknown>)

  await prisma.promptExperiment.update({ where: { id }, data: { status: 'RUNNING' } as never })

  const provider = getLLMProvider()
  let totalA = 0,
    totalB = 0

  for (const input of exp.testInputs) {
    let outputA = '',
      outputB = ''
    try {
      const [resA, resB] = await Promise.all([
        generateText({ model: provider.getModel(), system: exp.promptA, prompt: input }),
        generateText({ model: provider.getModel(), system: exp.promptB, prompt: input }),
      ])
      outputA = resA.text
      outputB = resB.text
    } catch {
      outputA = `[Mock output A for: ${input.slice(0, 50)}]`
      outputB = `[Mock output B for: ${input.slice(0, 50)}]`
    }

    const [evalsA, evalsB] = await Promise.all([
      evaluateCandidatesExpanded(input, [{ strategy: 'STRUCTURED', content: outputA, index: 0 }], null),
      evaluateCandidatesExpanded(input, [{ strategy: 'STRUCTURED', content: outputB, index: 0 }], null),
    ])

    const evalA = evalsA[0]
    const evalB = evalsB[0]
    const scoreA = evalA?.overallScore ?? 0.7
    const scoreB = evalB?.overallScore ?? 0.7
    totalA += scoreA
    totalB += scoreB

    await prisma.promptExperimentResult.create({
      data: {
        experimentId: id,
        input,
        outputA,
        outputB,
        evaluationA: JSON.stringify(evalA ?? {}),
        evaluationB: JSON.stringify(evalB ?? {}),
        preferredByEvaluator: scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'tie',
        scoreA,
        scoreB,
      } as never,
    })
  }

  const count = exp.testInputs.length
  const avgA = count > 0 ? totalA / count : 0
  const avgB = count > 0 ? totalB / count : 0
  const winner = avgA > avgB ? 'A' : avgB > avgA ? 'B' : 'tie'

  const updated = await prisma.promptExperiment.update({
    where: { id },
    data: { status: 'COMPLETED', winner } as never,
  })
  return dbToExperiment(updated as Record<string, unknown>)
}
