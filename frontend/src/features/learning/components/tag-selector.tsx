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
    <div className="mx-4 rounded-xl border border-border bg-card p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">What made this response better? <span className="text-muted-foreground font-normal">(optional)</span></p>
        <p className="text-xs text-muted-foreground">Your feedback helps the AI learn your style</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PREFERENCE_TAGS.map(tag => {
          const isSelected = selected.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-150',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
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
