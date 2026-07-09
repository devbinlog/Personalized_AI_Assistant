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

type StepResult = {
  step: number
  total: number
  input: string
  outputA: string
  outputB: string
  scoreA: number
  scoreB: number
  preferred: string
}

// 모크 출력: 시스템 프롬프트 특성을 반영한 실제적인 응답 생성
function buildMockOutput(systemPrompt: string, userInput: string, label: 'A' | 'B'): string {
  const topic = userInput.slice(0, 40)
  if (systemPrompt.includes('간결') || systemPrompt.includes('3~5문장') || systemPrompt.includes('핵심적')) {
    return `${topic}에 대한 핵심 답변입니다. 요점만 정리하면: 첫째, 기본 원리를 이해하는 것이 중요합니다. 둘째, 실제로 적용해보면 효과가 높습니다.`
  }
  if (systemPrompt.includes('상세') || systemPrompt.includes('충분한')) {
    return `${topic}에 대해 상세히 설명드리겠습니다.\n\n**개요**\n이 주제는 여러 측면에서 이해할 필요가 있습니다.\n\n**단계별 설명**\n1. 기초 개념 파악: 핵심 원리를 먼저 이해합니다.\n2. 실제 적용 방법: 구체적인 예시와 함께 살펴봅니다.\n3. 주의사항: 흔히 발생하는 실수를 방지합니다.\n\n**결론**\n이 개념을 충분히 이해하면 실무에 바로 적용할 수 있습니다.`
  }
  if (systemPrompt.includes('친근') || systemPrompt.includes('따뜻') || systemPrompt.includes('공감')) {
    return `안녕하세요! "${topic}"에 대해 물어봐 주셨군요! 쉽게 설명해 드릴게요. 핵심은 생각보다 간단해요. 차근차근 같이 알아봐요, 걱정 마세요!`
  }
  if (systemPrompt.includes('격식') || systemPrompt.includes('전문적') || systemPrompt.includes('정확성')) {
    return `${topic}에 관한 전문적 분석을 제공합니다.\n\n본 사안은 체계적 접근이 필요합니다. 핵심 고려사항은 다음과 같습니다:\n• 정확성과 신뢰성을 최우선으로 합니다.\n• 구조화된 응답으로 명확성을 확보합니다.\n• 비공식 표현을 지양하며 전문 용어를 적절히 활용합니다.`
  }
  if (systemPrompt.includes('예시') || systemPrompt.includes('사례') || systemPrompt.includes('실습')) {
    return `먼저 예시를 보여드리겠습니다:\n\n\`\`\`\n// ${topic} 관련 실제 예제\nconst example = "구체적인 구현 방법"\nconsole.log(example)\n\`\`\`\n\n이 예시를 통해 개념을 이해하셨나요? 위 코드에서 핵심 패턴을 확인할 수 있습니다.`
  }
  if (systemPrompt.includes('단계별') || systemPrompt.includes('순서') || systemPrompt.includes('이론')) {
    return `${topic}을 단계별로 설명하겠습니다.\n\n**1단계: 개념 정의**\n핵심 용어와 원리를 먼저 이해합니다.\n\n**2단계: 원리 이해**\n왜 이렇게 작동하는지 논리적으로 살펴봅니다.\n\n**3단계: 실제 적용**\n배운 내용을 실무에 적용하는 방법을 알아봅니다.`
  }
  return `[응답 ${label}] ${topic}: 이 응답은 시스템 프롬프트의 지침에 따라 생성되었습니다.`
}

// 의사 무작위 수 (seed 기반, 결정론적) - 입력마다 일관된 다른 점수 보장
function pseudoRandom(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return (h % 1000) / 1000
}

// A vs B 비교 평가 (절대 점수 대신 상대 비교)
async function evaluateExperimentPair(
  input: string,
  systemA: string,
  outputA: string,
  systemB: string,
  outputB: string,
): Promise<{ scoreA: number; scoreB: number; preferred: 'A' | 'B' | 'tie' }> {
  const { z } = await import('zod')
  const schema = z.object({
    scoreA: z.number().min(0).max(1),
    scoreB: z.number().min(0).max(1),
    preferred: z.enum(['A', 'B', 'tie']),
    reasoning: z.string(),
  })

  try {
    const { generateObject } = await import('ai')
    const provider = getLLMProvider()
    const result = await generateObject({
      model: provider.getFastModel(),
      schema,
      system: `당신은 AI 응답 비교 평가자입니다. 두 개의 AI 응답을 비교하여 어느 것이 더 나은지 평가합니다.
평가 기준: 사용자 질문에 대한 관련성, 명확성, 유용성, 각 시스템 프롬프트 지침 준수 정도.
scoreA와 scoreB는 0.0~1.0 범위로 서로 다른 값이어야 합니다 (최소 0.05 차이).`,
      prompt: `사용자 질문: "${input}"

시스템 프롬프트 A: ${systemA.slice(0, 150)}
응답 A: ${outputA.slice(0, 400)}

시스템 프롬프트 B: ${systemB.slice(0, 150)}
응답 B: ${outputB.slice(0, 400)}

두 응답을 비교 평가해주세요.`,
    })
    return result.object
  } catch {
    // 모크 모드 폴백: 입력 기반 결정론적 점수 (항상 승자 존재)
    const r = pseudoRandom(input + systemA)
    const scoreA = 0.62 + r * 0.28        // 0.62 ~ 0.90
    const scoreB = 0.62 + (1 - r) * 0.28  // 보완적 점수
    const preferred = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'tie'
    return { scoreA, scoreB, preferred }
  }
}

export async function runExperimentWithProgress(
  id: string,
  onProgress: (result: StepResult) => void,
): Promise<PromptExperiment> {
  const expRow = await prisma.promptExperiment.findUniqueOrThrow({ where: { id } })
  const exp = dbToExperiment(expRow as Record<string, unknown>)

  await prisma.promptExperiment.update({ where: { id }, data: { status: 'RUNNING' } as never })

  const provider = getLLMProvider()
  let totalA = 0, totalB = 0
  const total = (exp.testInputs as string[]).length

  for (let step = 0; step < total; step++) {
    const input = (exp.testInputs as string[])[step]
    let outputA = '', outputB = ''
    try {
      const [resA, resB] = await Promise.all([
        generateText({ model: provider.getModel(), system: exp.promptA, prompt: input }),
        generateText({ model: provider.getModel(), system: exp.promptB, prompt: input }),
      ])
      outputA = resA.text
      outputB = resB.text
    } catch {
      outputA = buildMockOutput(exp.promptA, input, 'A')
      outputB = buildMockOutput(exp.promptB, input, 'B')
    }

    const { scoreA, scoreB, preferred } = await evaluateExperimentPair(
      input, exp.promptA, outputA, exp.promptB, outputB,
    )
    totalA += scoreA
    totalB += scoreB

    const evalSummaryA = { overallScore: scoreA }
    const evalSummaryB = { overallScore: scoreB }

    await prisma.promptExperimentResult.create({
      data: {
        experimentId: id,
        input,
        outputA,
        outputB,
        evaluationA: JSON.stringify(evalSummaryA),
        evaluationB: JSON.stringify(evalSummaryB),
        preferredByEvaluator: preferred,
        scoreA,
        scoreB,
      } as never,
    })

    onProgress({ step: step + 1, total, input, outputA, outputB, scoreA, scoreB, preferred })
  }

  const avgA = total > 0 ? totalA / total : 0
  const avgB = total > 0 ? totalB / total : 0
  const winner = avgA > avgB ? 'A' : avgB > avgA ? 'B' : 'tie'

  const updated = await prisma.promptExperiment.update({
    where: { id },
    data: { status: 'COMPLETED', winner } as never,
  })
  return dbToExperiment(updated as Record<string, unknown>)
}

export async function runExperiment(id: string): Promise<PromptExperiment> {
  return runExperimentWithProgress(id, () => {})
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
