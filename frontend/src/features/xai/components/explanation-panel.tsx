'use client'

import { useState } from 'react'
import { Lightbulb, Brain, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { cn, confidencePercent, strategyLabel } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ResponseExplanation } from '@/types'

interface ExplanationPanelProps {
  messageId: string
  initialConfidence?: number | null
  initialStrategy?: string | null
}

export function ExplanationPanel({ messageId, initialConfidence, initialStrategy }: ExplanationPanelProps) {
  const [explanation, setExplanation] = useState<ResponseExplanation | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const loadExplanation = async () => {
    if (explanation) {
      setIsOpen(v => !v)
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/explanation?messageId=${messageId}`)
      const data = await res.json()
      if (data.explanation) setExplanation(data.explanation)
      setIsOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="ml-11 mt-1 mr-4">
      <button
        onClick={loadExplanation}
        disabled={isLoading}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
      >
        <Lightbulb className="h-3 w-3" />
        {isLoading ? 'Loading explanation…' : 'Why this answer?'}
        {explanation && (isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>

      {isOpen && explanation && (
        <div className="mt-2 rounded-xl border border-border bg-card/50 p-4 space-y-4 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Response Explanation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {strategyLabel(explanation.selectedStrategy)}
              </Badge>
              <Badge variant="outline" className="text-[10px] text-green-400 border-green-500/30">
                {confidencePercent(explanation.confidence)} confidence
              </Badge>
            </div>
          </div>

          {/* Memory influence */}
          {explanation.memoryInfluence.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                How your preferences shaped this
              </p>
              <ul className="space-y-1">
                {explanation.memoryInfluence.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reasoning factors */}
          {explanation.reasoningFactors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Why this response was best
              </p>
              <ul className="space-y-1">
                {explanation.reasoningFactors.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ranking details */}
          {explanation.rankingDetails && explanation.rankingDetails.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                All candidates scored
              </p>
              <div className="space-y-1">
                {explanation.rankingDetails
                  .sort((a, b) => b.score - a.score)
                  .map((detail, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-24 text-xs text-muted-foreground">
                        {strategyLabel(detail.strategy)}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', i === 0 ? 'bg-primary' : 'bg-muted-foreground/40')}
                          style={{ width: `${detail.score * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[10px] text-muted-foreground">
                        {Math.round(detail.score * 100)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <Info className="h-3 w-3" />
            Product-level reasoning only · No internal LLM chain-of-thought exposed
          </div>
        </div>
      )}
    </div>
  )
}
