'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './sidebar'

interface AppShellProps {
  children: React.ReactNode
  showConversations?: boolean
  /** true = chat page (inner scroll), false = other pages (main scrolls) */
  scrollLock?: boolean
}

export function AppShell({ children, showConversations = false, scrollLock = false }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        showConversations={showConversations}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={`flex flex-1 flex-col ${scrollLock ? 'overflow-hidden' : 'overflow-y-auto'} relative`}>
        {/* Hamburger button — mobile only, sits in top-left of main area */}
        <button
          className="md:hidden absolute top-0 left-0 z-20 flex h-14 w-14 items-center justify-center"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          onClick={() => setSidebarOpen(true)}
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </button>

        {children}
      </main>
    </div>
  )
}
