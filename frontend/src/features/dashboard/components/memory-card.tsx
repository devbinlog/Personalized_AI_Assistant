'use client'

import { Brain, RefreshCw } from 'lucide-react'
import { strategyLabel } from '@/lib/utils'
import type { PreferenceMemory } from '@/types'

interface MemoryCardProps {
  memory: PreferenceMemory | null
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function MemoryCard({ memory, onRefresh, isRefreshing }: MemoryCardProps) {
  if (!memory) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
        <Brain className="h-8 w-8 text-slate-300" />
        <div>
          <p className="text-sm font-semibold text-slate-900">아직 선호도 메모리가 없습니다</p>
          <p className="text-xs text-slate-400">학습 모드를 3회 이상 사용하면 첫 번째 메모리가 생성됩니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-semibold text-slate-900">선호도 메모리</span>
          <span className="text-xs text-slate-400 ml-1">v{memory.version}</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Memory details */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: '어조', value: memory.preferredTone },
          { label: '길이', value: memory.preferredLength },
          { label: '구조', value: memory.preferredStructure },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-100 p-3"
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 capitalize text-sm text-slate-600">
              {item.value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Preferred strategies */}
      {memory.preferredStrategies.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">선호 전략</p>
          <div className="flex flex-wrap gap-1.5">
            {memory.preferredStrategies.map(s => (
              <span
                key={s}
                className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800"
              >
                {strategyLabel(s as never)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {memory.rawSummary && (
        <div className="rounded-xl border border-slate-100 p-3">
          <p className="text-sm text-slate-600 leading-relaxed">{memory.rawSummary}</p>
        </div>
      )}

      <p className="text-xs text-slate-400">
        선호도 선택 {memory.logCount}회 기반 · 마지막 업데이트: {new Date(memory.lastUpdatedAt).toLocaleDateString('ko-KR')}
      </p>
    </div>
  )
}
