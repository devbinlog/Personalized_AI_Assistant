import { generateObject } from 'ai'
import { z } from 'zod'
import { getLLMProvider } from './provider'
import type { TaskAnalysis } from '@/types'

const TaskAnalysisSchema = z.object({
  taskType: z.enum([
    'CONVERSATION', 'KNOWLEDGE', 'PROGRAMMING', 'WRITING', 'TRANSLATION',
    'BRAINSTORMING', 'RESEARCH', 'PLANNING', 'LEARNING', 'PRODUCTIVITY',
    'SUMMARIZATION', 'CAREER', 'INTERVIEW', 'DECISION', 'SEARCH_REQUIRED', 'OTHER',
  ]),
  expectedOutput: z.string(),
  complexity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  domain: z.string(),
  needsClarification: z.boolean(),
  needsWebSearch: z.boolean(),
  preferredStyle: z.string(),
  confidence: z.number().min(0).max(1),
})

type TaskAnalysisData = z.infer<typeof TaskAnalysisSchema>

const SYSTEM_PROMPT = `You are a task classifier for an AI personal assistant.
Analyze the user message and return structured classification.
Set needsWebSearch=true for: current events, latest docs/versions, prices, live data, recent releases, news.
preferredStyle options: "concise", "structured", "detailed", "step-by-step", "conversational".`

export async function analyzeTask(
  userMessage: string,
  recentMessages: Array<{ role: string; content: string }> = [],
): Promise<TaskAnalysis> {
  try {
    const provider = getLLMProvider()
    const result = await generateObject({
      model: provider.getFastModel(),
      schema: TaskAnalysisSchema,
      system: SYSTEM_PROMPT,
      messages: [
        ...recentMessages.slice(-4).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userMessage },
      ],
    })
    return result.object as TaskAnalysisData as TaskAnalysis
  } catch {
    return {
      taskType: 'CONVERSATION',
      expectedOutput: 'Conversational response',
      complexity: 'LOW',
      domain: 'general',
      needsClarification: false,
      needsWebSearch: false,
      preferredStyle: 'conversational',
      confidence: 0.5,
    }
  }
}
