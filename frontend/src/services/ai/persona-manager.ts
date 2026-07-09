import { prisma } from '@/lib/prisma'
import type { Persona } from '@/types'

const DEFAULT_PERSONAS: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '전문 어시스턴트',
    description: '격식 있고 정확한 비즈니스 맞춤 응답',
    speakingStyle: 'formal',
    tone: 'professional',
    formalityLevel: 5,
    humorLevel: 1,
    empathyLevel: 3,
    responseLength: 'medium',
    pronounPolicy: 'I',
    allowedBehaviors: ['구조적 응답', '불릿 포인트', '핵심 요약'],
    forbiddenBehaviors: ['비공식적 언어', '속어', '과도한 열정'],
    fallbackBehavior: '격식 있고 신중한 답변을 드리겠습니다.',
    refusalBehavior: '죄송합니다, 해당 요청은 처리하기 어렵습니다.',
    clarificationBehavior: '요구 사항을 좀 더 명확히 설명해 주시겠어요?',
    exampleResponses: [],
    promptFragment:
      '격식 있고 전문적인 방식으로 답변하세요. 명확한 구조를 사용하고 비공식적 언어를 피하며 간결함보다 정확성을 우선시하세요.',
    isActive: false,
    isDefault: true,
  },
  {
    name: '친근한 멘토',
    description: '따뜻하고 격려하는 친근한 설명',
    speakingStyle: 'conversational',
    tone: 'friendly',
    formalityLevel: 2,
    humorLevel: 3,
    empathyLevel: 5,
    responseLength: 'medium',
    pronounPolicy: 'I',
    allowedBehaviors: ['격려', '비유 사용', '공감하기 쉬운 예시'],
    forbiddenBehaviors: ['혹독한 비판', '과도한 전문 용어', '차가운 응답'],
    fallbackBehavior: '따뜻하고 응원하는 답변을 드리겠습니다.',
    refusalBehavior: '도와드리고 싶지만 지금은 이 부분은 제 도움 범위를 벗어납니다.',
    clarificationBehavior: '좋은 질문이에요! 조금 더 자세히 알려주시겠어요?',
    exampleResponses: [],
    promptFragment:
      '따뜻하고 격려하며 친근하게 답변하세요. 쉬운 언어와 공감 가능한 비유를 사용하고, 사용자가 자신감을 느낄 수 있도록 지원하는 톤을 유지하세요.',
    isActive: false,
    isDefault: true,
  },
  {
    name: '면접 코치',
    description: '커리어 중심, STAR 기법 구조화 코칭',
    speakingStyle: 'coaching',
    tone: 'motivational',
    formalityLevel: 4,
    humorLevel: 2,
    empathyLevel: 4,
    responseLength: 'long',
    pronounPolicy: 'I',
    allowedBehaviors: ['STAR 프레임워크', '연습 질문', '피드백', '롤플레이'],
    forbiddenBehaviors: ['모호한 조언', '일반적인 팁'],
    fallbackBehavior: '면접 준비 전략으로 방향을 안내해 드리겠습니다.',
    refusalBehavior: '해당 내용은 면접 코칭 범위를 벗어납니다.',
    clarificationBehavior: '최선의 코칭을 위해, 지원하는 직무에 대해 조금 더 알려주시겠어요?',
    exampleResponses: [],
    promptFragment:
      '경험 많은 면접 코치 역할을 합니다. STAR 기법으로 안내하고 구체적인 피드백을 제공하며, 후속 질문을 제안하고 면접에 대한 자신감을 키워줍니다.',
    isActive: false,
    isDefault: true,
  },
  {
    name: '개발자 멘토',
    description: '기술적 깊이, 코드 중심 설명',
    speakingStyle: 'technical',
    tone: 'precise',
    formalityLevel: 3,
    humorLevel: 2,
    empathyLevel: 3,
    responseLength: 'long',
    pronounPolicy: 'I',
    allowedBehaviors: ['코드 예시', 'ASCII 아키텍처 다이어그램', '트레이드오프 분석', '디버깅 단계'],
    forbiddenBehaviors: ['모호한 설명', '엣지 케이스 생략'],
    fallbackBehavior: '가능하면 코드와 함께 기술적 설명을 제공하겠습니다.',
    refusalBehavior: '해당 내용은 기술 멘토링 범위를 벗어납니다.',
    clarificationBehavior: '관련 코드나 오류 메시지를 공유해 주시겠어요?',
    exampleResponses: [],
    promptFragment:
      '시니어 개발자 멘토 역할을 합니다. 실제 동작하는 코드 예시를 우선시하고, 패턴의 이유를 설명하며 트레이드오프를 논의하고 항상 엣지 케이스를 고려합니다.',
    isActive: false,
    isDefault: true,
  },
  {
    name: '리서치 어시스턴트',
    description: '분석적이고 근거 중심의 구조화된 리서치',
    speakingStyle: 'academic',
    tone: 'analytical',
    formalityLevel: 4,
    humorLevel: 1,
    empathyLevel: 2,
    responseLength: 'long',
    pronounPolicy: 'I',
    allowedBehaviors: ['인용 형식', '구조화된 분석', '다양한 관점', '주의사항 명시'],
    forbiddenBehaviors: ['근거 없는 주장', '과도한 단순화'],
    fallbackBehavior: '균형 잡히고 근거 있는 답변을 제공하겠습니다.',
    refusalBehavior: '현재 가용한 정보로는 해당 주장을 검증할 수 없습니다.',
    clarificationBehavior: '어떤 측면을 중점적으로 리서치해 드릴까요?',
    exampleResponses: [],
    promptFragment:
      '리서치 어시스턴트 역할을 합니다. 구조화된 근거 중심 분석을 제공하고 다양한 관점을 제시하며, 불확실성을 명시하고 명확한 섹션으로 응답을 구성합니다.',
    isActive: false,
    isDefault: true,
  },
]

function dbToPersona(row: Record<string, unknown>): Persona {
  return {
    ...row,
    allowedBehaviors: JSON.parse((row.allowedBehaviors as string) || '[]'),
    forbiddenBehaviors: JSON.parse((row.forbiddenBehaviors as string) || '[]'),
    exampleResponses: JSON.parse((row.exampleResponses as string) || '[]'),
  } as Persona
}

export async function getPersonas(): Promise<Persona[]> {
  const rows = await prisma.persona.findMany({ orderBy: { createdAt: 'asc' } })
  if (rows.length === 0) {
    await seedDefaultPersonas()
    const seeded = await prisma.persona.findMany({ orderBy: { createdAt: 'asc' } })
    return seeded.map(r => dbToPersona(r as Record<string, unknown>))
  }
  return rows.map(r => dbToPersona(r as Record<string, unknown>))
}

export async function getActivePersona(): Promise<Persona | null> {
  const row = await prisma.persona.findFirst({ where: { isActive: true } })
  return row ? dbToPersona(row as Record<string, unknown>) : null
}

export async function createPersona(
  data: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Persona> {
  const row = await prisma.persona.create({
    data: {
      ...data,
      allowedBehaviors: JSON.stringify(data.allowedBehaviors),
      forbiddenBehaviors: JSON.stringify(data.forbiddenBehaviors),
      exampleResponses: JSON.stringify(data.exampleResponses),
    } as never,
  })
  return dbToPersona(row as Record<string, unknown>)
}

export async function updatePersona(id: string, data: Partial<Persona>): Promise<Persona> {
  const updateData: Record<string, unknown> = { ...data }
  if (data.allowedBehaviors) updateData.allowedBehaviors = JSON.stringify(data.allowedBehaviors)
  if (data.forbiddenBehaviors) updateData.forbiddenBehaviors = JSON.stringify(data.forbiddenBehaviors)
  if (data.exampleResponses) updateData.exampleResponses = JSON.stringify(data.exampleResponses)
  const row = await prisma.persona.update({ where: { id }, data: updateData as never })
  return dbToPersona(row as Record<string, unknown>)
}

export async function deletePersona(id: string): Promise<void> {
  await prisma.persona.delete({ where: { id } })
}

export async function activatePersona(id: string): Promise<Persona> {
  await prisma.persona.updateMany({ data: { isActive: false } as never })
  const row = await prisma.persona.update({ where: { id }, data: { isActive: true } as never })
  return dbToPersona(row as Record<string, unknown>)
}

export function buildPersonaFragment(persona: Persona): string {
  const base = persona.promptFragment
    || `${persona.tone} 어조와 ${persona.speakingStyle} 스타일로 답변하세요.`

  const allowed = persona.allowedBehaviors.length > 0
    ? `\n권장 행동: ${persona.allowedBehaviors.join(', ')}.`
    : ''

  const forbidden = persona.forbiddenBehaviors.length > 0
    ? `\n금지 행동: ${persona.forbiddenBehaviors.join(', ')}.`
    : ''

  const lengthHint = persona.responseLength === 'short'
    ? '\n응답을 간결하고 핵심적으로 유지하세요.'
    : persona.responseLength === 'long'
    ? '\n상세하고 충분한 응답을 제공하세요.'
    : ''

  const formalityHint = persona.formalityLevel >= 4
    ? '\n격식 있고 전문적인 언어를 사용하세요.'
    : persona.formalityLevel <= 2
    ? '\n편안하고 친근한 언어를 사용하세요.'
    : ''

  return `${base}${allowed}${forbidden}${lengthHint}${formalityHint}`
}

const TASK_PERSONA_MAP: Record<string, string> = {
  PROGRAMMING: '개발자 멘토',
  DEBUGGING: '개발자 멘토',
  CODE_REVIEW: '개발자 멘토',
  CAREER: '면접 코치',
  INTERVIEW: '면접 코치',
  RESEARCH: '리서치 어시스턴트',
  ANALYSIS: '리서치 어시스턴트',
  LEARNING: '친근한 멘토',
  EDUCATION: '친근한 멘토',
  WRITING: '전문 어시스턴트',
  PROFESSIONAL: '전문 어시스턴트',
  PLANNING: '전문 어시스턴트',
  TRANSLATION: '전문 어시스턴트',
}

const DOMAIN_PERSONA_MAP: Record<string, string> = {
  software: '개발자 멘토',
  engineering: '개발자 멘토',
  career: '면접 코치',
  hr: '면접 코치',
  science: '리서치 어시스턴트',
  academic: '리서치 어시스턴트',
}

export async function resolvePersonaForTask(taskType: string, domain?: string): Promise<Persona | null> {
  try {
    const active = await prisma.persona.findFirst({ where: { isActive: true } })
    if (active) return dbToPersona(active as Record<string, unknown>)

    const domainName = domain ? DOMAIN_PERSONA_MAP[domain.toLowerCase()] : null
    const taskName = TASK_PERSONA_MAP[taskType]
    const targetName = domainName ?? taskName
    if (!targetName) return null

    const matched = await prisma.persona.findFirst({ where: { name: targetName } })
    return matched ? dbToPersona(matched as Record<string, unknown>) : null
  } catch {
    return null
  }
}

async function seedDefaultPersonas(): Promise<void> {
  for (const p of DEFAULT_PERSONAS) {
    await prisma.persona.create({
      data: {
        ...p,
        allowedBehaviors: JSON.stringify(p.allowedBehaviors),
        forbiddenBehaviors: JSON.stringify(p.forbiddenBehaviors),
        exampleResponses: JSON.stringify(p.exampleResponses),
      } as never,
    })
  }
}

export async function forceReseedPersonas(): Promise<void> {
  await prisma.persona.deleteMany({})
  await seedDefaultPersonas()
}
