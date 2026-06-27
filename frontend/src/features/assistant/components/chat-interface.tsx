'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStream } from '../hooks/use-chat-stream'
import { MessageItem } from './message-item'
import { ChatInput } from './chat-input'
import { CandidateCards } from '@/features/learning/components/candidate-cards'
import { TagSelector } from '@/features/learning/components/tag-selector'
import { SuggestionBanner } from '@/features/preference-manager/components/suggestion-banner'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import { Brain, Sparkles } from 'lucide-react'
import type { ConversationMode, PreferenceTag, ResponseStrategy } from '@/types'
import type { Message } from 'ai'

interface ChatInterfaceProps {
  conversationId?: string
  initialMessages?: Message[]
}

type LearningStep = 'candidates' | 'tags' | 'done'

interface LearningState {
  step: LearningStep
  selectedCandidate: { strategy: ResponseStrategy; content: string; index: number } | null
  messageId: string | null
  candidateId: string | null
}

export function ChatInterface({ conversationId, initialMessages }: ChatInterfaceProps) {
  const router = useRouter()
  const mode = useAppStore(s => s.mode)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [learningState, setLearningState] = useState<LearningState>({
    step: 'done',
    selectedCandidate: null,
    messageId: null,
    candidateId: null,
  })

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    meta,
    messageIdMap,
    learningCandidates,
    isLearningLoading,
    sendLearningMessage,
    clearLearningCandidates,
    setMessages,
  } = useChatStream(mode, conversationId, (newId) => {
    if (!conversationId) router.replace(`/chat/${newId}`)
  })

  // Initialize with existing messages
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
    }
  }, [])

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, learningCandidates, learningState.step])

  // When candidates arrive, show them
  useEffect(() => {
    if (learningCandidates) {
      setLearningState({
        step: 'candidates',
        selectedCandidate: null,
        messageId: learningCandidates.messageId,
        candidateId: null,
      })
    }
  }, [learningCandidates])

  const onSend = useCallback(() => {
    if (!input.trim()) return
    setLearningState({ step: 'done', selectedCandidate: null, messageId: null, candidateId: null })
    clearLearningCandidates()

    if (mode === 'LEARNING') {
      sendLearningMessage(input)
      handleInputChange({ target: { value: '' } } as never)
    } else {
      handleSubmit()
    }
  }, [input, mode, sendLearningMessage, handleSubmit, clearLearningCandidates, handleInputChange])

  const onCandidateSelect = useCallback((candidate: { strategy: ResponseStrategy; content: string; index: number }) => {
    setLearningState(prev => ({
      ...prev,
      step: 'tags',
      selectedCandidate: candidate,
    }))
  }, [])

  const onTagsSubmit = useCallback(async (tags: PreferenceTag[]) => {
    if (!learningState.selectedCandidate || !learningState.messageId) return

    // Find the candidate ID from the candidates list
    const candidateRes = await fetch(`/api/conversations/${meta.conversationId ?? ''}`)
    const convData = await candidateRes.json().catch(() => ({}))
    const lastMsg = convData?.conversation?.messages?.slice(-1)[0]
    const matchingCandidate = lastMsg?.responseCandidates?.find(
      (c: { index: number }) => c.index === learningState.selectedCandidate?.index,
    )

    await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: learningState.messageId,
        candidateId: matchingCandidate?.id ?? learningState.messageId,
        selectedStrategy: learningState.selectedCandidate.strategy,
        selectedTags: tags,
        taskType: learningCandidates?.taskAnalysis?.taskType ?? 'CONVERSATION',
        domain: learningCandidates?.taskAnalysis?.domain ?? 'general',
        complexity: learningCandidates?.taskAnalysis?.complexity ?? 'LOW',
        userQuery: messages[messages.length - 1]?.content ?? '',
      }),
    }).catch(() => {})

    // Add the selected response as an assistant message
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'assistant', content: learningState.selectedCandidate!.content },
    ])

    setLearningState({ step: 'done', selectedCandidate: null, messageId: null, candidateId: null })
    clearLearningCandidates()
  }, [learningState, learningCandidates, messages, meta.conversationId, setMessages, clearLearningCandidates])

  const showWelcome = messages.length === 0 && !isLearningLoading && !learningCandidates

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Suggestion banner (Phase 14) */}
      <SuggestionBanner />

      {/* Message area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-none">
        {showWelcome ? (
          <WelcomeScreen mode={mode} />
        ) : (
          <div className="pb-4">
            {messages.map((msg, i) => {
              const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1
              const dbMessageId = messageIdMap[msg.id] ?? (isLastAssistant ? meta.messageId : null)
              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  messageId={dbMessageId}
                  strategy={isLastAssistant ? meta.strategy : null}
                  confidence={isLastAssistant ? meta.confidence : null}
                  taskType={isLastAssistant ? meta.taskType : null}
                  searchUsed={isLastAssistant ? meta.searchUsed : false}
                  isStreaming={isLoading && isLastAssistant}
                />
              )
            })}

            {/* Learning mode: loading */}
            {isLearningLoading && (
              <div className="flex gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Brain className="h-4 w-4 text-primary animate-pulse-slow" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">Generating 3 response styles…</span>
                </div>
              </div>
            )}

            {/* Candidate cards */}
            {learningCandidates && learningState.step === 'candidates' && (
              <div className="py-2">
                <CandidateCards
                  candidates={learningCandidates.candidates as never}
                  onSelect={onCandidateSelect}
                />
              </div>
            )}

            {/* Tag selector */}
            {learningState.step === 'tags' && (
              <div className="py-2">
                <TagSelector onSubmit={onTagsSubmit} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        value={input}
        onChange={v => handleInputChange({ target: { value: v } } as never)}
        onSubmit={onSend}
        onStop={stop}
        isStreaming={isLoading}
        isLoading={isLearningLoading}
        placeholder={
          mode === 'LEARNING'
            ? 'Ask anything — you\'ll choose from 3 response styles…'
            : 'Ask me anything…'
        }
      />
    </div>
  )
}

function WelcomeScreen({ mode }: { mode: ConversationMode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Brain className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">
        {mode === 'LEARNING' ? 'Learning Mode Active' : 'What can I help you with?'}
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {mode === 'LEARNING'
          ? 'Ask anything — I\'ll generate 3 different response styles for you to choose from. Your choices train me to respond better.'
          : 'Your adaptive AI assistant. The more you use it, the more personalized responses become.'}
      </p>
      {mode === 'LEARNING' && (
        <div className="mt-4 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs text-primary">Preference learning enabled</span>
        </div>
      )}
    </div>
  )
}
