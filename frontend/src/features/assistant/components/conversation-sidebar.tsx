'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquarePlus, Trash2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

interface Conversation {
  id: string
  title: string | null
  mode: string
  updatedAt: string
  _count: { messages: number }
}

interface ConversationSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function ConversationSidebar({ collapsed, onToggle }: ConversationSidebarProps) {
  const pathname = usePathname()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch('/api/conversations').catch(() => null)
    if (!res?.ok) return
    const data = await res.json()
    setConversations(data.conversations ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // 현재 대화가 바뀌면 목록 새로고침
  useEffect(() => { load() }, [pathname, load])

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/conversations?id=${id}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  const activeId = pathname.startsWith('/chat/') ? pathname.split('/')[2] : null

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-200 bg-white transition-all duration-200 shrink-0',
        collapsed ? 'w-12' : 'w-60',
      )}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-400 hover:text-slate-700 transition-colors"
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft className="h-3 w-3" />
        }
      </button>

      {collapsed ? (
        <div className="flex flex-col items-center gap-3 pt-4 px-2">
          <Link
            href="/chat"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            title="새 대화"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Link>
          {conversations.slice(0, 8).map(c => (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                activeId === c.id
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700',
              )}
              title={c.title ?? '대화'}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">대화 기록</span>
            <Link
              href="/chat"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              새 대화
            </Link>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto py-2">
            {loading ? (
              <div className="space-y-1.5 px-2 pt-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <MessageSquare className="mx-auto mb-2 h-7 w-7 text-slate-200" />
                <p className="text-xs text-slate-400">대화 기록이 없습니다</p>
              </div>
            ) : (
              <ul className="space-y-0.5 px-2">
                {conversations.map(c => (
                  <li key={c.id}>
                    <Link
                      href={`/chat/${c.id}`}
                      className={cn(
                        'group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors',
                        activeId === c.id
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-medium leading-snug">
                          {c.title ?? '새 대화'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {c._count.messages}개 메시지 · {formatDate(c.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteConversation(c.id, e)}
                        className="ml-1 shrink-0 rounded p-0.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
