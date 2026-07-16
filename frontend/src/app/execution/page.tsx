'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Plus, CheckCircle2, Clock, Loader2, BarChart3, ChevronRight, X, Sparkles } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import type { ExecutionGoal, GoalCategory } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  career: '커리어', learning: '학습', project: '프로젝트',
  health: '건강', startup: '창업', personal: '개인', general: '일반',
}
const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS)

const CATEGORY_COLORS: Record<string, string> = {
  career: 'bg-blue-50 text-blue-700 border-blue-100',
  learning: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  project: 'bg-amber-50 text-amber-700 border-amber-100',
  health: 'bg-rose-50 text-rose-700 border-rose-100',
  startup: 'bg-purple-50 text-purple-700 border-purple-100',
  personal: 'bg-slate-50 text-slate-700 border-slate-200',
  general: 'bg-slate-50 text-slate-700 border-slate-200',
}

export default function ExecutionPage() {
  const router = useRouter()
  const { executionGoalId, setExecutionGoal } = useAppStore()
  const [goals, setGoals] = useState<ExecutionGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'general' })

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(d => { setGoals(d.goals ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function getReturnUrl() {
    if (typeof window === 'undefined') return '/chat'
    const saved = sessionStorage.getItem('executionReturnUrl')
    if (saved && saved.startsWith('/chat')) {
      sessionStorage.removeItem('executionReturnUrl')
      return saved
    }
    return '/chat'
  }

  async function createGoal() {
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (d.goal) {
        setExecutionGoal(d.goal.id, d.goal.title)
        router.push(getReturnUrl())
      }
    } finally {
      setCreating(false)
    }
  }

  function activateGoal(goal: ExecutionGoal) {
    setExecutionGoal(goal.id, goal.title)
    router.push(getReturnUrl())
  }

  const activeGoals = goals.filter(g => g.status === 'ACTIVE' || g.status === 'PAUSED')
  const doneGoals = goals.filter(g => g.status === 'COMPLETED')

  return (
    <div className="min-h-full" style={{ background: 'var(--color-bg)' }}>
      <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>실행 모드</h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              목표를 선택하면 AI가 기존 채팅 안에서 여정을 함께 완성합니다
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            <Plus className="h-3.5 w-3.5" /> 새 목표
          </button>
        </div>

        {/* 현재 활성 목표 배너 */}
        {executionGoalId && (
          <div
            className="flex items-center justify-between rounded-xl p-3 border"
            style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-100">
                <Target className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-blue-700">현재 실행 중인 목표</div>
                <div className="text-xs text-blue-600">{goals.find(g => g.id === executionGoalId)?.title ?? '목표 불러오는 중...'}</div>
              </div>
            </div>
            <button
              onClick={() => { setExecutionGoal(null, null); router.push('/chat') }}
              className="text-blue-400 hover:text-blue-600 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 새 목표 생성 폼 */}
        {showCreate && (
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>새 목표 만들기</span>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                목표 *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="예: 디자인 회사 합격, 포트폴리오 완성, 영어 공부"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text-primary)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-surface)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)' }}
                onKeyDown={e => e.key === 'Enter' && createGoal()}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                설명 (선택)
              </label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="목표에 대한 추가 설명"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text-primary)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-surface)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                카테고리
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setForm(f => ({ ...f, category: value }))}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                      form.category === value
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'hover:border-slate-400'
                    }`}
                    style={form.category !== value ? { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'transparent' } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs flex-1" style={{ color: 'var(--color-text-muted)' }}>
                <Sparkles className="h-3 w-3" />
                AI가 마일스톤과 단계를 자동으로 설계합니다
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl border px-3 py-1.5 text-sm"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'transparent', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={createGoal}
                disabled={!form.title.trim() || creating}
                className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--color-accent)', cursor: creating ? 'wait' : 'pointer', border: 'none' }}
              >
                {creating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 여정 설계 중...</> : '목표 시작'}
              </button>
            </div>
          </div>
        )}

        {/* 목표 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : goals.length === 0 && !showCreate ? (
          <div
            className="rounded-2xl border-2 border-dashed p-12 text-center"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Target className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              첫 번째 목표를 만들어보세요
            </h2>
            <p className="text-sm mb-5 max-w-xs mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              AI가 여정을 설계하고 매 단계마다 다음 행동을 알려줍니다
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--color-accent)', border: 'none', cursor: 'pointer' }}
            >
              <Plus className="h-4 w-4" /> 목표 만들기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeGoals.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  진행 중 ({activeGoals.length})
                </h2>
                <div className="space-y-2">
                  {activeGoals.map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      isActive={goal.id === executionGoalId}
                      onClick={() => activateGoal(goal)}
                    />
                  ))}
                </div>
              </section>
            )}
            {doneGoals.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  완료 ({doneGoals.length})
                </h2>
                <div className="space-y-2">
                  {doneGoals.map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      isActive={goal.id === executionGoalId}
                      onClick={() => activateGoal(goal)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function GoalCard({ goal, isActive, onClick }: { goal: ExecutionGoal; isActive: boolean; onClick: () => void }) {
  const categoryColor = CATEGORY_COLORS[goal.category] ?? CATEGORY_COLORS.general
  const categoryLabel = CATEGORY_LABELS[goal.category] ?? goal.category

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border p-4 transition-colors group"
      style={{
        background: isActive ? '#eff6ff' : 'var(--color-surface)',
        borderColor: isActive ? '#bfdbfe' : 'var(--color-border)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-hover)' }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {goal.status === 'COMPLETED'
            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            : <Clock className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
          }
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${categoryColor}`}>
            {categoryLabel}
          </span>
          {isActive && (
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              실행 중
            </span>
          )}
        </div>
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--color-text-muted)' }} />
      </div>

      <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{goal.title}</div>
      {goal.description && (
        <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
          {goal.description}
        </div>
      )}
    </button>
  )
}
