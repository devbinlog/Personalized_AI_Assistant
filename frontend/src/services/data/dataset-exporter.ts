import { prisma } from '@/lib/prisma'
import type { DPORecord, ExportFormat } from '@/types'

export async function exportPreferenceDataset(
  filters: { limit?: number; taskType?: string; domain?: string } = {},
): Promise<DPORecord[]> {
  const logs = await prisma.preferenceLog.findMany({
    where: {
      ...(filters.taskType && { taskType: filters.taskType }),
      ...(filters.domain && { domain: filters.domain }),
    },
    take: filters.limit ?? 1000,
    include: {
      candidate: true,
      message: { include: { responseCandidates: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return logs.map(log => {
    const chosen = log.candidate?.content ?? ''
    const rejected =
      log.message?.responseCandidates.find(
        c => c.id !== log.candidateId && !c.isSelected,
      )?.content ?? ''
    return {
      prompt: log.userQuery,
      chosen,
      rejected,
      chosen_strategy: log.selectedStrategy,
      rejected_strategy: '',
      reason_tags: JSON.parse((log.selectedTags as string) || '[]'),
      task_type: log.taskType,
      domain: log.domain ?? 'general',
    }
  })
}

export async function exportEvaluationDataset(filters: { limit?: number } = {}) {
  const evals = await prisma.responseEvaluation.findMany({
    take: filters.limit ?? 1000,
    include: { message: true },
    orderBy: { createdAt: 'desc' },
  })
  return evals.map(e => ({
    messageId: e.messageId,
    input: e.message?.content ?? '',
    overallScore: e.overallScore,
    naturalness: e.naturalness,
    grammar: e.grammar,
    clarity: e.clarity,
    structure: e.structure,
    completeness: e.completeness,
    safety: e.safety,
    preferenceMatch: e.preferenceMatch,
    strengths: JSON.parse((e.strengths as string) || '[]'),
    weaknesses: JSON.parse((e.weaknesses as string) || '[]'),
  }))
}

export async function exportConversationDataset(filters: { limit?: number } = {}) {
  const conversations = await prisma.conversation.findMany({
    take: filters.limit ?? 500,
    include: { messages: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return conversations.map(conv => ({
    id: conv.id,
    mode: conv.mode,
    messages: conv.messages.map(m => ({ role: m.role, content: m.content })),
    createdAt: conv.createdAt,
  }))
}

export function toJSON(data: unknown[]): string {
  return JSON.stringify(data, null, 2)
}

export function toJSONL(data: unknown[]): string {
  return data.map(row => JSON.stringify(row)).join('\n')
}

export function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''
  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers
      .map(h => {
        const val = row[h]
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')
        return `"${str.replace(/"/g, '""')}"`
      })
      .join(','),
  )
  return [headers.join(','), ...rows].join('\n')
}

export async function recordExport(
  exportType: string,
  format: ExportFormat,
  recordCount: number,
  filters: Record<string, unknown> = {},
) {
  return prisma.datasetExport.create({
    data: {
      exportType,
      format,
      recordCount,
      filters: JSON.stringify(filters),
    } as never,
  })
}
