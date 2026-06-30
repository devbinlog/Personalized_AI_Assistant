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
    <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-3 animate-fade-in">
      <div className="mx-auto max-w-3xl flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-indigo-900">Preference suggestion</p>
          <p className="text-xs text-indigo-600 mt-0.5">{current.rationale}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => respond(false)}
            disabled={isSubmitting}
            className="flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-3 w-3" />
            No thanks
          </button>
          <button
            onClick={() => respond(true)}
            disabled={isSubmitting}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="h-3 w-3" />
            Yes, apply
          </button>
          <button
            onClick={() => setCurrent(null)}
            className="text-indigo-400 hover:text-indigo-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
