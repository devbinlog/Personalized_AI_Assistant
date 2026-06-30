'use client'

import { useState } from 'react'
import { Lightbulb, Brain, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { confidencePercent, strategyLabel } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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
        className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
      >
        <Lightbulb className="h-3 w-3" />
        {isLoading ? 'Loading explanation…' : 'Why this answer?'}
        {explanation && (isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>

      {isOpen && explanation && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white overflow-hidden animate-fade-in">
          <div className="px-4 py-3 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-900">Response Explanation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {strategyLabel(explanation.selectedStrategy)}
              </Badge>
              <Badge variant="success">
                {confidencePercent(explanation.confidence)} confidence
              </Badge>
            </div>
          </div>

          {/* Memory influence */}
          {explanation.memoryInfluence.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                How your preferences shaped this
              </p>
              <ul className="space-y-1">
                {explanation.memoryInfluence.map((item, i) => (
                  <li key={i} className="pl-3 border-l-2 border-indigo-200 text-xs text-slate-600">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reasoning factors */}
          {explanation.reasoningFactors.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Why this response was best
              </p>
              <ul className="space-y-1">
                {explanation.reasoningFactors.map((item, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ranking details */}
          {explanation.rankingDetails && explanation.rankingDetails.length > 1 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                All candidates scored
              </p>
              <div className="space-y-1">
                {explanation.rankingDetails
                  .sort((a, b) => b.score - a.score)
                  .map((detail, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-600">
                        {strategyLabel(detail.strategy)}
                      </span>
                      <div className="mx-3 flex-1 h-1.5 rounded-full overflow-hidden bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all bg-indigo-500"
                          style={{
                            width: `${detail.score * 100}%`,
                            opacity: i === 0 ? 1 : 0.35,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-900">
                        {Math.round(detail.score * 100)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <Info className="h-3 w-3" />
            Product-level reasoning only · No internal LLM chain-of-thought exposed
          </div>
          </div>
        </div>
      )}
    </div>
  )
}
