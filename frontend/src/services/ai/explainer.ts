import { generateObject } from 'ai'
import { z } from 'zod'
import { getLLMProvider } from './provider'
import type { PreferenceMemory, ResponseStrategy, ResponseExplanation, ConfidenceBreakdown, Persona, ConversationFlow, GlobalPreferenceMemory } from '@/types'
import type { RankedCandidate } from './ranker'
import type { CandidateEvaluation } from './evaluator'
import { prisma } from '@/lib/prisma'

const ExplanationSchema = z.object({
  memoryInfluence: z.array(z.string()).max(5),
  reasoningFactors: z.array(z.string()).max(5),
})

type ExplanationData = z.infer<typeof ExplanationSchema>

export async function generateExplanation(
  messageId: string,
  userQuery: string,
  selectedCandidate: RankedCandidate,
  allCandidates: RankedCandidate[],
  evaluation: CandidateEvaluation | undefined,
  memory: PreferenceMemory | null,
  promptVersion: number,
  activePersona?: Persona | null,
  activeFlow?: ConversationFlow | null,
  globalMemory?: GlobalPreferenceMemory | null,
): Promise<ResponseExplanation> {
  const confidence = computeConfidence(selectedCandidate, evaluation, memory)

  let memoryInfluence: string[] = []
  let reasoningFactors: string[] = []

  try {
    const provider = getLLMProvider()
    const memoryContext = memory
      ? `Preference memory (v${memory.version}): tone=${memory.preferredTone}, structure=${memory.preferredStructure}, preferred=${(Array.isArray(memory.preferredStrategies) ? memory.preferredStrategies : JSON.parse(memory.preferredStrategies || '[]')).join(', ')}`
      : 'No preference memory yet'

    const result = await generateObject({
      model: provider.getFastModel(),
      schema: ExplanationSchema,
      system: `당신은 AI 어시스턴트가 왜 특정 응답을 선택했는지 설명하는 시스템입니다.
반드시 한국어로 작성하세요. 영어를 사용하지 마세요.
내부 추론 과정이나 체인-오브-쏘트는 노출하지 마세요.
AI 시스템 관점에서 개인화 결정을 간결하고 이해하기 쉬운 한 문장으로 설명하세요.`,
      prompt: `선택된 전략: ${selectedCandidate.strategy}
사용자 질문: "${userQuery}"
${memoryContext}
선택 점수: ${selectedCandidate.score.toFixed(2)}

memoryInfluence(선호도 메모리가 이 선택에 미친 영향)와 reasoningFactors(이 응답이 이 질문에 적합한 이유)를 한국어로 생성하세요.`,
    })

    const data = result.object as ExplanationData
    memoryInfluence = data.memoryInfluence
    reasoningFactors = data.reasoningFactors
  } catch {
    memoryInfluence = memory
      ? [`선호도 메모리 v${memory.version}가 전략 선택에 영향을 미쳤습니다`]
      : ['아직 선호도 데이터가 없습니다']
    reasoningFactors = [
      `${selectedCandidate.strategy} 전략이 이 질문 유형에서 가장 높은 점수를 받았습니다`,
      ...selectedCandidate.rankDetails.reasons,
    ]
  }

  // Append persona/flow/global memory influence
  if (activePersona) {
    memoryInfluence.unshift(
      `'${activePersona.name}' persona guided the ${activePersona.tone} tone and ${activePersona.speakingStyle} style`,
    )
  }
  if (activeFlow) {
    reasoningFactors.push(`'${activeFlow.name}' conversation flow shaped the response structure`)
  }
  if (globalMemory?.mostSelectedStrategies?.[0]) {
    reasoningFactors.push(
      `Global patterns: ${globalMemory.mostSelectedStrategies[0].strategy} is the most effective strategy across all users`,
    )
  }

  const explanation: Omit<ResponseExplanation, 'id' | 'createdAt'> = {
    messageId,
    selectedStrategy: selectedCandidate.strategy,
    confidence: confidence.overall,
    memoryInfluence,
    reasoningFactors,
    memorySnapshot: memory,
    rankingDetails: allCandidates.map(c => ({
      strategy: c.strategy,
      score: c.score,
      reasons: c.rankDetails.reasons,
    })),
    promptVersion,
  }

  try {
    const saved = await prisma.responseExplanation.create({
      data: {
        messageId,
        selectedStrategy: explanation.selectedStrategy,
        confidence: explanation.confidence,
        memoryInfluence: JSON.stringify(explanation.memoryInfluence),
        reasoningFactors: JSON.stringify(explanation.reasoningFactors),
        memorySnapshot: JSON.stringify(memory ?? {}) as never,
        rankingDetails: JSON.stringify(explanation.rankingDetails ?? []) as never,
        promptVersion: explanation.promptVersion,
      },
    })
    return { ...explanation, id: saved.id, createdAt: saved.createdAt }
  } catch {
    return { ...explanation, id: 'temp', createdAt: new Date() }
  }
}

function computeConfidence(
  selected: RankedCandidate,
  evaluation: CandidateEvaluation | undefined,
  memory: PreferenceMemory | null,
): ConfidenceBreakdown {
  const preferenceMatch = evaluation?.preferenceMatch ?? 0.5
  const promptMatch = memory ? 0.8 : 0.5
  const taskMatch = evaluation?.taskMatch ?? 0.7
  const searchConfidence = 0.8
  const recentSimilarity = memory ? Math.min(1, (memory.logCount ?? 0) / 20) : 0

  const overall =
    preferenceMatch * 0.3 +
    promptMatch * 0.2 +
    taskMatch * 0.25 +
    searchConfidence * 0.1 +
    recentSimilarity * 0.15

  return { preferenceMatch, promptMatch, taskMatch, searchConfidence, recentSimilarity, overall }
}
