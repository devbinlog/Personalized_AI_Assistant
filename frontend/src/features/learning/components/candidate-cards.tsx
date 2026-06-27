'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn, strategyLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { STRATEGY_COLORS } from '@/lib/constants'
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
    <div className="mx-4 space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Choose your preferred response</p>
          <p className="text-xs text-muted-foreground">
            3 different styles generated · Your choice trains the AI
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">Learning Mode</Badge>
      </div>

      <div className="space-y-2">
        {candidates.map((candidate) => {
          const isSelected = selectedIndex === candidate.index
          const isExpanded = expandedIndex === candidate.index
          const colorClass = STRATEGY_COLORS[candidate.strategy] ?? ''

          return (
            <div
              key={candidate.index}
              className={cn(
                'rounded-xl border bg-card transition-all duration-200 overflow-hidden',
                isSelected ? 'candidate-card-selected border-primary' : 'border-border hover:border-primary/40',
              )}
            >
              {/* Card header */}
              <div
                className="flex cursor-pointer items-center gap-3 px-4 py-3"
                onClick={() => setExpandedIndex(isExpanded ? null : candidate.index)}
              >
                <div className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', colorClass)}>
                  {strategyLabel(candidate.strategy)}
                </div>
                <p className="flex-1 truncate text-xs text-muted-foreground">
                  {candidate.content.slice(0, 80)}…
                </p>
                <div className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <div className="prose-chat max-h-[300px] overflow-y-auto text-sm">
                    <ReactMarkdown>{candidate.content}</ReactMarkdown>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedIndex(candidate.index)
                        onSelect(candidate)
                      }}
                      disabled={isSubmitting}
                      className="gap-2"
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Selected
                        </>
                      ) : (
                        'Select this response'
                      )}
                    </Button>
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
