import { prisma } from '@/lib/prisma'
import type { ConversationFlow, ConversationFlowStep } from '@/types'

const DEFAULT_FLOWS: Omit<ConversationFlow, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '기술 지원 플로우',
    description: '개발, 오류, 코드 리뷰 등 기술 관련 질문에 최적화된 대화 흐름',
    domain: 'technology',
    triggerCondition: '코드, 오류, 버그, 개발, 기술 관련 질문',
    fallbackPolicy: '기술적인 맥락에서 명확하고 구체적인 답변을 제공하겠습니다.',
    clarificationPolicy: '어떤 언어나 프레임워크를 사용 중이신지 알려주시겠어요?',
    errorRecoveryPolicy: '다른 접근 방법으로 다시 시도해 보겠습니다.',
    searchPolicy: 'auto',
    isActive: false,
    steps: [
      {
        id: 'step_tech_1',
        name: '오류 진단',
        triggerKeywords: ['오류', '에러', 'error', 'bug', '버그', '실패', 'failed', 'exception'],
        instruction:
          '오류 메시지와 스택 트레이스를 분석하여 원인을 진단합니다. 가능한 원인을 나열하고 단계별 해결책을 코드 예시와 함께 제시하세요.',
        searchPolicy: 'auto',
      },
      {
        id: 'step_tech_2',
        name: '코드 리뷰',
        triggerKeywords: ['코드', 'code', '리뷰', 'review', '개선', '최적화', 'refactor', '리팩터'],
        instruction:
          '제공된 코드를 검토하고 가독성, 성능, 보안 관점에서 개선점을 제안합니다. 수정된 코드 예시와 이유를 함께 설명하세요.',
        searchPolicy: 'never',
      },
      {
        id: 'step_tech_3',
        name: '아키텍처 논의',
        triggerKeywords: ['설계', '아키텍처', 'architecture', '구조', 'design', '패턴', 'pattern', '시스템'],
        instruction:
          '시스템 설계와 아키텍처 패턴에 대해 트레이드오프를 설명합니다. ASCII 다이어그램과 구체적인 예시를 활용하여 장단점을 비교해 주세요.',
        searchPolicy: 'auto',
      },
    ],
  },
  {
    name: '커리어 코칭 플로우',
    description: '이직, 면접 준비, 커리어 고민 등 취업/경력 관련 대화 흐름',
    domain: 'career',
    triggerCondition: '이직, 면접, 커리어, 취업, 자기소개서 관련 질문',
    fallbackPolicy: '커리어 발전을 위한 구체적이고 실행 가능한 조언을 드리겠습니다.',
    clarificationPolicy: '지원하시는 직무나 회사에 대해 더 알려주시겠어요?',
    errorRecoveryPolicy: '다른 관점에서 커리어 전략을 다시 살펴보겠습니다.',
    searchPolicy: 'never',
    isActive: false,
    steps: [
      {
        id: 'step_career_1',
        name: '면접 준비',
        triggerKeywords: ['면접', 'interview', '자기소개', '지원', '합격', '질문', '답변'],
        instruction:
          'STAR 기법(상황-과제-행동-결과)을 활용해 면접 답변을 구조화합니다. 예상 질문과 모범 답안 예시를 제공하고 구체적인 피드백을 주세요.',
        searchPolicy: 'never',
      },
      {
        id: 'step_career_2',
        name: '커리어 설계',
        triggerKeywords: ['이직', '전직', '커리어', '고민', '방향', '성장', '로드맵', '경력'],
        instruction:
          '현재 경력과 목표를 분석하여 단계별 커리어 로드맵을 제안합니다. 강점과 개선점을 파악하고 6개월, 1년, 3년 단위의 구체적인 실행 계획을 수립하세요.',
        searchPolicy: 'never',
      },
      {
        id: 'step_career_3',
        name: '서류 작성',
        triggerKeywords: ['자소서', '자기소개서', '포트폴리오', 'resume', 'cv', '이력서', '지원서'],
        instruction:
          '자기소개서나 포트폴리오의 강점을 부각하고 개선점을 제안합니다. 구체적인 수치와 성과를 강조하는 방법을 안내하고 실제 문장 예시를 제공하세요.',
        searchPolicy: 'never',
      },
    ],
  },
  {
    name: '학습 가이드 플로우',
    description: '개념 학습, 공부 방법, 지식 정리 등 학습 관련 대화 흐름',
    domain: 'education',
    triggerCondition: '학습, 공부, 개념 이해, 설명 요청 관련 질문',
    fallbackPolicy: '쉽고 명확하게 이해할 수 있도록 단계별로 설명해 드리겠습니다.',
    clarificationPolicy: '어느 수준까지 알고 계신지 알려주시면 더 맞춤화된 설명을 드릴 수 있어요.',
    errorRecoveryPolicy: '다른 방식으로 설명해 보겠습니다.',
    searchPolicy: 'auto',
    isActive: false,
    steps: [
      {
        id: 'step_edu_1',
        name: '개념 설명',
        triggerKeywords: ['설명', '뭐야', '뭔가요', '이해', '개념', '원리', '무엇', '왜'],
        instruction:
          '개념을 초보자도 이해할 수 있도록 비유와 예시를 들어 단계적으로 설명합니다. 핵심 포인트를 먼저 제시한 뒤 세부 내용을 확장하는 구조로 작성하세요.',
        searchPolicy: 'auto',
      },
      {
        id: 'step_edu_2',
        name: '핵심 요약',
        triggerKeywords: ['요약', '정리', '핵심', '정리해줘', '요점', '핵심만', '간단히'],
        instruction:
          '주요 내용을 구조화된 형식(불릿 포인트, 표)으로 요약합니다. 가장 중요한 3~5가지 핵심 포인트를 강조하고 기억하기 쉬운 형태로 정리하세요.',
        searchPolicy: 'never',
      },
      {
        id: 'step_edu_3',
        name: '실습 문제',
        triggerKeywords: ['연습', '실습', '예제', '문제', '퀴즈', '테스트', '확인'],
        instruction:
          '개념 이해를 돕는 연습 문제나 실습 예제를 제시합니다. 단계별 힌트와 해설을 포함하고 틀리기 쉬운 부분을 짚어 학습 효과를 높이세요.',
        searchPolicy: 'never',
      },
    ],
  },
]

function dbToFlow(row: Record<string, unknown>): ConversationFlow {
  return {
    ...row,
    steps: JSON.parse((row.steps as string) || '[]'),
  } as ConversationFlow
}

export async function getFlows(): Promise<ConversationFlow[]> {
  const rows = await prisma.conversationFlow.findMany({ orderBy: { createdAt: 'asc' } })
  if (rows.length === 0) {
    await seedDefaultFlows()
    const seeded = await prisma.conversationFlow.findMany({ orderBy: { createdAt: 'asc' } })
    return seeded.map(r => dbToFlow(r as Record<string, unknown>))
  }
  return rows.map(r => dbToFlow(r as Record<string, unknown>))
}

export async function getActiveFlow(): Promise<ConversationFlow | null> {
  const row = await prisma.conversationFlow.findFirst({ where: { isActive: true } })
  return row ? dbToFlow(row as Record<string, unknown>) : null
}

export async function createFlow(
  data: Omit<ConversationFlow, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<ConversationFlow> {
  const row = await prisma.conversationFlow.create({
    data: { ...data, steps: JSON.stringify(data.steps) } as never,
  })
  return dbToFlow(row as Record<string, unknown>)
}

export async function updateFlow(id: string, data: Partial<ConversationFlow>): Promise<ConversationFlow> {
  const updateData: Record<string, unknown> = { ...data }
  if (data.steps !== undefined) updateData.steps = JSON.stringify(data.steps)
  const row = await prisma.conversationFlow.update({ where: { id }, data: updateData as never })
  return dbToFlow(row as Record<string, unknown>)
}

export async function deleteFlow(id: string): Promise<void> {
  await prisma.conversationFlow.delete({ where: { id } })
}

export async function activateFlow(id: string): Promise<ConversationFlow> {
  await prisma.conversationFlow.updateMany({ data: { isActive: false } as never })
  const row = await prisma.conversationFlow.update({ where: { id }, data: { isActive: true } as never })
  return dbToFlow(row as Record<string, unknown>)
}

export function simulateFlow(
  input: string,
  flow: ConversationFlow,
): { matchedStep: ConversationFlowStep | null; instruction: string; searchPolicy: string } {
  const lower = input.toLowerCase()
  const steps: ConversationFlowStep[] = flow.steps
  const matchedStep =
    steps.find(s => s.triggerKeywords.some(kw => lower.includes(kw.toLowerCase()))) ?? null
  return {
    matchedStep,
    instruction: matchedStep?.instruction ?? flow.fallbackPolicy,
    searchPolicy: matchedStep?.searchPolicy ?? flow.searchPolicy,
  }
}

async function seedDefaultFlows(): Promise<void> {
  for (const f of DEFAULT_FLOWS) {
    await prisma.conversationFlow.create({
      data: { ...f, steps: JSON.stringify(f.steps) } as never,
    })
  }
}

export async function forceReseedFlows(): Promise<void> {
  await prisma.conversationFlow.deleteMany({})
  await seedDefaultFlows()
}
