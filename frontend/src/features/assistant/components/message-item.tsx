'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn, strategyLabel, confidencePercent } from '@/lib/utils'
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
  const isMock = process.env.NEXT_PUBLIC_LLM_PROVIDER === 'mock'

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-indigo-100'
            : 'border border-slate-200 bg-white',
        )}
      >
        {isUser
          ? <User className="h-3.5 w-3.5 text-indigo-600" />
          : <Brain className="h-3.5 w-3.5 text-indigo-600" />
        }
      </div>

      {/* Content */}
      <div className={cn('flex-1 max-w-3xl space-y-1.5', isUser && 'flex flex-col items-end')}>
        {/* Meta badges */}
        {!isUser && (strategy || searchUsed) && (
          <div className="flex flex-wrap gap-1.5">
            {strategy && (
              <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                <Sparkles className="h-2.5 w-2.5 text-indigo-500" />
                {strategyLabel(strategy as never)}
              </span>
            )}
            {searchUsed && (
              <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                <Globe className="h-2.5 w-2.5" />
                웹 검색
              </span>
            )}
            {!isMock && confidence !== null && confidence !== undefined && (
              <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                {confidencePercent(confidence)} 일치
              </span>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'rounded-[12px_2px_12px_12px] bg-indigo-600 text-white'
              : 'rounded-[2px_12px_12px_12px] border border-slate-100 bg-slate-50 text-slate-800',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat text-sm">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    if (!match) {
                      return (
                        <code className="rounded bg-white border border-slate-200 px-1 py-0.5 font-mono text-xs text-slate-700" {...props}>
                          {children}
                        </code>
                      )
                    }
                    return (
                      <SyntaxHighlighter
                        style={oneLight as never}
                        language={match[1]}
                        PreTag="div"
                        className="!rounded-lg !text-xs !mt-2 !border !border-slate-200"
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

        {!isMock && !isUser && !isStreaming && messageId && settings.showExplanations && (
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
