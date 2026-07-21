'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn, strategyLabel, confidencePercent } from '@/lib/utils'
import { Brain, Globe, User, Sparkles } from 'lucide-react'
import type { Message } from 'ai'
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
  const { settings, theme } = useAppStore()
  const isMock = process.env.NEXT_PUBLIC_LLM_PROVIDER === 'mock'

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={isUser
          ? { backgroundColor: 'var(--color-surface-hover)' }
          : { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }
        }
      >
        {isUser
          ? <User className="h-3.5 w-3.5" style={{ color: 'var(--color-text-secondary)' }} />
          : <Brain className="h-3.5 w-3.5" style={{ color: 'var(--color-text-secondary)' }} />
        }
      </div>

      {/* Content */}
      <div className={cn('flex-1 max-w-3xl space-y-1.5', isUser && 'flex flex-col items-end')}>
        {/* Meta badges */}
        {!isUser && (strategy || searchUsed) && (
          <div className="flex flex-wrap gap-1.5">
            {strategy && (
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
                <Sparkles className="h-2.5 w-2.5" style={{ color: 'var(--color-text-secondary)' }} />
                {strategyLabel(strategy as never)}
              </span>
            )}
            {searchUsed && (
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
                <Globe className="h-2.5 w-2.5" />
                웹 검색
              </span>
            )}
            {!isMock && confidence !== null && confidence !== undefined && (
              <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
                {confidencePercent(confidence)} 일치
              </span>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className="px-4 py-3 text-sm leading-relaxed"
          style={isUser
            ? { borderRadius: '14px 4px 14px 14px', backgroundColor: '#334155', color: '#ffffff' }
            : { borderRadius: '4px 14px 14px 14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat text-sm">
              <ReactMarkdown
                components={{
                  strong({ children }) {
                    return <span>{children}</span>
                  },
                  em({ children }) {
                    return <span>{children}</span>
                  },
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    if (!match) {
                      return (
                        <code className="rounded px-1 py-0.5 font-mono text-xs" style={{ backgroundColor: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} {...props}>
                          {children}
                        </code>
                      )
                    }
                    return (
                      <SyntaxHighlighter
                        style={oneLight as never}
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
              {isStreaming && <span className="streaming-cursor ml-0.5" />}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
