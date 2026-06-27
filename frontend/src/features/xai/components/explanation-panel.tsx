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
        className="flex items-center gap-1.5 transition-colors"
        style={{ fontSize: '11px', color: '#62666d' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#7170ff')}
        onMouseLeave={e => (e.currentTarget.style.color = '#62666d')}
      >
        <Lightbulb className="h-3 w-3" />
        {isLoading ? 'Loading explanation…' : 'Why this answer?'}
        {explanation && (isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>

      {isOpen && explanation && (
        <div
          className="mt-2 rounded-xl p-4 space-y-4 animate-fade-in"
          style={{ backgroundColor: '#191a1b', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" style={{ color: '#7170ff' }} />
              <span className="text-sm font-medium" style={{ color: '#f7f8f8' }}>Response Explanation</span>
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
              <p
                style={{
                  fontSize: '10px',
                  color: '#62666d',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                How your preferences shaped this
              </p>
              <ul className="space-y-1">
                {explanation.memoryInfluence.map((item, i) => (
                  <li key={i} className="flex items-start gap-2" style={{ fontSize: '12px', color: '#d0d6e0' }}>
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: '#7170ff' }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reasoning factors */}
          {explanation.reasoningFactors.length > 0 && (
            <div className="space-y-2">
              <p
                style={{
                  fontSize: '10px',
                  color: '#62666d',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Why this response was best
              </p>
              <ul className="space-y-1">
                {explanation.reasoningFactors.map((item, i) => (
                  <li key={i} className="flex items-start gap-2" style={{ fontSize: '12px', color: '#d0d6e0' }}>
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: '#7170ff' }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ranking details */}
          {explanation.rankingDetails && explanation.rankingDetails.length > 1 && (
            <div className="space-y-2">
              <p
                style={{
                  fontSize: '10px',
                  color: '#62666d',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                All candidates scored
              </p>
              <div className="space-y-1">
                {explanation.rankingDetails
                  .sort((a, b) => b.score - a.score)
                  .map((detail, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-24" style={{ fontSize: '12px', color: '#8a8f98' }}>
                        {strategyLabel(detail.strategy)}
                      </span>
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${detail.score * 100}%`,
                            backgroundColor: i === 0 ? '#7170ff' : 'rgba(255,255,255,0.1)',
                          }}
                        />
                      </div>
                      <span
                        className="w-8 text-right"
                        style={{ fontSize: '10px', color: '#8a8f98' }}
                      >
                        {Math.round(detail.score * 100)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5" style={{ fontSize: '10px', color: 'rgba(98,102,109,0.7)' }}>
            <Info className="h-3 w-3" />
            Product-level reasoning only · No internal LLM chain-of-thought exposed
          </div>
        </div>
      )}
    </div>
  )
}
