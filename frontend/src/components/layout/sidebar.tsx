'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  LayoutDashboard,
  FlaskConical,
  Lightbulb,
  Settings,
  Plus,
  Brain,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAppStore } from '@/stores/app-store'

const NAV_ITEMS = [
  {
    label: 'Chat',
    href: ROUTES.CHAT,
    icon: MessageSquare,
    description: 'Talk to your assistant',
  },
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    description: 'Learning analytics',
  },
  {
    label: 'Prompt Lab',
    href: ROUTES.PROMPT_LAB,
    icon: FlaskConical,
    description: 'Inspect prompt internals',
  },
  {
    label: 'Insights',
    href: ROUTES.INSIGHTS,
    icon: Lightbulb,
    description: 'Explainable AI',
  },
  {
    label: 'Settings',
    href: ROUTES.SETTINGS,
    icon: Settings,
    description: 'Preferences & config',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { mode, setMode } = useAppStore()
  const isLearning = mode === 'LEARNING'

  function toggleMode() {
    setMode(isLearning ? 'NORMAL' : 'LEARNING')
  }

  return (
    <aside
      className="flex h-full flex-col"
      style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: '#0f1011',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center gap-2"
        style={{ paddingLeft: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'rgba(113,112,255,0.1)' }}
        >
          <Brain className="h-3.5 w-3.5" style={{ color: '#7170ff' }} />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#f7f8f8' }}>Adaptive AI</span>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Link
          href={ROUTES.CHAT}
          className="flex w-full items-center justify-center gap-2 transition-colors"
          style={{
            backgroundColor: '#5e6ad2',
            color: '#ffffff',
            height: '32px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7170ff')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#5e6ad2')}
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </Link>
      </div>

      {/* Section label */}
      <div className="px-3 pb-1">
        <span
          style={{
            display: 'block',
            fontSize: '10px',
            fontWeight: 500,
            color: '#62666d',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Navigation
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === ROUTES.CHAT
              ? pathname === ROUTES.CHAT || pathname.startsWith('/chat/')
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-2.5 rounded-md transition-colors',
              )}
              style={{
                paddingLeft: isActive ? '6px' : '8px',
                paddingRight: '8px',
                paddingTop: '6px',
                paddingBottom: '6px',
                fontSize: '13px',
                fontWeight: 500,
                color: isActive ? '#f7f8f8' : '#8a8f98',
                backgroundColor: isActive ? 'rgba(113,112,255,0.08)' : 'transparent',
                borderLeft: isActive ? '2px solid #7170ff' : '2px solid transparent',
              }}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer — Learning Mode Toggle */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px' }}>
        <button
          onClick={toggleMode}
          className="flex w-full items-center gap-2 rounded-md text-left transition-colors"
          style={{
            padding: '6px 8px',
            borderRadius: '6px',
            backgroundColor: isLearning ? 'rgba(113,112,255,0.08)' : 'transparent',
          }}
        >
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full"
            style={{
              backgroundColor: isLearning ? 'rgba(113,112,255,0.15)' : 'rgba(255,255,255,0.04)',
            }}
          >
            <Sparkles
              className="h-3 w-3"
              style={{ color: isLearning ? '#7170ff' : '#62666d' }}
            />
          </div>
          <div className="flex flex-col">
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: isLearning ? '#7170ff' : '#62666d',
              }}
            >
              Learning Mode
            </span>
            <span style={{ fontSize: '10px', color: '#62666d' }}>
              {isLearning ? 'On — click to disable' : 'Off — click to enable'}
            </span>
          </div>
        </button>
      </div>
    </aside>
  )
}
