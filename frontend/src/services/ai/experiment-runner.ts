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

const DEFAULT_EXPERIMENTS: Pick<PromptExperiment, 'name' | 'description' | 'promptA' | 'promptB' | 'testInputs'>[] = [
  {
    name: '격식체 vs 친근한 어조',
    description: '동일한 질문에 격식 있는 어조와 친근한 어조로 답변할 때 사용자 경험 차이 비교',
    promptA: '격식 있고 전문적인 방식으로 답변하세요. 명확한 구조를 사용하고 비공식적 언어를 피하며 간결함보다 정확성을 우선시하세요.',
    promptB: '친근하고 따뜻한 말투로 답변하세요. 어려운 용어 대신 쉬운 언어를 사용하고 사용자가 편안함을 느낄 수 있도록 공감적인 표현을 활용하세요.',
    testInputs: [
      '파이썬에서 리스트를 정렬하는 방법을 알려줘',
      '오늘 할 일을 정리하는 데 도움을 줘',
      '이력서 자기소개서 첫 문장 어떻게 시작하면 좋을까?',
    ],
  },
  {
    name: '간결한 답변 vs 상세한 답변',
    description: '짧고 핵심적인 답변과 충분한 배경 설명을 포함한 상세 답변 중 어느 쪽이 더 효과적인지 평가',
    promptA: '응답을 간결하고 핵심적으로 유지하세요. 3~5문장 이내로 답변하고 가장 중요한 정보만 전달하세요.',
    promptB: '상세하고 충분한 응답을 제공하세요. 배경 설명, 단계별 절차, 예시를 포함하여 사용자가 완전히 이해할 수 있도록 안내하세요.',
    testInputs: [
      'JWT 토큰 인증은 어떻게 작동하나요?',
      '리액트 useEffect 훅을 언제 사용해야 하나요?',
      '데이터베이스 인덱스가 왜 중요한가요?',
    ],
  },
  {
    name: '단계별 설명 vs 예시 중심 설명',
    description: '개념을 순서대로 단계별로 설명하는 방식과 구체적인 예시와 코드를 먼저 보여주는 방식 비교',
    promptA: '개념을 먼저 정의하고 작동 원리를 순서대로 단계별로 설명하세요. 논리적 흐름을 중시하며 이론적 배경부터 실용적 적용으로 진행하세요.',
    promptB: '먼저 구체적인 코드 예시나 실제 사례를 보여주고 그것을 바탕으로 개념을 설명하세요. 실습 중심으로 접근하여 직관적 이해를 돕습니다.',
    testInputs: [
      '클로저(closure)가 뭔지 설명해줘',
      'REST API와 GraphQL 차이점이 뭐야?',
      '도커 컨테이너와 가상 머신의 차이는?',
    ],
  },
]

export async function getExperiments(): Promise<PromptExperiment[]> {
  const rows = await prisma.promptExperiment.findMany({ orderBy: { createdAt: 'desc' } })

  if (rows.length === 0) {
    await seedDefaultExperiments()
    const seeded = await prisma.promptExperiment.findMany({ orderBy: { createdAt: 'desc' } })
    return seeded.map(r => dbToExperiment(r as Record<string, unknown>))
  }

  return rows.map(r => dbToExperiment(r as Record<string, unknown>))
}

async function seedDefaultExperiments(): Promise<void> {
  for (const exp of DEFAULT_EXPERIMENTS) {
    await prisma.promptExperiment.create({
      data: {
        ...exp,
        testInputs: JSON.stringify(exp.testInputs),
        status: 'DRAFT',
      } as never,
    })
  }
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

/**
 * 가장 최근에 완료된 실험의 승자 프롬프트를 반환.
 * 실험이 없거나 winner가 'tie'면 null 반환.
 */
export async function getWinningSystemPrompt(): Promise<string | null> {
  try {
    const experiment = await prisma.promptExperiment.findFirst({
      where: { status: 'COMPLETED', winner: { in: ['A', 'B'] } },
      orderBy: { updatedAt: 'desc' },
    })
    if (!experiment) return null
    const winner = experiment.winner as string
    return winner === 'A'
      ? (experiment.promptA as string)
      : (experiment.promptB as string)
  } catch {
    return null
  }
}
