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
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card/50">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">Adaptive AI</span>
          <span className="text-[10px] text-muted-foreground leading-tight">Personal Assistant</span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button asChild className="w-full gap-2" size="sm">
          <Link href={ROUTES.CHAT}>
            <Plus className="h-4 w-4" />
            New Chat
          </Link>
        </Button>
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
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer — Learning Mode Toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={toggleMode}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
            isLearning
              ? 'bg-primary/10 hover:bg-primary/20'
              : 'hover:bg-accent',
          )}
        >
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full',
              isLearning ? 'bg-primary/20' : 'bg-muted',
            )}
          >
            <Sparkles
              className={cn(
                'h-3 w-3',
                isLearning ? 'text-primary' : 'text-muted-foreground',
              )}
            />
          </div>
          <div className="flex flex-col">
            <span
              className={cn(
                'text-xs font-medium',
                isLearning ? 'text-primary' : 'text-foreground',
              )}
            >
              Learning Mode
            </span>
            <span className="text-[10px] text-muted-foreground">
              {isLearning ? 'On — click to disable' : 'Off — click to enable'}
            </span>
          </div>
        </button>
      </div>
    </aside>
  )
}
