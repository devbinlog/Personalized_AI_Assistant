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
    <div className="border-t border-slate-200 bg-white px-4 py-4">
      <p className="mb-1 text-sm font-semibold text-slate-900">
        What made this response better?{' '}
        <span className="font-normal text-slate-500">(optional)</span>
      </p>
      <p className="mb-4 text-xs text-slate-500">Your feedback helps the AI learn your style</p>

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
                  ? 'border border-indigo-400 bg-indigo-50 text-indigo-700'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
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
            'flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors',
            isSubmitting && 'opacity-40 cursor-not-allowed',
          )}
        >
          <Send className="h-3.5 w-3.5" />
          Save preference
        </button>
        <button
          onClick={() => onSubmit([])}
          disabled={isSubmitting}
          className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
