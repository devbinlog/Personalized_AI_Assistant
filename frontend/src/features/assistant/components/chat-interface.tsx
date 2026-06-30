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
import { Brain, Sparkles } from 'lucide-react'
import type { ConversationMode, PreferenceTag, ResponseStrategy } from '@/types'
import type { Message } from 'ai'
import type { AttachedFile } from './chat-input'

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
    isLoading,
    stop,
    meta,
    messageIdMap,
    learningCandidates,
    isLearningLoading,
    sendLearningMessage,
    submitNormal,
    clearLearningCandidates,
    setMessages,
  } = useChatStream(mode, conversationId, (newId) => {
    if (!conversationId) router.replace(`/chat/${newId}`)
  })

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, learningCandidates, learningState.step])

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

  const onSend = useCallback((files?: AttachedFile[]) => {
    if (!input.trim() && (!files || files.length === 0)) return
    setLearningState({ step: 'done', selectedCandidate: null, messageId: null, candidateId: null })
    clearLearningCandidates()
    if (mode === 'LEARNING') {
      sendLearningMessage(input, files)
      handleInputChange({ target: { value: '' } } as never)
    } else {
      submitNormal(files)
    }
  }, [input, mode, sendLearningMessage, submitNormal, clearLearningCandidates, handleInputChange])

  const onCandidateSelect = useCallback((candidate: { strategy: ResponseStrategy; content: string; index: number }) => {
    setLearningState(prev => ({ ...prev, step: 'tags', selectedCandidate: candidate }))
  }, [])

  const onTagsSubmit = useCallback(async (tags: PreferenceTag[]) => {
    if (!learningState.selectedCandidate || !learningState.messageId) return
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
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'assistant', content: learningState.selectedCandidate!.content },
    ])
    setLearningState({ step: 'done', selectedCandidate: null, messageId: null, candidateId: null })
    clearLearningCandidates()
  }, [learningState, learningCandidates, messages, meta.conversationId, setMessages, clearLearningCandidates])

  const showWelcome = messages.length === 0 && !isLearningLoading && !learningCandidates

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      <SuggestionBanner />

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

            {isLearningLoading && (
              <div className="flex gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                  <Brain className="h-4 w-4 text-indigo-600 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-4 py-3 rounded">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">응답 스타일 3가지 생성 중…</span>
                </div>
              </div>
            )}

            {learningCandidates && learningState.step === 'candidates' && (
              <div className="py-2">
                <CandidateCards candidates={learningCandidates.candidates as never} onSelect={onCandidateSelect} />
              </div>
            )}

            {learningState.step === 'tags' && (
              <div className="py-2">
                <TagSelector onSubmit={onTagsSubmit} />
              </div>
            )}
          </div>
        )}
      </div>

      <ChatInput
        value={input}
        onChange={v => handleInputChange({ target: { value: v } } as never)}
        onSubmit={onSend}
        onStop={stop}
        isStreaming={isLoading}
        isLoading={isLearningLoading}
        placeholder={
          mode === 'LEARNING'
            ? '무엇이든 물어보세요 — 3가지 스타일 중 선택하게 됩니다…'
            : '무엇이든 물어보세요…'
        }
      />
    </div>
  )
}

function WelcomeScreen({ mode }: { mode: ConversationMode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-white">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
        <Brain className="h-6 w-6 text-white" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-slate-900 tracking-tight">
        {mode === 'LEARNING' ? '학습 모드가 활성화됐습니다' : '무엇을 도와드릴까요?'}
      </h2>
      <p className="max-w-sm text-sm text-slate-500 leading-relaxed">
        {mode === 'LEARNING'
          ? '무엇이든 물어보세요 — 3가지 다른 응답 스타일을 생성합니다. 선택할수록 AI가 당신을 더 잘 이해합니다.'
          : '대화할수록 나를 닮아가는 AI. 응답 스타일을 학습하고 기억합니다.'}
      </p>
      {mode === 'LEARNING' && (
        <div className="mt-4 flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
          <Sparkles className="h-3 w-3" />
          선호도 학습 활성화됨
        </div>
      )}
    </div>
  )
}
