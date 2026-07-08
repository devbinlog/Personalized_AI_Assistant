'use client'

import { useState } from 'react'
import { cn, tagLabel } from '@/lib/utils'
import { PREFERENCE_TAGS } from '@/lib/constants'
import { CheckCircle2, Send } from 'lucide-react'
import type { PreferenceTag } from '@/types'

interface TagSelectorProps {
  onSubmit: (tags: PreferenceTag[]) => void
  isSubmitting?: boolean
}

export function TagSelector({ onSubmit, isSubmitting }: TagSelectorProps) {
  const [selected, setSelected] = useState<PreferenceTag[]>([])

  const toggle = (tag: PreferenceTag) => {
    setSelected(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    )
  }

  return (
    <div className="border-t border-slate-200 dark:border-white/8 bg-white dark:bg-[#161b22] px-4 py-4">
      <p className="mb-1 text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">
        이 응답이 더 나았던 이유는?{' '}
        <span className="font-normal text-slate-500 dark:text-[#8a8f98]">(선택)</span>
      </p>
      <p className="mb-4 text-xs text-slate-500 dark:text-[#8a8f98]">선택할수록 AI가 당신의 스타일을 더 잘 학습합니다</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {PREFERENCE_TAGS.map(tag => {
          const isSelected = selected.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                isSelected
                  ? 'border border-indigo-400 dark:border-[#5e6ad2] bg-indigo-50 dark:bg-[#5e6ad2]/20 text-indigo-700 dark:text-[#7170ff]'
                  : 'border border-slate-200 dark:border-white/10 bg-white dark:bg-[#21262d] text-slate-600 dark:text-[#d0d6e0] hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-[#30363d]',
              )}
            >
              {isSelected && <CheckCircle2 className="h-3 w-3" />}
              {tagLabel(tag)}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onSubmit(selected)}
          disabled={isSubmitting}
          className={cn(
            'flex items-center gap-2 rounded-xl bg-indigo-600 dark:bg-[#5e6ad2] px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 dark:hover:bg-[#6b77e0] transition-colors',
            isSubmitting && 'opacity-40 cursor-not-allowed',
          )}
        >
          <Send className="h-3.5 w-3.5" />
          선호도 저장
        </button>
        <button
          onClick={() => onSubmit([])}
          disabled={isSubmitting}
          className="rounded-xl border border-slate-200 dark:border-white/10 px-5 py-2 text-xs font-medium text-slate-600 dark:text-[#8a8f98] hover:bg-slate-50 dark:hover:bg-[#21262d] transition-colors"
        >
          건너뛰기
        </button>
      </div>
    </div>
  )
}
