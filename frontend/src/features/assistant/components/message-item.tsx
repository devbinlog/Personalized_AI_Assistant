'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn, strategyLabel, confidencePercent } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Brain, Globe, User, Sparkles } from 'lucide-react'
import type { Message } from 'ai'
import { ExplanationPanel } from '@/features/xai/components/explanation-panel'
import { useAppStore } from '@/stores/app-store'

interface MessageItemProps {
  message: Message
  messageId?: string | null
  strategy?: string | null
  confidence?: number | null
  taskType?: string | null
  searchUsed?: boolean
  isStreaming?: boolean
}

export function MessageItem({
  message,
  messageId,
  strategy,
  confidence,
  taskType,
  searchUsed,
  isStreaming,
}: MessageItemProps) {
  const isUser = message.role === 'user'
  const { settings } = useAppStore()

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={
          isUser
            ? { backgroundColor: 'rgba(94,106,210,0.2)' }
            : { backgroundColor: '#191a1b', border: '1px solid rgba(255,255,255,0.08)' }
        }
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" style={{ color: '#7170ff' }} />
        ) : (
          <Brain className="h-3.5 w-3.5" style={{ color: '#7170ff' }} />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 max-w-3xl space-y-2', isUser && 'flex flex-col items-end')}>
        {/* Meta badges */}
        {!isUser && (strategy || searchUsed || taskType) && (
          <div className="flex flex-wrap gap-1.5">
            {strategy && (
              <span
                className="inline-flex items-center gap-1"
                style={{
                  fontSize: '10px',
                  color: '#8a8f98',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  padding: '1px 6px',
                }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                {strategyLabel(strategy as never)}
              </span>
            )}
            {searchUsed && (
              <span
                className="inline-flex items-center gap-1"
                style={{
                  fontSize: '10px',
                  color: '#8a8f98',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  padding: '1px 6px',
                }}
              >
                <Globe className="h-2.5 w-2.5" />
                Web search
              </span>
            )}
            {confidence !== null && confidence !== undefined && (
              <span
                style={{
                  fontSize: '10px',
                  color: '#8a8f98',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  padding: '1px 6px',
                }}
              >
                {confidencePercent(confidence)} match
              </span>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className="px-4 py-3"
          style={
            isUser
              ? {
                  backgroundColor: '#5e6ad2',
                  color: '#ffffff',
                  borderRadius: '12px 2px 12px 12px',
                  fontSize: '14px',
                }
              : {
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '2px 12px 12px 12px',
                  fontSize: '14px',
                }
          }
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat text-sm">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const isInline = !match
                    if (isInline) {
                      return (
                        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs" {...props}>
                          {children}
                        </code>
                      )
                    }
                    return (
                      <SyntaxHighlighter
                        style={oneDark as never}
                        language={match[1]}
                        PreTag="div"
                        className="!rounded-lg !text-xs !mt-2"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="streaming-cursor ml-0.5" />
              )}
            </div>
          )}
        </div>

        {/* XAI — "Why this answer?" button (assistant messages only, not while streaming) */}
        {!isUser && !isStreaming && messageId && settings.showExplanations && (
          <ExplanationPanel
            messageId={messageId}
            initialConfidence={confidence}
            initialStrategy={strategy}
          />
        )}
      </div>
    </div>
  )
}
