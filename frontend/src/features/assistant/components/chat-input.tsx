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
    <div
      className="px-4 py-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#0f1011' }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2">
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
              'flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-colors',
              'min-h-[44px] max-h-[200px]',
              (disabled || busy) && 'opacity-60',
            )}
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f7f8f8',
            }}
          />

          <div className="flex items-end pb-0.5">
            {busy ? (
              <button
                onClick={onStop}
                className="flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: '#5e6ad2',
                  color: '#ffffff',
                  borderRadius: '8px',
                  height: '36px',
                  width: '36px',
                }}
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={!value.trim() || disabled}
                className="flex items-center justify-center transition-colors disabled:opacity-40"
                style={{
                  backgroundColor: '#5e6ad2',
                  color: '#ffffff',
                  borderRadius: '8px',
                  height: '36px',
                  width: '36px',
                }}
                onMouseEnter={e => {
                  if (!(!value.trim() || disabled)) {
                    e.currentTarget.style.backgroundColor = '#7170ff'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#5e6ad2'
                }}
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10px]" style={{ color: 'rgba(98,102,109,0.7)' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
