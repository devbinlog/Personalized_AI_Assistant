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

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6} /g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*>+] /gm, '')
    .trim()
}

export function CandidateCards({ candidates, onSelect, isSubmitting }: CandidateCardsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  // All cards expanded by default
  const [expandedSet, setExpandedSet] = useState<Set<number>>(() => new Set(candidates.map(c => c.index)))

  const toggleExpand = (index: number) => {
    setExpandedSet(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="px-4 py-3">
      <p className="mb-3 text-xs font-medium text-slate-500 dark:text-[#8a8f98]">
        응답 스타일을 선택하세요
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {candidates.map((candidate) => {
          const isSelected = selectedIndex === candidate.index
          const isExpanded = expandedSet.has(candidate.index)

          return (
            <div
              key={candidate.index}
              className={cn(
                'rounded-xl border p-4 transition-all overflow-hidden',
                isSelected
                  ? 'border-slate-500 dark:border-[#5e6ad2] bg-slate-100 dark:bg-[#28282c] shadow-sm'
                  : 'border-slate-200 dark:border-white/8 bg-white dark:bg-[#191a1b] hover:border-slate-400 dark:hover:border-white/20 hover:shadow-sm',
              )}
            >
              {/* Card header — click to toggle */}
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => toggleExpand(candidate.index)}
              >
                <span className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-[#8a8f98]">
                  {strategyLabel(candidate.strategy)}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-slate-900 dark:text-[#f7f8f8]" />}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 dark:text-[#8a8f98]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 dark:text-[#8a8f98]" />
                  )}
                </div>
              </div>

              {/* Full content always rendered; collapsed shows preview */}
              {isExpanded ? (
                <div className="mt-3 max-h-[400px] overflow-y-auto text-sm text-slate-700 dark:text-[#d0d6e0] leading-relaxed prose-chat">
                  <ReactMarkdown components={{ strong: ({ children }) => <span>{children}</span>, em: ({ children }) => <span>{children}</span> }}>{candidate.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-700 dark:text-[#d0d6e0] leading-relaxed line-clamp-3">
                  {stripMarkdown(candidate.content)}
                </p>
              )}

              <button
                onClick={() => {
                  setSelectedIndex(candidate.index)
                  onSelect(candidate)
                }}
                disabled={isSubmitting}
                className={cn(
                  'mt-4 w-full rounded-lg bg-slate-700 dark:bg-[#5e6ad2] py-2 text-xs font-semibold text-white hover:bg-slate-600 dark:hover:bg-[#6b77e0] transition-colors',
                  isSubmitting && 'opacity-50 cursor-not-allowed',
                )}
              >
                {isSelected ? '선택됨' : '선택'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
