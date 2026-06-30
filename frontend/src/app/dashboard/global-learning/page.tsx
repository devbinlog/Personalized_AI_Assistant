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
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Global Learning</h1>
              <p className="text-sm text-slate-500">Aggregated preference patterns across all interactions</p>
            </div>
          </div>
          <button
            onClick={rebuild}
            disabled={rebuilding}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${rebuilding ? 'animate-spin' : ''}`} />
            {rebuilding ? 'Rebuilding...' : 'Rebuild'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm text-slate-400">Loading...</div>
        ) : !memory ? (
          <div className="rounded-2xl border border-slate-100 bg-white text-center py-16 shadow-sm">
            <Globe className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-600 mb-4">No global memory yet.</p>
            <button
              onClick={rebuild}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Build Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Summary</div>
              <p className="text-sm text-slate-600 leading-relaxed">{memory.summary || 'No summary available.'}</p>
              <div className="mt-3 text-xs text-slate-400">
                <span className="text-2xl font-bold text-slate-900 mr-2">{memory.totalLogsAnalyzed}</span>
                interactions analyzed · Updated {new Date(memory.updatedAt).toLocaleString()}
              </div>
            </div>

            {/* Top strategies */}
            {topStrategies.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Most Selected Strategies
                </div>
                <div className="divide-y divide-slate-100">
                  {topStrategies.map((item, i) => (
                    <div key={item.strategy} className="py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-full border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5">
                          {item.strategy}
                        </span>
                        <span className="text-xs text-slate-400">{item.count}x</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div
                          style={{
                            height: '100%',
                            borderRadius: '9999px',
                            backgroundColor: i === 0 ? '#6366f1' : `rgba(99,102,241,${0.8 - i * 0.12})`,
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
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Domain Preferences
                </div>
                <div className="divide-y divide-slate-100">
                  {memory.domainPreferences.map(dp => (
                    <div key={dp.domain} className="flex items-center justify-between py-3">
                      <span className="text-sm text-slate-700">{dp.domain}</span>
                      <span className="rounded-full border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5">
                        {dp.strategy}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common tags */}
            {memory.commonReasonTags.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Common Preference Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {memory.commonReasonTags.map(tag => (
                    <span
                      key={tag.tag}
                      className="rounded-full border border-indigo-100 bg-indigo-50 text-indigo-700 text-[11px] px-3 py-1"
                    >
                      {tag.tag} <span className="text-indigo-400">×{tag.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* High performing patterns */}
            {memory.highPerformingPatterns.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  High Performing Patterns
                </div>
                <div className="flex flex-wrap gap-2">
                  {memory.highPerformingPatterns.map(p => (
                    <span key={p} className="text-xs px-3 py-1 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700">
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
