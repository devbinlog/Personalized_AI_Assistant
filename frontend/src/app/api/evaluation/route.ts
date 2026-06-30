import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const agg = await prisma.responseEvaluation.aggregate({
      _avg: {
        naturalness: true,
        grammar: true,
        toneConsistency: true,
        personaConsistency: true,
        instructionFollowing: true,
        factualAccuracy: true,
        hallucinationRisk: true,
        clarity: true,
        structure: true,
        completeness: true,
        specificity: true,
        actionability: true,
        readability: true,
        formatting: true,
        safety: true,
        preferenceMatch: true,
        searchGrounding: true,
        overallScore: true,
      },
      _count: { id: true },
    })

    const dimensions = [
      { key: 'naturalness', label: 'Naturalness', value: agg._avg.naturalness ?? 0 },
      { key: 'grammar', label: 'Grammar', value: agg._avg.grammar ?? 0 },
      { key: 'toneConsistency', label: 'Tone Consistency', value: agg._avg.toneConsistency ?? 0 },
      { key: 'personaConsistency', label: 'Persona Consistency', value: agg._avg.personaConsistency ?? 0 },
      { key: 'instructionFollowing', label: 'Instruction Following', value: agg._avg.instructionFollowing ?? 0 },
      { key: 'factualAccuracy', label: 'Factual Accuracy', value: agg._avg.factualAccuracy ?? 0 },
      { key: 'hallucinationRisk', label: 'Hallucination Risk', value: agg._avg.hallucinationRisk ?? 0 },
      { key: 'clarity', label: 'Clarity', value: agg._avg.clarity ?? 0 },
      { key: 'structure', label: 'Structure', value: agg._avg.structure ?? 0 },
      { key: 'completeness', label: 'Completeness', value: agg._avg.completeness ?? 0 },
      { key: 'specificity', label: 'Specificity', value: agg._avg.specificity ?? 0 },
      { key: 'actionability', label: 'Actionability', value: agg._avg.actionability ?? 0 },
      { key: 'readability', label: 'Readability', value: agg._avg.readability ?? 0 },
      { key: 'formatting', label: 'Formatting', value: agg._avg.formatting ?? 0 },
      { key: 'safety', label: 'Safety', value: agg._avg.safety ?? 0 },
      { key: 'preferenceMatch', label: 'Preference Match', value: agg._avg.preferenceMatch ?? 0 },
      { key: 'searchGrounding', label: 'Search Grounding', value: agg._avg.searchGrounding ?? 0 },
      { key: 'overallScore', label: 'Overall Score', value: agg._avg.overallScore ?? 0 },
    ]

    return NextResponse.json({
      dimensions,
      totalEvaluations: agg._count.id,
      overallAvg: agg._avg.overallScore ?? 0,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
