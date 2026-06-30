'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Users,
  MessageSquare,
  BookOpen,
  Activity,
  Shield,
  ChevronRight,
  Loader2,
} from 'lucide-react'

type AdminUser = {
  id: string
  email: string | null
  name: string | null
  role: string
  sessionId: string | null
  createdAt: string
  _count: {
    conversations: number
    preferenceLogs: number
  }
}

type PlatformStats = {
  totalUsers: number
  totalConversations: number
  totalPreferenceLogs: number
  todayActivity: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin')
    }
  }, [status, router])

  useEffect(() => {
    if (!isAdmin) return
    fetchUsers()
  }, [isAdmin])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      const userList: AdminUser[] = data.users ?? []
      setUsers(userList)

      const today = new Date().toDateString()
      setStats({
        totalUsers: userList.length,
        totalConversations: userList.reduce((s, u) => s + u._count.conversations, 0),
        totalPreferenceLogs: userList.reduce((s, u) => s + u._count.preferenceLogs, 0),
        todayActivity: userList.filter(
          (u) => new Date(u.createdAt).toDateString() === today,
        ).length,
      })
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    setUpdatingRole(userId)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      await fetchUsers()
    } catch {
      // ignore
    } finally {
      setUpdatingRole(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Shield className="h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-500">관리자 권한이 필요합니다.</p>
      </div>
    )
  }

  const STAT_CARDS = [
    { label: '총 사용자 수', value: stats?.totalUsers ?? 0, icon: Users, iconCls: 'text-indigo-500' },
    { label: '총 대화 수', value: stats?.totalConversations ?? 0, icon: MessageSquare, iconCls: 'text-emerald-500' },
    { label: '총 학습 로그 수', value: stats?.totalPreferenceLogs ?? 0, icon: BookOpen, iconCls: 'text-violet-500' },
    { label: '오늘 신규 가입', value: stats?.todayActivity ?? 0, icon: Activity, iconCls: 'text-amber-500' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">관리자 대시보드</h1>
        <p className="mt-1 text-sm text-slate-500">플랫폼 사용 현황 및 사용자 관리</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <card.icon className={`h-4 w-4 ${card.iconCls} mb-3`} />
            <p className="text-2xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
            <p className="mt-1 text-sm text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">사용자 목록</h2>
          <span className="text-xs text-slate-400">{users.length}명</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">등록된 사용자가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">이름 / 이메일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">역할</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">대화 수</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">학습 로그</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">가입일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">액션</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="text-sm text-slate-900">{user.name ?? '—'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {user.email ?? `세션: ${user.sessionId?.slice(0, 12) ?? '—'}…`}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          user.role === 'ADMIN'
                            ? 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user.role === 'ADMIN' ? '관리자' : '사용자'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm text-slate-500">
                      {user._count.conversations}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm text-slate-500">
                      {user._count.preferenceLogs}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        disabled={updatingRole === user.id}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        {updatingRole === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        {user.role === 'ADMIN' ? '권한 해제' : '관리자로'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
