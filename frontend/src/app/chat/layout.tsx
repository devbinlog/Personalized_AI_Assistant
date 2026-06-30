'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { ConversationSidebar } from '@/features/assistant/components/conversation-sidebar'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-white">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-14">
        <ConversationSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(p => !p)}
        />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
