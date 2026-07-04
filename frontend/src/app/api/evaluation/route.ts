import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/resolve-user'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await resolveUserId()

  // anonymous이면 빈 결과 반환
  if (userId === 'anonymous') {
    return NextResponse.json({
      dimensions: [],
      totalEvaluations: 0,
      overallAvg: 0,
    })
  }

  try {
    const agg = await prisma.responseEvaluation.aggregate({
      where: {
        message: {
          conversation: { userId },
        },
      },
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
      { key: 'naturalness', label: '자연스러움', value: agg._avg.naturalness ?? 0 },
      { key: 'grammar', label: '문법 정확도', value: agg._avg.grammar ?? 0 },
      { key: 'toneConsistency', label: '어조 일관성', value: agg._avg.toneConsistency ?? 0 },
      { key: 'personaConsistency', label: '페르소나 일관성', value: agg._avg.personaConsistency ?? 0 },
      { key: 'instructionFollowing', label: '지시 준수', value: agg._avg.instructionFollowing ?? 0 },
      { key: 'factualAccuracy', label: '사실 정확도', value: agg._avg.factualAccuracy ?? 0 },
      { key: 'hallucinationRisk', label: '환각 위험도', value: agg._avg.hallucinationRisk ?? 0 },
      { key: 'clarity', label: '명확성', value: agg._avg.clarity ?? 0 },
      { key: 'structure', label: '구조', value: agg._avg.structure ?? 0 },
      { key: 'completeness', label: '완결성', value: agg._avg.completeness ?? 0 },
      { key: 'specificity', label: '구체성', value: agg._avg.specificity ?? 0 },
      { key: 'actionability', label: '실행 가능성', value: agg._avg.actionability ?? 0 },
      { key: 'readability', label: '가독성', value: agg._avg.readability ?? 0 },
      { key: 'formatting', label: '형식', value: agg._avg.formatting ?? 0 },
      { key: 'safety', label: '안전성', value: agg._avg.safety ?? 0 },
      { key: 'preferenceMatch', label: '선호도 일치', value: agg._avg.preferenceMatch ?? 0 },
      { key: 'searchGrounding', label: '검색 근거', value: agg._avg.searchGrounding ?? 0 },
      { key: 'overallScore', label: '전체 점수', value: agg._avg.overallScore ?? 0 },
    ]

    return NextResponse.json({
      dimensions,
      totalEvaluations: agg._count.id,
      overallAvg: agg._avg.overallScore ?? 0,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
