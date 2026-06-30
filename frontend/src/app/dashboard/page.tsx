'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, RefreshCw, TrendingUp, Brain, Activity, Globe, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatsGrid } from '@/features/dashboard/components/stats-grid'
import { StrategyChart } from '@/features/dashboard/components/strategy-chart'
import { ActivityChart } from '@/features/dashboard/components/activity-chart'
import { MemoryCard } from '@/features/dashboard/components/memory-card'
import type { DashboardStats, PreferenceMemory } from '@/types'

interface GlobalMemoryData {
  summary: string
  mostSelectedStrategies: { strategy: string; count: number }[]
  totalLogsAnalyzed: number
}

interface EvaluationDimension {
  key: string
  label: string
  value: number
}

interface EvaluationData {
  dimensions: EvaluationDimension[]
  totalEvaluations: number
  overallAvg: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [memory, setMemory] = useState<PreferenceMemory | null>(null)
  const [globalMemory, setGlobalMemory] = useState<GlobalMemoryData | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = async () => {
    const [statsRes, memRes, globalMemRes, evalRes] = await Promise.all([
      fetch('/api/analytics').then(r => r.json()).catch(() => null),
      fetch('/api/memory').then(r => r.json()).catch(() => null),
      fetch('/api/global-memory').then(r => r.json()).catch(() => null),
      fetch('/api/evaluation').then(r => r.json()).catch(() => null),
    ])
    if (statsRes) setStats(statsRes)
    if (memRes?.memory) setMemory(memRes.memory)
    if (globalMemRes?.memory) setGlobalMemory(globalMemRes.memory)
    if (evalRes?.dimensions) setEvaluation(evalRes)
  }

  useEffect(() => {
    setIsLoading(true)
    fetchData().finally(() => setIsLoading(false))
  }, [])

  const refreshMemory = async () => {
    setIsRefreshing(true)
    await fetch('/api/memory', { method: 'POST' }).catch(() => {})
    await fetchData()
    setIsRefreshing(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Compute top 3 and bottom 3 dimensions for rubric summary
  const sortedDimensions = evaluation?.dimensions
    ? [...evaluation.dimensions]
        .filter(d => d.key !== 'overallScore' && d.key !== 'hallucinationRisk')
        .sort((a, b) => b.value - a.value)
    : []
  const top3 = sortedDimensions.slice(0, 3)
  const bottom3 = sortedDimensions.slice(-3).reverse()

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
          <p className="mt-1 text-sm text-slate-500">학습 분석 및 선호도 변화</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchData}
          className="gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          새로고침
        </Button>
      </div>

      {/* Stats */}
      {stats && <StatsGrid stats={stats} />}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">선호 응답 전략</h3>
          </div>
          <StrategyChart data={stats?.topStrategies ?? []} />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">최근 14일 활동</h3>
          </div>
          <ActivityChart data={stats?.recentActivity ?? []} />
        </div>
      </div>

      {/* Memory */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">현재 선호도 메모리</h3>
        </div>
        <MemoryCard memory={memory} onRefresh={refreshMemory} isRefreshing={isRefreshing} />
      </div>

      {/* Top tags */}
      {stats && stats.topTags.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">많이 선택된 피드백 태그</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(({ tag, count }) => (
              <div
                key={tag}
                className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1"
              >
                <span className="text-xs font-medium text-indigo-700">
                  {tag.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-indigo-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Learning + Rubric Summary cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* GlobalLearningCard */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">전역 학습 현황</h3>
          </div>
          {globalMemory ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">{globalMemory.summary}</p>
              {globalMemory.mostSelectedStrategies.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">상위 전략</p>
                  <div className="space-y-2">
                    {globalMemory.mostSelectedStrategies.slice(0, 3).map(({ strategy, count }) => (
                      <div key={strategy} className="flex items-center justify-between">
                        <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                          {strategy}
                        </span>
                        <span className="text-xs text-slate-400">{count}회 선택</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-400">총 {globalMemory.totalLogsAnalyzed}개 로그 분석됨</p>
              <Link
                href="/dashboard/global-learning"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                전역 학습 분석 보기
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-400">학습 데이터가 쌓이면 전역 패턴이 분석됩니다.</p>
          )}
        </div>

        {/* RubricSummaryCard */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">응답 품질 루브릭</h3>
          </div>
          {evaluation && evaluation.totalEvaluations > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-full bg-slate-100 h-2">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${Math.round(evaluation.overallAvg * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {Math.round(evaluation.overallAvg * 100)}%
                </span>
              </div>
              <p className="text-xs text-slate-500">
                전체 평균 점수 · {evaluation.totalEvaluations}개 평가
              </p>
              {top3.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-emerald-600">상위 3개 차원</p>
                  <div className="space-y-1">
                    {top3.map(d => (
                      <div key={d.key} className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">{d.label}</span>
                        <span className="text-xs font-medium text-emerald-600">
                          {Math.round(d.value * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {bottom3.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-rose-500">하위 3개 차원</p>
                  <div className="space-y-1">
                    {bottom3.map(d => (
                      <div key={d.key} className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">{d.label}</span>
                        <span className="text-xs font-medium text-rose-500">
                          {Math.round(d.value * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Link
                href="/dashboard/rubric"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                루브릭 상세 보기
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-400">응답 평가 데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}
