'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, RefreshCw, TrendingUp, Brain, Activity, Globe, BarChart2, MessageSquare } from 'lucide-react'
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

function EmptyStateCTA({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <MessageSquare className="h-8 w-8 text-stone-300" />
      <p className="text-sm text-slate-400">{message}</p>
      <Link
        href="/"
        className="rounded-xl bg-slate-700 px-4 py-2 text-xs font-medium text-white hover:bg-slate-600 transition-colors"
      >
        대화 시작하기
      </Link>
    </div>
  )
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
      <div className="flex h-[calc(100vh-56px)] items-center justify-center dark:bg-[#08090a]">
        <RefreshCw className="h-5 w-5 animate-spin text-slate-700 dark:text-[#d0d6e0]" />
      </div>
    )
  }

  const hasNoData = !stats || (stats.totalConversations === 0 && stats.totalMessages === 0)

  // Compute top 3 and bottom 3 dimensions for rubric summary
  const sortedDimensions = evaluation?.dimensions
    ? [...evaluation.dimensions]
        .filter(d => d.key !== 'overallScore' && d.key !== 'hallucinationRisk')
        .sort((a, b) => b.value - a.value)
    : []
  const top3 = sortedDimensions.slice(0, 3)
  const bottom3 = sortedDimensions.slice(-3).reverse()

  if (hasNoData) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8 dark:bg-[#08090a] min-h-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f7f8f8]">대시보드</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-[#8a8f98]">학습 분석 및 선호도 변화</p>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-stone-200 dark:border-white/8 bg-stone-50 dark:bg-[#191a1b] p-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <LayoutDashboard className="h-12 w-12 text-stone-300 dark:text-[#8a8f98]" />
            <div>
              <p className="text-base font-medium text-slate-700 dark:text-[#d0d6e0]">아직 분석할 데이터가 없어요</p>
              <p className="mt-1 text-sm text-slate-400 dark:text-[#8a8f98]">
                AI와 대화를 나누면 여기에 학습 통계와 선호도 분석이 표시됩니다.
              </p>
            </div>
            <Link
              href="/"
              className="mt-2 rounded-xl bg-slate-700 dark:bg-[#5e6ad2] px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-600 dark:hover:bg-[#6b77e0] transition-colors"
            >
              먼저 대화해보세요
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8 min-h-full dark:bg-[#08090a]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f7f8f8]">대시보드</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#8a8f98]">학습 분석 및 선호도 변화</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchData}
          className="gap-2 dark:border-white/10 dark:text-[#d0d6e0] dark:hover:bg-[#28282c]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          새로고침
        </Button>
      </div>

      {/* Stats */}
      {stats && <StatsGrid stats={stats} />}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-700 dark:text-[#d0d6e0]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">선호 응답 전략</h3>
          </div>
          {(stats?.topStrategies ?? []).length > 0 ? (
            <StrategyChart data={stats?.topStrategies ?? []} />
          ) : (
            <EmptyStateCTA message="학습 모드로 대화하면 전략 통계가 쌓입니다." />
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-700 dark:text-[#d0d6e0]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">최근 14일 활동</h3>
          </div>
          {(stats?.recentActivity ?? []).some(d => d.conversations > 0 || d.preferences > 0) ? (
            <ActivityChart data={stats?.recentActivity ?? []} />
          ) : (
            <EmptyStateCTA message="대화를 시작하면 활동 그래프가 표시됩니다." />
          )}
        </div>
      </div>

      {/* Memory */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-slate-700 dark:text-[#d0d6e0]" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">현재 선호도 메모리</h3>
        </div>
        <MemoryCard memory={memory} onRefresh={refreshMemory} isRefreshing={isRefreshing} />
      </div>

      {/* Top tags */}
      {stats && stats.topTags.length > 0 && (
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">많이 선택된 피드백 태그</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(({ tag, count }) => (
              <div
                key={tag}
                className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/8 bg-slate-100 dark:bg-[#28282c] px-3 py-1"
              >
                <span className="text-xs font-medium text-slate-800 dark:text-[#d0d6e0]">
                  {tag.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-500 dark:text-[#8a8f98]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Learning + Rubric Summary cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* GlobalLearningCard */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-700 dark:text-[#d0d6e0]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">전역 학습 현황</h3>
          </div>
          {globalMemory ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-[#d0d6e0] leading-relaxed">{globalMemory.summary}</p>
              {globalMemory.mostSelectedStrategies.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500 dark:text-[#8a8f98]">상위 전략</p>
                  <div className="space-y-2">
                    {globalMemory.mostSelectedStrategies.slice(0, 3).map(({ strategy, count }) => (
                      <div key={strategy} className="flex items-center justify-between">
                        <span className="rounded-full border border-slate-200 dark:border-white/8 bg-slate-100 dark:bg-[#28282c] px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:text-[#d0d6e0]">
                          {strategy}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-[#8a8f98]">{count}회 선택</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-400 dark:text-[#8a8f98]">총 {globalMemory.totalLogsAnalyzed}개 로그 분석됨</p>
              <Link
                href="/dashboard/global-learning"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-[#d0d6e0] hover:text-slate-800 dark:hover:text-[#f7f8f8] transition-colors"
              >
                전역 학습 분석 보기
              </Link>
            </div>
          ) : (
            <EmptyStateCTA message="학습 데이터가 쌓이면 전역 패턴이 분석됩니다." />
          )}
        </div>

        {/* RubricSummaryCard */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-slate-700 dark:text-[#d0d6e0]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">응답 품질 루브릭</h3>
          </div>
          {evaluation && evaluation.totalEvaluations > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-full bg-slate-100 dark:bg-[#28282c] h-2">
                  <div
                    className="h-2 rounded-full bg-slate-600 dark:bg-[#5e6ad2]"
                    style={{ width: `${Math.round(evaluation.overallAvg * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-[#f7f8f8]">
                  {Math.round(evaluation.overallAvg * 100)}%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#8a8f98]">
                전체 평균 점수 · {evaluation.totalEvaluations}개 평가
              </p>
              {top3.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">상위 3개 차원</p>
                  <div className="space-y-1">
                    {top3.map(d => (
                      <div key={d.key} className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 dark:text-[#d0d6e0]">{d.label}</span>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {Math.round(d.value * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {bottom3.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">하위 3개 차원</p>
                  <div className="space-y-1">
                    {bottom3.map(d => (
                      <div key={d.key} className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 dark:text-[#d0d6e0]">{d.label}</span>
                        <span className="text-xs font-medium text-rose-500 dark:text-rose-400">
                          {Math.round(d.value * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Link
                href="/dashboard/rubric"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-[#d0d6e0] hover:text-slate-800 dark:hover:text-[#f7f8f8] transition-colors"
              >
                루브릭 상세 보기
              </Link>
            </div>
          ) : (
            <EmptyStateCTA message="대화가 쌓이면 응답 품질 평가가 표시됩니다." />
          )}
        </div>
      </div>
    </div>
  )
}
