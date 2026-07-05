'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useChatStream } from '../hooks/use-chat-stream'
import { MessageItem } from './message-item'
import { ChatInput } from './chat-input'
import { CandidateCards } from '@/features/learning/components/candidate-cards'
import { TagSelector } from '@/features/learning/components/tag-selector'
import { SuggestionBanner } from '@/features/preference-manager/components/suggestion-banner'
import { useAppStore } from '@/stores/app-store'
import { Brain, Sparkles, LogIn, User, Settings, LogOut, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
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

const GUEST_CHAT_KEY = 'guest_chat_used'
const GUEST_LEARNING_KEY = 'guest_learning_used'

function getGuestUsage() {
  if (typeof window === 'undefined') return { chatUsed: false, learningUsed: false }
  return {
    chatUsed: localStorage.getItem(GUEST_CHAT_KEY) === '1',
    learningUsed: localStorage.getItem(GUEST_LEARNING_KEY) === '1',
  }
}

export function ChatInterface({ conversationId, initialMessages }: ChatInterfaceProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isGuest = status !== 'loading' && !session?.user
  const mode = useAppStore(s => s.mode)
  const chatResetKey = useAppStore(s => s.chatResetKey)
  const refreshSidebar = useAppStore(s => s.refreshSidebar)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  // DB-loaded assistant message IDs — msg.id is already the DB ID for these
  const loadedDbMessageIds = useRef<Set<string>>(new Set(
    initialMessages?.filter(m => m.role === 'assistant').map(m => m.id) ?? []
  ))
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
  } = useChatStream(
    mode,
    conversationId,
    (newId) => {
      if (!conversationId) {
        // Always use replaceState to avoid full navigation, then refresh sidebar
        window.history.replaceState({}, '', `/chat/${newId}`)
        refreshSidebar()
      }
    },
    undefined,
    initialMessages,
  )

  // Load past conversation messages client-side (reliable across RSC caching)
  useEffect(() => {
    if (!conversationId) return
    fetch(`/api/conversations/${conversationId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const msgs = data?.conversation?.messages
        if (msgs?.length > 0) {
          // Track assistant message IDs — msg.id IS the DB ID for loaded messages
          const assistantIds = new Set<string>(
            msgs.filter((m: { role: string }) => m.role === 'ASSISTANT').map((m: { id: string }) => m.id)
          )
          loadedDbMessageIds.current = assistantIds
          setMessages(msgs.map((m: { id: string; role: string; content: string }) => ({
            id: m.id,
            role: m.role.toLowerCase() as 'user' | 'assistant',
            content: m.content,
          })))
        }
      })
      .catch(() => {})
  }, [conversationId])

  const isFirstReset = useRef(true)
  useEffect(() => {
    if (isFirstReset.current) { isFirstReset.current = false; return }
    // chatResetKey changed → "새 대화" was clicked, reset all state
    setMessages([])
    setLearningState({ step: 'done', selectedCandidate: null, messageId: null, candidateId: null })
    clearLearningCandidates()
    window.history.pushState({}, '', '/chat')
  }, [chatResetKey])

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

  // When sending a new message in Learning mode while candidates are still showing,
  // auto-insert the first candidate as the previous answer so chat history stays complete.
  function flushPendingLearningAnswer(messagesList: Message[]): Message[] {
    if (learningCandidates?.candidates?.length && learningState.step !== 'done') {
      return [
        ...messagesList,
        {
          id: `auto-${Date.now()}`,
          role: 'assistant' as const,
          content: learningCandidates.candidates[0].content,
        },
      ]
    }
    return messagesList
  }

  const onSend = useCallback((files?: AttachedFile[]) => {
    if (!input.trim() && (!files || files.length === 0)) return

    if (isGuest) {
      const { chatUsed, learningUsed } = getGuestUsage()
      if (mode === 'NORMAL' && chatUsed) { setShowLoginModal(true); return }
      if (mode === 'LEARNING' && learningUsed) { setShowLoginModal(true); return }
    }

    setLearningState({ step: 'done', selectedCandidate: null, messageId: null, candidateId: null })
    clearLearningCandidates()

    if (mode === 'LEARNING') {
      if (isGuest) localStorage.setItem(GUEST_LEARNING_KEY, '1')
      setMessages(prev => [
        ...flushPendingLearningAnswer(prev),
        { id: `lrn-${Date.now()}`, role: 'user', content: input },
      ])
      sendLearningMessage(input, files)
      handleInputChange({ target: { value: '' } } as never)
    } else {
      if (isGuest) localStorage.setItem(GUEST_CHAT_KEY, '1')
      submitNormal(files)
    }
  }, [input, mode, isGuest, learningCandidates, learningState.step, sendLearningMessage, submitNormal, clearLearningCandidates, handleInputChange, setMessages])

  const onCandidateSelect = useCallback((candidate: { strategy: ResponseStrategy; content: string; index: number }) => {
    if (isGuest) {
      setShowLoginModal(true)
      return
    }
    setLearningState(prev => ({ ...prev, step: 'tags', selectedCandidate: candidate }))
  }, [isGuest])

  const onTagsSubmit = useCallback(async (tags: PreferenceTag[]) => {
    if (!learningState.selectedCandidate || !meta.conversationId) return
    await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: meta.conversationId,
        selectedContent: learningState.selectedCandidate.content,
        selectedStrategy: learningState.selectedCandidate.strategy,
        selectedTags: tags,
        taskType: learningCandidates?.taskAnalysis?.taskType ?? 'CONVERSATION',
        domain: learningCandidates?.taskAnalysis?.domain ?? 'general',
        complexity: learningCandidates?.taskAnalysis?.complexity ?? 'LOW',
        userQuery: messages[messages.length - 1]?.content ?? '',
        taskAnalysis: learningCandidates?.taskAnalysis ?? null,
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
    <div className="flex flex-1 flex-col overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
      {showLoginModal && <LoginPromptModal onClose={() => setShowLoginModal(false)} />}

      {/* Top header bar — matches sidebar h-14 header height and border */}
      <div
        className="flex h-14 shrink-0 items-center justify-between pl-14 pr-4 md:px-4"
        style={{ borderBottom: '1px solid #e7e5e4' }}
      >
        {/* 왼쪽: 모드 표시 */}
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4" style={{ color: '#334155' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1c1917' }}>
            {mode === 'LEARNING' ? '학습 모드' : '일반 모드'}
          </span>
          {mode === 'LEARNING' && (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: '#d1fae5',
                color: '#059669',
                border: '1px solid #a7f3d0',
              }}
            >
              <Sparkles className="h-2.5 w-2.5" />
              선호도 학습 중
            </span>
          )}
          <PersonaQuickSelect />
        </div>

        {/* 오른쪽: 유저 프로필 */}
        <ChatHeaderUser />
      </div>

      <SuggestionBanner />

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-none">
        {showWelcome ? (
          <WelcomeScreen mode={mode} />
        ) : (
          <div className="pb-4">
            {messages.map((msg, i) => {
              const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1
              // For newly streamed messages: look up AI SDK ID → DB ID in messageIdMap
              // For DB-loaded messages: msg.id is already the DB ID
              const dbMessageId =
                messageIdMap[msg.id]
                ?? (loadedDbMessageIds.current.has(msg.id) ? msg.id : null)
                ?? (isLastAssistant ? meta.messageId : null)
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#f1f5f9' }}>
                  <Brain className="h-4 w-4 animate-pulse" style={{ color: '#334155' }} />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ border: '1px solid #e7e5e4', backgroundColor: '#fafaf9' }}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#fbbf24', animationDelay: `${i * 150}ms` }} />
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

function LoginPromptModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center" style={{ border: '1px solid #e7e5e4' }}>
        <div className="mb-4 flex justify-center">
          <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>
            <LogIn className="h-7 w-7" style={{ color: '#334155' }} />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">로그인이 필요해요</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          무료 체험이 종료됐습니다.<br />
          계속 이용하려면 로그인하세요.
        </p>
        <button
          onClick={() => router.push('/auth/signin')}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors mb-3"
          style={{ backgroundColor: '#334155' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#475569')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#334155')}
        >
          로그인
        </button>
        <button
          onClick={() => router.push('/auth/signup')}
          className="w-full rounded-lg border py-2.5 text-sm font-semibold transition-colors mb-3"
          style={{ borderColor: '#e7e5e4', color: '#374151' }}
        >
          회원가입
        </button>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          닫기
        </button>
      </div>
    </div>
  )
}

function ChatHeaderUser() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (status === 'loading') return null

  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
        style={{ border: '1px solid #e7e5e4', color: '#6b7280' }}
      >
        <LogIn className="h-3.5 w-3.5" />
        로그인
      </Link>
    )
  }

  const name = session.user.name ?? session.user.email ?? '사용자'
  const initials = name.slice(0, 1).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
        style={{ border: '1px solid #e7e5e4' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fafaf9')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
          style={{ backgroundColor: '#334155' }}
        >
          {initials}
        </div>
        <span className="max-w-[100px] truncate text-xs font-medium" style={{ color: '#1c1917' }}>
          {name}
        </span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} style={{ color: '#9ca3af' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-48 rounded-xl py-1 shadow-lg z-50"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e7e5e4' }}
        >
          <div className="border-b px-3 py-2 mb-1" style={{ borderColor: '#e7e5e4' }}>
            <p className="truncate text-xs font-medium" style={{ color: '#1c1917' }}>{name}</p>
            {session.user.email && (
              <p className="truncate text-[10px]" style={{ color: '#9ca3af' }}>{session.user.email}</p>
            )}
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs transition-colors"
            style={{ color: '#44403c' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <User className="h-3.5 w-3.5" style={{ color: '#334155' }} />
            내 프로필
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs transition-colors"
            style={{ color: '#44403c' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Settings className="h-3.5 w-3.5" style={{ color: '#9ca3af' }} />
            설정
          </Link>
          <div className="mt-1 border-t" style={{ borderColor: '#e7e5e4' }}>
            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: '/auth/signin' }) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors"
              style={{ color: '#44403c' }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#fee2e2'
                e.currentTarget.style.color = '#ef4444'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#44403c'
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PersonaQuickSelect() {
  const [personas, setPersonas] = useState<Array<{ id: string; name: string; isActive: boolean; tone: string }>>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/personas')
      .then(r => r.json())
      .then(d => setPersonas(d.personas ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const active = personas.find(p => p.isActive)

  async function activate(id: string) {
    await fetch(`/api/personas/${id}/activate`, { method: 'POST' }).catch(() => {})
    setPersonas(prev => prev.map(p => ({ ...p, isActive: p.id === id })))
    setOpen(false)
  }

  async function deactivate() {
    await fetch('/api/personas/none/activate', { method: 'POST' }).catch(() => {})
    setPersonas(prev => prev.map(p => ({ ...p, isActive: false })))
    setOpen(false)
  }

  const PERSONA_EMOJI: Record<string, string> = {
    'Professional Assistant': '💼',
    'Friendly Mentor': '😊',
    'Interview Coach': '🎯',
    'Developer Mentor': '💻',
    'Research Assistant': '🔬',
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
        style={{
          border: '1px solid #e7e5e4',
          backgroundColor: active ? '#f1f5f9' : 'transparent',
          color: active ? '#334155' : '#9ca3af',
        }}
      >
        {active ? (
          <>
            <span>{PERSONA_EMOJI[active.name] ?? '🤖'}</span>
            <span className="hidden sm:inline max-w-[80px] truncate">{active.name.split(' ')[0]}</span>
          </>
        ) : (
          <>
            <span>🤖</span>
            <span className="hidden sm:inline">페르소나</span>
          </>
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 w-52 rounded-xl py-1 shadow-lg z-50"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e7e5e4' }}
        >
          <div className="px-3 py-1.5 border-b" style={{ borderColor: '#e7e5e4' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#a8a29e' }}>페르소나 선택</p>
          </div>
          {active && (
            <button
              onClick={deactivate}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
              style={{ color: '#ef4444' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fee2e2')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span>✕</span>
              <span>페르소나 해제</span>
            </button>
          )}
          {personas.map(p => (
            <button
              key={p.id}
              onClick={() => activate(p.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
              style={{
                color: p.isActive ? '#334155' : '#44403c',
                backgroundColor: p.isActive ? '#f8fafc' : 'transparent',
                fontWeight: p.isActive ? 600 : 400,
              }}
              onMouseEnter={e => { if (!p.isActive) e.currentTarget.style.backgroundColor = '#f8fafc' }}
              onMouseLeave={e => { if (!p.isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <span>{PERSONA_EMOJI[p.name] ?? '🤖'}</span>
              <span className="flex-1 truncate">{p.name}</span>
              {p.isActive && <span style={{ color: '#059669' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function WelcomeScreen({ mode }: { mode: ConversationMode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: '#ffffff' }}>
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300"
        style={{
          backgroundColor: mode === 'LEARNING' ? '#059669' : '#334155',
          boxShadow: mode === 'LEARNING'
            ? '0 8px 24px rgba(5,150,105,0.25)'
            : '0 8px 24px rgba(15,23,42,0.12)',
        }}
      >
        <Brain className="h-7 w-7 text-white" />
      </div>
      <h2 className="mb-2 text-xl font-semibold tracking-tight" style={{ color: '#1c1917' }}>
        {mode === 'LEARNING' ? '학습 모드가 활성화됐습니다' : '무엇을 도와드릴까요?'}
      </h2>
      <p className="max-w-sm text-sm leading-relaxed" style={{ color: '#78716c' }}>
        {mode === 'LEARNING' ? (
          <>
            무엇이든 물어보세요 — 3가지 다른 응답 스타일을 생성합니다.<br />
            선택할수록 AI가 당신을 더 잘 이해합니다.
          </>
        ) : (
          '대화할수록 나를 닮아가는 AI. 응답 스타일을 학습하고 기억합니다.'
        )}
      </p>
      {mode === 'LEARNING' && (
        <div
          className="mt-5 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
          style={{
            backgroundColor: '#d1fae5',
            color: '#059669',
            border: '1px solid #a7f3d0',
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          선호도 학습 활성화됨
        </div>
      )}
    </div>
  )
}
