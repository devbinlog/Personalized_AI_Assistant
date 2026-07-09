'use client'

import { useState, useEffect } from 'react'
import { Globe, RefreshCw } from 'lucide-react'
import type { GlobalPreferenceMemory } from '@/types'

export default function GlobalLearningPage() {
  const [memory, setMemory] = useState<GlobalPreferenceMemory | null>(null)
  const [loading, setLoading] = useState(true)
  const [rebuilding, setRebuilding] = useState(false)

  useEffect(() => {
    fetch('/api/global-memory')
      .then(r => r.json())
      .then(d => {
        setMemory(d.memory)
        setLoading(false)
      })
  }, [])

  async function rebuild() {
    setRebuilding(true)
    try {
      const res = await fetch('/api/global-memory', { method: 'POST' })
      const d = await res.json()
      setMemory(d.memory)
    } finally {
      setRebuilding(false)
    }
  }

  const topStrategies = memory?.mostSelectedStrategies?.slice(0, 5) ?? []
  const maxCount = topStrategies[0]?.count ?? 1

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#08090a]">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-slate-700 dark:text-slate-500" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f7f8f8]">글로벌 학습</h1>
              <p className="text-sm text-slate-500 dark:text-[#8a8f98]">전체 대화에서 집계된 선호도 패턴</p>
            </div>
          </div>
          <button
            onClick={rebuild}
            disabled={rebuilding}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/8 px-3 py-1.5 text-xs text-slate-500 dark:text-[#8a8f98] hover:bg-slate-50 dark:hover:bg-[#28282c] hover:text-slate-700 dark:hover:text-[#d0d6e0] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${rebuilding ? 'animate-spin' : ''}`} />
            {rebuilding ? '재구축 중...' : '재구축'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm text-slate-400 dark:text-[#8a8f98]">불러오는 중...</div>
        ) : !memory ? (
          <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] text-center py-16 shadow-sm">
            <Globe className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-[#8a8f98]" />
            <p className="text-sm text-slate-600 dark:text-[#d0d6e0] mb-4">아직 글로벌 메모리가 없습니다.</p>
            <button
              onClick={rebuild}
              className="rounded-lg border border-slate-200 dark:border-white/8 px-4 py-2 text-sm text-slate-600 dark:text-[#d0d6e0] hover:bg-slate-50 dark:hover:bg-[#28282c] transition-colors"
            >
              지금 구축하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-3">요약</div>
              <p className="text-sm text-slate-600 dark:text-[#d0d6e0] leading-relaxed">{memory.summary || '요약 정보가 없습니다.'}</p>
              <div className="mt-3 text-xs text-slate-400 dark:text-[#8a8f98]">
                <span className="text-2xl font-bold text-slate-900 dark:text-[#f7f8f8] mr-2">{memory.totalLogsAnalyzed}</span>
                회 분석 완료 · 업데이트: {new Date(memory.updatedAt).toLocaleString()}
              </div>
            </div>

            {/* Top strategies */}
            {topStrategies.length > 0 && (
              <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-4">
                  가장 많이 선택된 전략
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/8">
                  {topStrategies.map((item, i) => (
                    <div key={item.strategy} className="py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30 text-slate-800 dark:text-slate-400 text-xs px-2.5 py-0.5">
                          {item.strategy}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-[#8a8f98]">{item.count}x</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-[#28282c]">
                        <div
                          style={{
                            height: '100%',
                            borderRadius: '9999px',
                            backgroundColor: i === 0 ? '#1E293B' : `rgba(99,102,241,${0.8 - i * 0.12})`,
                            width: `${(item.count / maxCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Domain preferences */}
            {memory.domainPreferences.length > 0 && (
              <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-4">
                  도메인 선호도
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/8">
                  {memory.domainPreferences.map(dp => (
                    <div key={dp.domain} className="flex items-center justify-between py-3">
                      <span className="text-sm text-slate-700 dark:text-[#d0d6e0]">{dp.domain}</span>
                      <span className="rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30 text-slate-800 dark:text-slate-400 text-xs px-2.5 py-0.5">
                        {dp.strategy}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common tags */}
            {memory.commonReasonTags.length > 0 && (
              <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-4">
                  자주 사용된 선호도 태그
                </div>
                <div className="flex flex-wrap gap-2">
                  {memory.commonReasonTags.map(tag => (
                    <span
                      key={tag.tag}
                      className="rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30 text-slate-800 dark:text-slate-400 text-[11px] px-3 py-1"
                    >
                      {tag.tag} <span className="text-slate-500 dark:text-slate-600">×{tag.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* High performing patterns */}
            {memory.highPerformingPatterns.length > 0 && (
              <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-4">
                  고성능 패턴
                </div>
                <div className="flex flex-wrap gap-2">
                  {memory.highPerformingPatterns.map(p => (
                    <span key={p} className="text-xs px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
