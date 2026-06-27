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
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary/20' : 'bg-primary/10',
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary" />
        ) : (
          <Brain className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 max-w-3xl space-y-2', isUser && 'flex flex-col items-end')}>
        {/* Meta badges */}
        {!isUser && (strategy || searchUsed || taskType) && (
          <div className="flex flex-wrap gap-1.5">
            {strategy && (
              <Badge variant="outline" className="h-5 text-[10px] gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                {strategyLabel(strategy as never)}
              </Badge>
            )}
            {searchUsed && (
              <Badge variant="outline" className="h-5 text-[10px] gap-1 text-blue-400 border-blue-500/30">
                <Globe className="h-2.5 w-2.5" />
                Web search
              </Badge>
            )}
            {confidence !== null && confidence !== undefined && (
              <Badge variant="outline" className="h-5 text-[10px] text-muted-foreground">
                {confidencePercent(confidence)} match
              </Badge>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card border border-border rounded-tl-sm',
          )}
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
