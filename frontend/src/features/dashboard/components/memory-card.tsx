'use client'

import { Brain, RefreshCw } from 'lucide-react'
import { strategyLabel, memoryFieldLabel } from '@/lib/utils'
import type { PreferenceMemory } from '@/types'

interface MemoryCardProps {
  memory: PreferenceMemory | null
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function MemoryCard({ memory, onRefresh, isRefreshing }: MemoryCardProps) {
  if (!memory) {
    return (
      <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-slate-600 dark:text-[#d0d6e0]" />
            <span className="text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">선호도 메모리</span>
          </div>
        </div>
        <div className="flex items-center gap-3 py-2">
          <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center">
            <Brain className="h-4 w-4 text-slate-400 dark:text-[#8a8f98]" />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-[#d0d6e0]">아직 선호도 메모리가 없습니다</p>
            <p className="text-xs text-slate-400 dark:text-[#8a8f98] mt-0.5">학습 모드를 3회 이상 사용하면 첫 번째 메모리가 생성됩니다</p>
          </div>
        </div>
      </div>
    )
  }

  const strategies = Array.isArray(memory.preferredStrategies)
    ? memory.preferredStrategies
    : []

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-slate-600 dark:text-[#d0d6e0]" />
          <span className="text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">선호도 메모리</span>
          <span className="text-xs text-slate-400 dark:text-[#8a8f98] ml-1">v{memory.version}</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/8 px-2.5 py-1 text-xs text-slate-500 dark:text-[#8a8f98] hover:bg-slate-50 dark:hover:bg-[#28282c] hover:text-slate-700 dark:hover:text-[#d0d6e0] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Memory details */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: '어조', value: memory.preferredTone, type: 'tone' as const },
          { label: '길이', value: memory.preferredLength, type: 'length' as const },
          { label: '구조', value: memory.preferredStructure, type: 'structure' as const },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-100 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] p-3"
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-[#8a8f98]">
              {item.label}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-[#d0d6e0]">
              {memoryFieldLabel(item.value, item.type)}
            </p>
          </div>
        ))}
      </div>

      {/* Preferred strategies */}
      {strategies.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-[#8a8f98]">선호 전략</p>
          <div className="flex flex-wrap gap-1.5">
            {strategies.map(s => (
              <span
                key={s}
                className="rounded-full border border-slate-200 dark:border-white/8 bg-slate-100 dark:bg-[#28282c] px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-[#d0d6e0]"
              >
                {strategyLabel(s as never)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {memory.rawSummary && (
        <div className="rounded-xl border border-slate-100 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] p-3">
          <p className="text-sm text-slate-600 dark:text-[#d0d6e0] leading-relaxed">{memory.rawSummary}</p>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-[#8a8f98]">
        선호도 선택 {memory.logCount}회 기반 · 마지막 업데이트: {new Date(memory.lastUpdatedAt).toLocaleDateString('ko-KR')}
      </p>
    </div>
  )
}
