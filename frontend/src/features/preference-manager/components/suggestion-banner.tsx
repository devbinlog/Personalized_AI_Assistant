'use client'

import { useEffect, useState } from 'react'
import { Sparkles, X, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div
      className="flex items-start gap-3 animate-fade-in"
      style={{
        backgroundColor: 'rgba(113,112,255,0.06)',
        borderBottom: '1px solid rgba(113,112,255,0.2)',
        padding: '10px 16px',
      }}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: 'rgba(113,112,255,0.1)' }}
      >
        <Sparkles className="h-3.5 w-3.5" style={{ color: '#7170ff' }} />
      </div>
      <div className="flex-1 space-y-0.5">
        <p style={{ fontSize: '11px', fontWeight: 500, color: '#7170ff' }}>Preference suggestion</p>
        <p style={{ fontSize: '12px', color: '#d0d6e0' }}>{current.rationale}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => respond(false)}
          disabled={isSubmitting}
          className="h-6 gap-1 text-xs"
        >
          <XCircle className="h-3 w-3" />
          No thanks
        </Button>
        <Button
          size="sm"
          onClick={() => respond(true)}
          disabled={isSubmitting}
          className="h-6 gap-1 text-xs"
        >
          <CheckCircle2 className="h-3 w-3" />
          Yes, apply
        </Button>
        <button
          onClick={() => setCurrent(null)}
          style={{ color: '#62666d' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#8a8f98')}
          onMouseLeave={e => (e.currentTarget.style.color = '#62666d')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
