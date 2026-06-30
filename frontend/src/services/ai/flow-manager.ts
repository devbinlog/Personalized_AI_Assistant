import { prisma } from '@/lib/prisma'
import type { ConversationFlow, ConversationFlowStep } from '@/types'

function dbToFlow(row: Record<string, unknown>): ConversationFlow {
  return {
    ...row,
    steps: JSON.parse((row.steps as string) || '[]'),
  } as ConversationFlow
}

export async function getFlows(): Promise<ConversationFlow[]> {
  const rows = await prisma.conversationFlow.findMany({ orderBy: { createdAt: 'asc' } })
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
