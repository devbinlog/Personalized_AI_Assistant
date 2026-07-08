'use client'

import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'

interface DimensionScore {
  key: string
  label: string
  value: number
}

export default function RubricPage() {
  const [dimensions, setDimensions] = useState<DimensionScore[]>([])
  const [totalEvaluations, setTotalEvaluations] = useState(0)
  const [overallAvg, setOverallAvg] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/evaluation')
      .then(r => r.json())
      .then(d => {
        setDimensions(d.dimensions || [])
        setTotalEvaluations(d.totalEvaluations || 0)
        setOverallAvg(d.overallAvg || 0)
        setLoading(false)
      })
  }, [])

  const sorted = [...dimensions].sort((a, b) => b.value - a.value)
  const strongest = sorted.slice(0, 3)
  const weakest = [...sorted].reverse().slice(0, 3)
  const displayDims = dimensions.filter(d => d.key !== 'overallScore')

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#08090a]">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f7f8f8]">루브릭 분석</h1>
            <p className="text-sm text-slate-500 dark:text-[#8a8f98]">18차원 응답 품질 상세 분석</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm text-slate-400 dark:text-[#8a8f98]">불러오는 중...</div>
        ) : totalEvaluations === 0 ? (
          <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] text-center py-16 shadow-sm">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-[#8a8f98]" />
            <p className="text-sm text-slate-600 dark:text-[#d0d6e0]">아직 평가 데이터가 없습니다.</p>
            <p className="text-xs text-slate-400 dark:text-[#8a8f98] mt-1.5">일반 모드에서 AI 응답을 생성하면 자동으로 평가됩니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-5 text-center shadow-sm">
                <div className="text-2xl font-bold text-slate-900 dark:text-[#f7f8f8]">{totalEvaluations}</div>
                <div className="text-xs text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mt-1">평가 횟수</div>
              </div>
              <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-5 text-center shadow-sm">
                <div className="text-2xl font-bold text-slate-900 dark:text-[#f7f8f8]">{(overallAvg * 100).toFixed(0)}%</div>
                <div className="text-xs text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mt-1">전체 점수</div>
              </div>
              <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-5 text-center shadow-sm">
                <div className="text-2xl font-bold text-slate-900 dark:text-[#f7f8f8]">18</div>
                <div className="text-xs text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mt-1">평가 차원</div>
              </div>
            </div>

            {/* Strongest & weakest */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-3">강점</div>
                <div className="divide-y divide-slate-100 dark:divide-white/8">
                  {strongest.filter(d => d.key !== 'overallScore').map(d => (
                    <div key={d.key} className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-700 dark:text-[#d0d6e0]">{d.label}</span>
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5">
                        {(d.value * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-3">개선 필요</div>
                <div className="divide-y divide-slate-100 dark:divide-white/8">
                  {weakest.filter(d => d.key !== 'overallScore').map(d => (
                    <div key={d.key} className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-700 dark:text-[#d0d6e0]">{d.label}</span>
                      <span className="rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 text-xs px-2 py-0.5">
                        {(d.value * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Full dimension grid */}
            <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-5">
                전체 차원
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/8">
                {displayDims.map(dim => (
                  <div key={dim.key} className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-700 dark:text-[#d0d6e0]">{dim.label}</span>
                      <span className="font-bold text-slate-900 dark:text-[#f7f8f8] text-sm">
                        {(dim.value * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-[#28282c]">
                      <div
                        style={{
                          height: '100%',
                          borderRadius: '9999px',
                          backgroundColor: '#6366f1',
                          width: `${dim.value * 100}%`,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
