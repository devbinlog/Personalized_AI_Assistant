'use client'

import { useEffect, useState } from 'react'
import { Sparkles, X, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
    <div className={cn(
      'flex items-start gap-3 border-b border-primary/20 bg-primary/5 px-4 py-3',
      'animate-fade-in',
    )}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-xs font-medium text-primary">Preference suggestion</p>
        <p className="text-sm text-foreground">{current.rationale}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => respond(false)}
          disabled={isSubmitting}
          className="h-7 gap-1 text-xs text-muted-foreground"
        >
          <XCircle className="h-3 w-3" />
          No thanks
        </Button>
        <Button
          size="sm"
          onClick={() => respond(true)}
          disabled={isSubmitting}
          className="h-7 gap-1 text-xs"
        >
          <CheckCircle2 className="h-3 w-3" />
          Yes, apply
        </Button>
        <button onClick={() => setCurrent(null)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
