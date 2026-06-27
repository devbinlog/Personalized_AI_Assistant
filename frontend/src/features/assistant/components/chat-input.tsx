'use client'

import { useRef, useCallback, type KeyboardEvent } from 'react'
import { Send, Square, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onStop?: () => void
  isStreaming?: boolean
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  isLoading,
  disabled,
  placeholder = 'Ask me anything…',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (!isStreaming && !isLoading && value.trim()) onSubmit()
      }
    },
    [isStreaming, isLoading, value, onSubmit],
  )

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [])

  const busy = isStreaming || isLoading

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm px-4 py-3">
      <div className="mx-auto max-w-3xl">
        <div
          className={cn(
            'flex items-end gap-2 rounded-2xl border border-border bg-card px-4 py-3',
            'focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20',
            'transition-all duration-200',
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => {
              onChange(e.target.value)
              handleInput()
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || busy}
            placeholder={placeholder}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent text-sm outline-none',
              'placeholder:text-muted-foreground/60',
              'max-h-[200px] min-h-[24px]',
              (disabled || busy) && 'opacity-60',
            )}
          />

          <div className="flex items-center gap-1 pb-0.5">
            {busy ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={onStop}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={onSubmit}
                disabled={!value.trim() || disabled}
                className="h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
