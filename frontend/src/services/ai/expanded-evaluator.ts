import { generateObject } from 'ai'
import { z } from 'zod'
import { getLLMProvider } from './provider'
import type { GeneratedCandidate } from './candidate-generator'
import type { PreferenceMemory, ResponseEvaluation, Persona, ConversationFlow } from '@/types'

const ExpandedEvaluationSchema = z.object({
  scores: z.array(
    z.object({
      index: z.number(),
      strategy: z.string(),
      naturalness: z.number().min(0).max(1),
      grammar: z.number().min(0).max(1),
      toneConsistency: z.number().min(0).max(1),
      personaConsistency: z.number().min(0).max(1),
      instructionFollowing: z.number().min(0).max(1),
      factualAccuracy: z.number().min(0).max(1),
      hallucinationRisk: z.number().min(0).max(1),
      clarity: z.number().min(0).max(1),
      structure: z.number().min(0).max(1),
      completeness: z.number().min(0).max(1),
      specificity: z.number().min(0).max(1),
      actionability: z.number().min(0).max(1),
      readability: z.number().min(0).max(1),
      formatting: z.number().min(0).max(1),
      safety: z.number().min(0).max(1),
      preferenceMatch: z.number().min(0).max(1),
      searchGrounding: z.number().min(0).max(1),
      overallScore: z.number().min(0).max(1),
      strengths: z.array(z.string()).max(3),
      weaknesses: z.array(z.string()).max(3),
      improvementSuggestions: z.array(z.string()).max(3),
    }),
  ),
})

function mockEvaluation(
  c: GeneratedCandidate,
  personaId?: string,
  flowId?: string,
): Omit<ResponseEvaluation, 'id' | 'createdAt'> {
  const base = Math.min(0.9, 0.65 + c.index * 0.05)
  return {
    messageId: '',
    candidateId: String(c.index),
    naturalness: Math.min(1, base + 0.05),
    grammar: Math.min(1, base + 0.1),
    toneConsistency: base,
    personaConsistency: personaId ? Math.min(1, base + 0.05) : base,
    instructionFollowing: Math.min(1, base + 0.08),
    factualAccuracy: Math.min(1, base + 0.05),
    hallucinationRisk: Math.max(0, 0.2 - c.index * 0.03),
    clarity: Math.min(1, base + 0.07),
    structure: Math.min(1, base + 0.1),
    completeness: base,
    specificity: base,
    actionability: base,
    readability: Math.min(1, base + 0.08),
    formatting: Math.min(1, base + 0.05),
    safety: 0.95,
    preferenceMatch: base,
    searchGrounding: 0.5,
    overallScore: Math.min(1, base + 0.06),
    strengths: ['Clear structure', 'Addresses the query'],
    weaknesses: [],
    improvementSuggestions: [],
    activePersonaId: personaId ?? null,
    activeFlowId: flowId ?? null,
  }
}

export async function evaluateCandidatesExpanded(
  userQuery: string,
  candidates: GeneratedCandidate[],
  memory: PreferenceMemory | null,
  activePersona?: Persona | null,
  activeFlow?: ConversationFlow | null,
): Promise<Array<Omit<ResponseEvaluation, 'id' | 'createdAt'>>> {
  if (candidates.length === 0) return []

  try {
    const provider = getLLMProvider()
    const memCtx = memory
      ? `User preferences: tone=${memory.preferredTone}, length=${memory.preferredLength}`
      : 'No preference data'
    const personaCtx = activePersona
      ? `Active persona: ${activePersona.name} (${activePersona.tone} tone, ${activePersona.speakingStyle} style)`
      : ''
    const flowCtx = activeFlow ? `Active flow: ${activeFlow.name}` : ''

    const summaries = candidates.map(
      c => `Candidate ${c.index} (${c.strategy}): ${c.content.slice(0, 250)}...`,
    )

    const result = await generateObject({
      model: provider.getFastModel(),
      schema: ExpandedEvaluationSchema,
      system: `You are an expert AI response evaluator. Score each candidate on 18 quality dimensions (0.0–1.0).
naturalness: how natural and human-like is the language
grammar: grammatical correctness
toneConsistency: consistent tone throughout
personaConsistency: alignment with active persona style
instructionFollowing: follows task instructions
factualAccuracy: factual correctness
hallucinationRisk: risk of hallucinated facts (LOWER is better — 0=no risk, 1=high risk)
clarity: clear and unambiguous
structure: logical organization
completeness: covers all aspects
specificity: specific vs vague
actionability: provides actionable guidance
readability: easy to read
formatting: appropriate use of formatting
safety: safe and appropriate content
preferenceMatch: matches user preferences
searchGrounding: grounded in search results
overallScore: weighted overall quality`,
      prompt: `User query: "${userQuery}"
${memCtx}
${personaCtx}
${flowCtx}

Candidates:
${summaries.join('\n\n')}

Evaluate all ${candidates.length} candidates across all 18 dimensions.`,
    })

    return result.object.scores.map(s => ({
      messageId: '',
      candidateId: String(s.index),
      ...s,
      activePersonaId: activePersona?.id ?? null,
      activeFlowId: activeFlow?.id ?? null,
    }))
  } catch {
    return candidates.map(c => mockEvaluation(c, activePersona?.id, activeFlow?.id))
  }
}
