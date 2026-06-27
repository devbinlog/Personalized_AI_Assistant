'use client'

import { useState } from 'react'
import { cn, tagLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
    <div
      className="mx-4 rounded-xl p-4 space-y-3"
      style={{ border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: '#f7f8f8' }}>
          What made this response better?{' '}
          <span style={{ color: '#8a8f98', fontWeight: 400 }}>(optional)</span>
        </p>
        <p style={{ fontSize: '12px', color: '#8a8f98' }}>Your feedback helps the AI learn your style</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PREFERENCE_TAGS.map(tag => {
          const isSelected = selected.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className="flex items-center gap-1.5 rounded-full transition-all duration-150"
              style={{
                border: isSelected ? '1px solid rgba(113,112,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                backgroundColor: isSelected ? 'rgba(113,112,255,0.1)' : 'rgba(255,255,255,0.02)',
                color: isSelected ? '#7170ff' : '#8a8f98',
                fontSize: '12px',
                padding: '6px 12px',
              }}
            >
              {isSelected && <CheckCircle2 className="h-3 w-3" />}
              {tagLabel(tag)}
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => onSubmit(selected)}
          disabled={isSubmitting}
          className="gap-2"
        >
          <Send className="h-3.5 w-3.5" />
          Save preference
        </Button>
      </div>
    </div>
  )
}
