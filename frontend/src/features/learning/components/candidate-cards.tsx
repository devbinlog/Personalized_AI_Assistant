'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn, strategyLabel } from '@/lib/utils'
import type { ResponseStrategy } from '@/types'

interface Candidate {
  strategy: ResponseStrategy
  content: string
  index: number
}

interface CandidateCardsProps {
  candidates: Candidate[]
  onSelect: (candidate: Candidate) => void
  isSubmitting?: boolean
}

export function CandidateCards({ candidates, onSelect, isSubmitting }: CandidateCardsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  return (
    <div className="px-4 py-2 space-y-3">
      <p
        style={{
          fontSize: '12px',
          color: '#8a8f98',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '12px',
        }}
      >
        Choose a response style
      </p>

      <div className="space-y-3">
        {candidates.map((candidate) => {
          const isSelected = selectedIndex === candidate.index
          const isExpanded = expandedIndex === candidate.index

          return (
            <div
              key={candidate.index}
              className={cn(
                'rounded-xl transition-all duration-200 overflow-hidden cursor-pointer',
                isSelected && 'candidate-card-selected',
              )}
              style={{
                border: isSelected
                  ? '1px solid rgba(113,112,255,0.4)'
                  : '1px solid rgba(255,255,255,0.08)',
                backgroundColor: isSelected
                  ? 'rgba(113,112,255,0.06)'
                  : 'rgba(255,255,255,0.02)',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)'
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'
                }
              }}
            >
              {/* Card header */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                onClick={() => setExpandedIndex(isExpanded ? null : candidate.index)}
              >
                <span
                  style={{
                    backgroundColor: 'rgba(94,106,210,0.1)',
                    color: '#7170ff',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {strategyLabel(candidate.strategy)}
                </span>
                <p
                  className="flex-1 truncate"
                  style={{ fontSize: '13px', color: '#8a8f98' }}
                >
                  {candidate.content.slice(0, 80)}…
                </p>
                <div className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="h-4 w-4" style={{ color: '#7170ff' }} />}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" style={{ color: '#62666d' }} />
                  ) : (
                    <ChevronDown className="h-4 w-4" style={{ color: '#62666d' }} />
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  className="px-4 pb-4 pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="prose-chat max-h-[300px] overflow-y-auto" style={{ fontSize: '13px', color: '#8a8f98', lineClamp: '3' }}>
                    <ReactMarkdown>{candidate.content}</ReactMarkdown>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedIndex(candidate.index)
                        onSelect(candidate)
                      }}
                      disabled={isSubmitting}
                      style={{
                        backgroundColor: '#5e6ad2',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 500,
                        padding: '4px 12px',
                        borderRadius: '6px',
                        opacity: isSubmitting ? 0.5 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
