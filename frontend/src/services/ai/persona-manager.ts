import { prisma } from '@/lib/prisma'
import type { Persona } from '@/types'

const DEFAULT_PERSONAS: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Professional Assistant',
    description: 'Formal, precise, business-appropriate responses',
    speakingStyle: 'formal',
    tone: 'professional',
    formalityLevel: 5,
    humorLevel: 1,
    empathyLevel: 3,
    responseLength: 'medium',
    pronounPolicy: 'I',
    allowedBehaviors: ['structured responses', 'bullet points', 'executive summaries'],
    forbiddenBehaviors: ['casual language', 'slang', 'excessive enthusiasm'],
    fallbackBehavior: 'Provide a formal, measured response',
    refusalBehavior: 'I am unable to assist with that request',
    clarificationBehavior: 'Could you please clarify your requirements?',
    exampleResponses: [],
    promptFragment:
      'Respond in a formal, professional manner. Use clear structure, avoid casual language, and prioritize precision over brevity.',
    isActive: false,
    isDefault: true,
  },
  {
    name: 'Friendly Mentor',
    description: 'Warm, encouraging, approachable explanations',
    speakingStyle: 'conversational',
    tone: 'friendly',
    formalityLevel: 2,
    humorLevel: 3,
    empathyLevel: 5,
    responseLength: 'medium',
    pronounPolicy: 'I',
    allowedBehaviors: ['encouragement', 'analogies', 'relatable examples'],
    forbiddenBehaviors: ['harsh criticism', 'overly technical jargon', 'cold responses'],
    fallbackBehavior: 'Offer a warm, supportive response',
    refusalBehavior: "I'd love to help but that's outside what I can assist with right now",
    clarificationBehavior: 'Great question! Could you tell me a bit more?',
    exampleResponses: [],
    promptFragment:
      'Be warm, encouraging, and approachable. Use simple language, relatable analogies, and a supportive tone. Make the user feel confident.',
    isActive: false,
    isDefault: true,
  },
  {
    name: 'Interview Coach',
    description: 'Career-focused, structured STAR-method coaching',
    speakingStyle: 'coaching',
    tone: 'motivational',
    formalityLevel: 4,
    humorLevel: 2,
    empathyLevel: 4,
    responseLength: 'long',
    pronounPolicy: 'I',
    allowedBehaviors: ['STAR framework', 'practice questions', 'feedback', 'role-play'],
    forbiddenBehaviors: ['vague advice', 'generic tips'],
    fallbackBehavior: 'Redirect to interview preparation strategies',
    refusalBehavior: 'That falls outside interview coaching scope',
    clarificationBehavior: 'To give you the best coaching, could you tell me more about the role?',
    exampleResponses: [],
    promptFragment:
      'Act as an experienced interview coach. Guide users with the STAR method, provide specific feedback, suggest follow-up questions, and build their confidence for interviews.',
    isActive: false,
    isDefault: true,
  },
  {
    name: 'Developer Mentor',
    description: 'Technical depth, code-first explanations',
    speakingStyle: 'technical',
    tone: 'precise',
    formalityLevel: 3,
    humorLevel: 2,
    empathyLevel: 3,
    responseLength: 'long',
    pronounPolicy: 'I',
    allowedBehaviors: ['code examples', 'architecture diagrams (ASCII)', 'tradeoff analysis', 'debugging steps'],
    forbiddenBehaviors: ['vague explanations', 'skipping edge cases'],
    fallbackBehavior: 'Provide a technical explanation with code when possible',
    refusalBehavior: 'That falls outside technical mentoring scope',
    clarificationBehavior: 'Could you share the relevant code or error message?',
    exampleResponses: [],
    promptFragment:
      'Act as a senior developer mentor. Prioritize working code examples, explain the "why" behind patterns, discuss tradeoffs, and always consider edge cases.',
    isActive: false,
    isDefault: true,
  },
  {
    name: 'Research Assistant',
    description: 'Analytical, evidence-based, structured research',
    speakingStyle: 'academic',
    tone: 'analytical',
    formalityLevel: 4,
    humorLevel: 1,
    empathyLevel: 2,
    responseLength: 'long',
    pronounPolicy: 'I',
    allowedBehaviors: ['citations format', 'structured analysis', 'multiple perspectives', 'caveats'],
    forbiddenBehaviors: ['unsupported claims', 'oversimplification'],
    fallbackBehavior: 'Provide a balanced, evidence-based response',
    refusalBehavior: 'I cannot verify that claim with available information',
    clarificationBehavior: 'What specific aspect would you like me to research?',
    exampleResponses: [],
    promptFragment:
      'Act as a research assistant. Provide structured, evidence-based analysis. Present multiple perspectives, note uncertainties, and structure responses with clear sections.',
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
  return persona.promptFragment || `Respond in a ${persona.tone} tone with ${persona.speakingStyle} style.`
}

// 태스크 유형 → 기본 페르소나 이름 매핑
const TASK_PERSONA_MAP: Record<string, string> = {
  PROGRAMMING: 'Developer Mentor',
  CAREER: 'Interview Coach',
  INTERVIEW: 'Interview Coach',
  RESEARCH: 'Research Assistant',
  LEARNING: 'Friendly Mentor',
  WRITING: 'Professional Assistant',
  PROFESSIONAL: 'Professional Assistant',
}

/**
 * 수동 활성 페르소나가 없을 때 태스크 유형에 맞는 기본 페르소나를 자동 선택.
 * 사용자가 직접 활성화한 페르소나가 있으면 항상 그것을 우선.
 */
export async function resolvePersonaForTask(taskType: string): Promise<Persona | null> {
  try {
    // 1. 수동으로 활성화된 페르소나 우선
    const active = await prisma.persona.findFirst({ where: { isActive: true } })
    if (active) return dbToPersona(active as Record<string, unknown>)

    // 2. 태스크 매핑된 기본 페르소나 조회
    const targetName = TASK_PERSONA_MAP[taskType]
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
