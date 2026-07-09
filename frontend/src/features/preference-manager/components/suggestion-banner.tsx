'use client'

import { useEffect, useState } from 'react'
import { Sparkles, X, CheckCircle2, XCircle } from 'lucide-react'
import type { PreferenceSuggestion } from '@/types'

export function SuggestionBanner() {
  const [suggestions, setSuggestions] = useState<PreferenceSuggestion[]>([])
  const [current, setCurrent] = useState<PreferenceSuggestion | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/suggestions')
      .then(r => r.json())
      .then(data => {
        const pending = data.suggestions ?? []
        setSuggestions(pending)
        if (pending.length > 0) setCurrent(pending[0])
      })
      .catch(() => {})
  }, [])

  const respond = async (accepted: boolean) => {
    if (!current) return
    setIsSubmitting(true)
    try {
      await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId: current.id, accepted }),
      })
      const remaining = suggestions.filter(s => s.id !== current.id)
      setSuggestions(remaining)
      setCurrent(remaining[0] ?? null)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!current) return null

  return (
    <div className="border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 animate-fade-in">
      <div className="mx-auto max-w-3xl flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-slate-600 dark:text-slate-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-300">선호도 업데이트 제안</p>
          <p className="text-xs text-slate-700 dark:text-slate-500 mt-0.5">{current.rationale}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => respond(false)}
            disabled={isSubmitting}
            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-3 w-3" />
            괜찮아요
          </button>
          <button
            onClick={() => respond(true)}
            disabled={isSubmitting}
            className="flex items-center gap-1 rounded-lg bg-slate-700 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="h-3 w-3" />
            적용하기
          </button>
          <button
            onClick={() => setCurrent(null)}
            className="text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
