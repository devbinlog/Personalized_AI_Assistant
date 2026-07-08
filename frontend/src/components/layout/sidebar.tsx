'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Brain,
  Plus,
  MessageSquare,
  LayoutDashboard,
  FlaskConical,
  Lightbulb,
  Settings,
  Users2,
  GitBranch,
  Database,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Trash2,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { cn, formatDate } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAppStore } from '@/stores/app-store'

interface Conversation {
  id: string
  title: string | null
  mode: string
  updatedAt: string
  _count: { messages: number }
}

const NAV_ITEMS = [
  { label: '채팅', href: ROUTES.CHAT, icon: MessageSquare },
  { label: '대시보드', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: '프롬프트 랩', href: ROUTES.PROMPT_LAB, icon: FlaskConical },
  { label: '인사이트', href: ROUTES.INSIGHTS, icon: Lightbulb },
  { label: '설정', href: ROUTES.SETTINGS, icon: Settings },
]

const DESIGN_NAV_ITEMS = [
  { label: '페르소나 스튜디오', href: ROUTES.PERSONA_STUDIO, icon: Users2 },
  { label: '플로우 디자이너', href: ROUTES.FLOW_DESIGNER, icon: GitBranch },
  { label: '실험', href: ROUTES.EXPERIMENTS, icon: FlaskConical },
  { label: '데이터셋', href: ROUTES.DATASETS, icon: Database },
]

interface SidebarProps {
  showConversations?: boolean
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ showConversations = false, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { mode, setMode, resetChat, chatResetKey, sidebarRefreshKey, theme, setTheme } = useAppStore()
  const isLearning = mode === 'LEARNING'
  const isDark = theme === 'dark'

  const isInDesignSection = DESIGN_NAV_ITEMS.some(item => pathname.startsWith(item.href))
  const [designOpen, setDesignOpen] = useState(isInDesignSection)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Conversation list state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)

  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/conversations').catch(() => null)
    if (!res?.ok) { setLoadingConvs(false); return }
    const data = await res.json()
    setConversations(data.conversations ?? [])
    setLoadingConvs(false)
  }, [])

  useEffect(() => {
    if (showConversations) loadConversations()
  }, [showConversations, loadConversations])

  useEffect(() => {
    if (showConversations) loadConversations()
  }, [pathname, showConversations, loadConversations])

  useEffect(() => {
    if (showConversations && chatResetKey > 0) loadConversations()
  }, [chatResetKey, showConversations, loadConversations])

  useEffect(() => {
    if (showConversations && sidebarRefreshKey > 0) loadConversations()
  }, [sidebarRefreshKey, showConversations, loadConversations])

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleNewChat() {
    resetChat()
    router.push('/chat')
    onClose?.()
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/conversations?id=${id}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.id !== id))
    // If deleting the currently open conversation, reset chat and navigate to /chat
    if (id === activeConvId) {
      resetChat()
      router.push('/chat')
    }
  }

  const activeConvId = pathname.startsWith('/chat/') ? pathname.split('/')[2] : null

  // User initials for avatar
  const userName = session?.user?.name ?? session?.user?.email ?? '사용자'
  const userEmail = session?.user?.email ?? ''
  const initials = userName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  function navItemStyle(isActive: boolean) {
    return {
      paddingLeft: isActive ? '6px' : '8px',
      paddingRight: '8px',
      paddingTop: '6px',
      paddingBottom: '6px',
      fontSize: '13px',
      fontWeight: 500,
      color: isActive ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
      backgroundColor: isActive ? 'var(--color-surface-hover)' : 'transparent',
      borderLeft: isActive ? '2px solid var(--color-text-secondary)' : '2px solid transparent',
    } as React.CSSProperties
  }

  return (
    <aside
      className={[
        'flex flex-col',
        // Desktop: static in the flex row, always visible
        'md:relative md:h-full md:translate-x-0',
        // Mobile: fixed drawer that slides in from the left
        'fixed inset-y-0 left-0 h-full z-40',
        'transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}
      style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: 'var(--color-sidebar-bg)',
        borderRight: '1px solid var(--color-sidebar-border)',
      }}
    >
      {/* Header */}
      <div
        className="flex h-14 items-center gap-2 shrink-0 pr-2"
        style={{ paddingLeft: '16px', borderBottom: '1px solid var(--color-sidebar-border)' }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 flex-1 min-w-0"
          onClick={onClose}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            <Brain className="h-3.5 w-3.5" style={{ color: '#334155' }} />
          </div>
          <span className="flex-1" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Adaptive AI</span>
        </Link>
        {/* Close button — mobile only */}
        <button
          className="md:hidden flex h-7 w-7 items-center justify-center rounded-md transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          onClick={onClose}
          aria-label="사이드바 닫기"
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3 shrink-0">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center justify-center gap-2 transition-colors"
          style={{
            backgroundColor: '#334155',
            color: '#ffffff',
            height: '32px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#475569')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#334155')}
        >
          <Plus className="h-3.5 w-3.5" />
          새 대화
        </button>
      </div>

      {/* Menu section label */}
      <div className="px-3 pb-1 shrink-0">
        <span
          style={{
            display: 'block',
            fontSize: '10px',
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          메뉴
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-0.5 px-2 pb-1 shrink-0">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === ROUTES.CHAT
              ? pathname === ROUTES.CHAT || pathname.startsWith('/chat/')
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('group flex items-center gap-2.5 rounded-md transition-colors')}
              style={navItemStyle(isActive)}
              onClick={onClose}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = isActive ? 'var(--color-surface-hover)' : 'transparent'
              }}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* AI Design section — collapsible */}
      <div className="shrink-0">
        <button
          onClick={() => setDesignOpen(o => !o)}
          className="flex w-full items-center justify-between px-3 pt-2 pb-1"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            AI 디자인
          </span>
          {designOpen
            ? <ChevronDown className="h-3 w-3" style={{ color: 'var(--color-text-muted)' }} />
            : <ChevronRight className="h-3 w-3" style={{ color: 'var(--color-text-muted)' }} />
          }
        </button>
        {designOpen && (
          <nav className="space-y-0.5 px-2 pb-1">
            {DESIGN_NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('group flex items-center gap-2.5 rounded-md transition-colors')}
                  style={navItemStyle(isActive)}
                  onClick={onClose}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = isActive ? 'var(--color-surface-hover)' : 'transparent'
                  }}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--color-sidebar-border)', margin: '4px 0' }} className="shrink-0" />

      {/* Conversation list */}
      {showConversations && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-3 py-1 shrink-0">
            <span
              style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              대화 기록
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-1">
            {loadingConvs ? (
              <div className="space-y-1.5 pt-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-lg"
                    style={{ backgroundColor: 'var(--color-surface-hover)' }}
                  />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '8px' }}>
                대화 기록이 없습니다
              </p>
            ) : (
              <ul className="space-y-0.5">
                {conversations.map(c => {
                  const isActive = activeConvId === c.id
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/chat/${c.id}`}
                        className="group flex items-center justify-between rounded-md px-2 py-1.5 transition-colors"
                        style={{
                          backgroundColor: isActive ? 'var(--color-surface-hover)' : 'transparent',
                          color: isActive ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                        }}
                        onClick={onClose}
                        onMouseEnter={e => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = isActive ? 'var(--color-surface-hover)' : 'transparent'
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="truncate"
                            style={{ fontSize: '12px', fontWeight: 500, lineHeight: '1.25' }}
                          >
                            {c.title ?? '새 대화'}
                          </p>
                          <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                            {c._count.messages}개 · {formatDate(c.updatedAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteConversation(c.id, e)}
                          className="ml-1 shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                          style={{ color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#ef4444'
                            e.currentTarget.style.backgroundColor = '#fee2e2'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = '#a8a29e'
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Spacer when no conversations */}
      {!showConversations && <div className="flex-1" />}

      {/* Learning Mode Toggle + Theme Toggle */}
      <div className="shrink-0 px-3 py-2 flex items-center gap-2">
        <button
          onClick={() => setMode(isLearning ? 'NORMAL' : 'LEARNING')}
          className="flex flex-1 items-center gap-2 rounded-md text-left transition-colors"
          style={{
            padding: '6px 8px',
            borderRadius: '6px',
            backgroundColor: isLearning ? '#ecfdf5' : 'transparent',
            border: isLearning ? '1px solid #a7f3d0' : '1px solid transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            if (!isLearning) e.currentTarget.style.backgroundColor = isDark ? '#28282c' : '#f8fafc'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = isLearning ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5') : 'transparent'
          }}
        >
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full shrink-0"
            style={{ backgroundColor: isLearning ? (isDark ? 'rgba(16,185,129,0.2)' : '#d1fae5') : (isDark ? '#28282c' : '#f5f5f4') }}
          >
            <Sparkles
              className="h-3 w-3"
              style={{ color: isLearning ? '#059669' : (isDark ? '#8a8f98' : '#a8a29e') }}
            />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: isLearning ? '#059669' : (isDark ? '#d0d6e0' : '#44403c') }}>
            학습 모드 {isLearning ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Theme toggle icon */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors"
          style={{
            border: '1px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: isDark ? '#8a8f98' : '#78716c',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? '#28282c' : '#f1f5f9' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Footer — border-top이 채팅 입력창 border와 같은 높이 */}
      <div
        className="shrink-0"
        style={{ borderTop: '1px solid var(--color-sidebar-border)', padding: '8px 12px' }}
      >
        {session ? (
          /* User Menu */
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="flex w-full items-center gap-2 rounded-md transition-colors"
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full shrink-0 text-white"
                style={{ backgroundColor: '#334155', fontSize: '10px', fontWeight: 700 }}
              >
                {initials || '?'}
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span
                  className="truncate"
                  style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)' }}
                >
                  {userName}
                </span>
                {userEmail && (
                  <span
                    className="truncate"
                    style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}
                  >
                    {userEmail}
                  </span>
                )}
              </div>
            </button>

            {userMenuOpen && (
              <div
                className="absolute bottom-full left-0 mb-1 w-full rounded-lg shadow-lg"
                style={{
                  backgroundColor: 'var(--color-dropdown-bg)',
                  border: '1px solid var(--color-border)',
                  padding: '4px',
                  zIndex: 50,
                }}
              >
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="flex w-full items-center rounded-md px-3 py-2 text-left transition-colors"
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-text-primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-dropdown-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Login link when no session */
          <Link
            href="/auth/signin"
            className="flex w-full items-center gap-2 rounded-md transition-colors"
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            로그인
          </Link>
        )}
      </div>
    </aside>
  )
}
