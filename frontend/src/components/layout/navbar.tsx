'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
  Brain,
  MessageSquare,
  LayoutDashboard,
  FlaskConical,
  Lightbulb,
  Settings,
  Users2,
  GitBranch,
  Database,
  Sparkles,
  ChevronDown,
  BarChart3,
  GraduationCap,
  Star,
  Beaker,
  LogOut,
  Shield,
  User,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAppStore } from '@/stores/app-store'
import { useT } from '@/hooks/use-t'

type DropdownItem = { label: string; href: string; icon: React.ElementType }
type NavItem = { label: string; href?: string; icon: React.ElementType; dropdown?: DropdownItem[] }

function getNavItems(t: (k: string) => string): NavItem[] {
  return [
    { label: t('nav.chat'), href: ROUTES.CHAT, icon: MessageSquare },
    {
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      dropdown: [
        { label: t('nav.analytics'), href: ROUTES.DASHBOARD, icon: BarChart3 },
        { label: t('nav.rubric'), href: ROUTES.RUBRIC, icon: Star },
        { label: t('nav.globalLearning'), href: ROUTES.GLOBAL_LEARNING, icon: GraduationCap },
      ],
    },
    {
      label: t('nav.promptLab'),
      icon: FlaskConical,
      dropdown: [
        { label: t('nav.versions'), href: ROUTES.PROMPT_LAB, icon: FlaskConical },
        { label: t('nav.experiments'), href: ROUTES.EXPERIMENTS, icon: Beaker },
      ],
    },
    {
      label: t('nav.aiDesign'),
      icon: Users2,
      dropdown: [
        { label: t('nav.personaStudio'), href: ROUTES.PERSONA_STUDIO, icon: Users2 },
        { label: t('nav.flowDesigner'), href: ROUTES.FLOW_DESIGNER, icon: GitBranch },
      ],
    },
    { label: t('nav.datasets'), href: ROUTES.DATASETS, icon: Database },
    { label: t('nav.insights'), href: ROUTES.INSIGHTS, icon: Lightbulb },
  ]
}

function DropdownMenu({ items }: { items: DropdownItem[] }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-[#21262d] py-1.5 shadow-lg shadow-slate-900/8 z-50">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <item.icon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          {item.label}
        </Link>
      ))}
    </div>
  )
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const isActive = item.href
    ? item.href === ROUTES.CHAT
      ? pathname === item.href || pathname.startsWith('/chat/')
      : pathname.startsWith(item.href)
    : item.dropdown?.some(d => pathname.startsWith(d.href))

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (item.href && !item.dropdown) {
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100',
        )}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100',
        )}
      >
        {item.label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-180')} />
      </button>
      {open && item.dropdown && <DropdownMenu items={item.dropdown} />}
    </div>
  )
}

function UserMenu() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN'
  const t = useT()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
      >
        {t('nav.signin')}
      </Link>
    )
  }

  const name = session.user?.name ?? session.user?.email ?? '사용자'
  const initials = name.slice(0, 1).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
          {initials}
        </div>
        <span className="max-w-[90px] truncate text-xs font-medium">{name}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-[#21262d] py-1.5 shadow-lg shadow-slate-900/8 z-50">
          <div className="border-b border-slate-100 dark:border-white/10 px-3 pb-2 pt-1.5 mb-1">
            <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">{name}</p>
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">{session.user?.email}</p>
            {isAdmin && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-800 dark:text-slate-200">
                <Shield className="h-2.5 w-2.5" />
                {t('common.admin')}
              </span>
            )}
          </div>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <Shield className="h-3.5 w-3.5 shrink-0" />
              {t('nav.adminDashboard')}
            </Link>
          )}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <User className="h-3.5 w-3.5 shrink-0" />
            {t('nav.profile')}
          </Link>
          <button
            onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }) }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {t('nav.signout')}
          </button>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const { mode, setMode, theme, setTheme, language, setLanguage } = useAppStore()
  const isLearning = mode === 'LEARNING'
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useT()
  const navItems = getNavItems(t)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117]">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-700 dark:bg-slate-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Adaptive AI</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMode(isLearning ? 'NORMAL' : 'LEARNING')}
            className={cn(
              'hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
              isLearning
                ? 'bg-slate-700 dark:bg-slate-600 text-white'
                : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5',
            )}
          >
            <Sparkles className="h-3 w-3" />
            {isLearning ? t('nav.learningOn') : t('nav.learningOff')}
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-xs font-semibold"
            aria-label="언어 변경"
          >
            {language === 'ko' ? 'EN' : 'KO'}
          </button>

          {/* Theme toggle — hidden */}

          <UserMenu />
          {/* Mobile hamburger */}
          <button
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="메뉴"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-white/10 bg-white dark:bg-[#0d1117] shadow-lg">
          <nav className="flex flex-col py-2">
            {navItems.map((item) => (
              item.href && !item.dropdown ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <item.icon className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                  {item.label}
                </Link>
              ) : (
                <div key={item.label}>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <item.icon className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{item.label}</span>
                  </div>
                  {item.dropdown?.map(d => (
                    <Link
                      key={d.href}
                      href={d.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 pl-10 pr-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <d.icon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      {d.label}
                    </Link>
                  ))}
                </div>
              )
            ))}

            {/* Mobile bottom controls */}
            <div className="border-t border-slate-100 dark:border-white/10 mt-2 pt-2 px-4 pb-2 space-y-2">
              <button
                onClick={() => { setMode(isLearning ? 'NORMAL' : 'LEARNING'); setMobileOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isLearning
                    ? 'bg-slate-700 dark:bg-slate-600 text-white'
                    : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300',
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isLearning ? t('nav.learningOn') : t('nav.learningOff')}
              </button>

              {/* Mobile language toggle */}
              <button
                onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                className="flex w-full items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors"
              >
                <span className="text-xs font-bold">{language === 'ko' ? 'EN' : 'KO'}</span>
                <span>{language === 'ko' ? 'Switch to English' : '한국어로 전환'}</span>
              </button>

              {/* Mobile theme toggle — hidden */}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
