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
    <div className="px-4 py-3">
      <p className="mb-3 text-xs font-medium text-slate-500">
        Choose a response style
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {candidates.map((candidate) => {
          const isSelected = selectedIndex === candidate.index
          const isExpanded = expandedIndex === candidate.index

          return (
            <div
              key={candidate.index}
              className={cn(
                'rounded-xl border bg-white p-4 cursor-pointer transition-all hover:border-indigo-300 hover:shadow-sm overflow-hidden',
                isSelected
                  ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                  : 'border-slate-200',
              )}
            >
              {/* Card header */}
              <div
                className="flex items-center gap-2"
                onClick={() => setExpandedIndex(isExpanded ? null : candidate.index)}
              >
                <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {strategyLabel(candidate.strategy)}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Preview / expanded content */}
              {isExpanded ? (
                <div className="mt-3 max-h-[300px] overflow-y-auto text-sm text-slate-700 leading-relaxed prose-chat">
                  <ReactMarkdown>{candidate.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-700 leading-relaxed line-clamp-4">
                  {candidate.content}
                </p>
              )}

              <button
                onClick={() => {
                  setSelectedIndex(candidate.index)
                  onSelect(candidate)
                }}
                disabled={isSubmitting}
                className={cn(
                  'mt-4 w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors',
                  isSubmitting && 'opacity-50 cursor-not-allowed',
                )}
              >
                {isSelected ? 'Selected' : 'Select'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
