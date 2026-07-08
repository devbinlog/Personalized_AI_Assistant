'use client'

import { useState, useEffect } from 'react'
import { Users2, Plus, Zap, Check, Trash2, Save, Eye, Pencil } from 'lucide-react'
import type { Persona } from '@/types'

// ── 비주얼 디자인 매핑 ───────────────────────────────────────────────────────

interface PersonaDesign {
  color: string
  darkColor: string
  icon: string
  bg: string
  darkBg: string
  accent: string
}

function getPersonaDesign(persona: { name: string; tone: string }): PersonaDesign {
  const name = persona.name.toLowerCase()
  const tone = persona.tone.toLowerCase()

  if (name.includes('professional') || tone === 'professional')
    return { color: '#5e6ad2', darkColor: '#818cf8', icon: '💼', bg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-950/30', accent: 'bg-indigo-500' }
  if (name.includes('friendly') || (name.includes('mentor') && tone === 'friendly'))
    return { color: '#10b981', darkColor: '#34d399', icon: '🌱', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-950/30', accent: 'bg-emerald-500' }
  if (name.includes('interview') || tone === 'motivational')
    return { color: '#f59e0b', darkColor: '#fbbf24', icon: '🎯', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-950/30', accent: 'bg-amber-500' }
  if (name.includes('developer') || tone === 'precise' || tone === 'technical')
    return { color: '#8b5cf6', darkColor: '#a78bfa', icon: '⚡', bg: 'bg-violet-50', darkBg: 'dark:bg-violet-950/30', accent: 'bg-violet-500' }
  if (name.includes('research') || tone === 'analytical')
    return { color: '#06b6d4', darkColor: '#22d3ee', icon: '🔬', bg: 'bg-cyan-50', darkBg: 'dark:bg-cyan-950/30', accent: 'bg-cyan-500' }

  const toneMap: Record<string, PersonaDesign> = {
    helpful: { color: '#10b981', darkColor: '#34d399', icon: '✨', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-950/30', accent: 'bg-emerald-500' },
    analytical: { color: '#06b6d4', darkColor: '#22d3ee', icon: '📊', bg: 'bg-cyan-50', darkBg: 'dark:bg-cyan-950/30', accent: 'bg-cyan-500' },
    coaching: { color: '#f59e0b', darkColor: '#fbbf24', icon: '🏆', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-950/30', accent: 'bg-amber-500' },
    friendly: { color: '#10b981', darkColor: '#34d399', icon: '🌱', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-950/30', accent: 'bg-emerald-500' },
    precise: { color: '#8b5cf6', darkColor: '#a78bfa', icon: '⚡', bg: 'bg-violet-50', darkBg: 'dark:bg-violet-950/30', accent: 'bg-violet-500' },
    motivational: { color: '#f59e0b', darkColor: '#fbbf24', icon: '🎯', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-950/30', accent: 'bg-amber-500' },
  }
  return toneMap[tone] ?? { color: '#5e6ad2', darkColor: '#818cf8', icon: '🤖', bg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-950/30', accent: 'bg-indigo-500' }
}

// ── 기본값 ───────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  description: '',
  tone: 'helpful',
  speakingStyle: 'professional',
  formalityLevel: 3,
  humorLevel: 2,
  empathyLevel: 3,
  responseLength: 'medium',
  pronounPolicy: 'I',
  promptFragment: '',
  fallbackBehavior: 'Provide a helpful response.',
  refusalBehavior: 'I cannot assist with that.',
  clarificationBehavior: 'Could you clarify?',
  allowedBehaviors: [] as string[],
  forbiddenBehaviors: [] as string[],
  exampleResponses: [] as string[],
  isActive: false,
  isDefault: false,
}

type PersonaForm = typeof EMPTY_FORM
type RightTab = 'overview' | 'edit'

// ── 스타일 유틸 ──────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none dark:border-white/8 dark:bg-[#28282c] dark:text-[#f7f8f8] dark:placeholder:text-[#8a8f98] dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/20'

const labelCls = 'block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-[#8a8f98]'

// ── 특성 바 컴포넌트 ─────────────────────────────────────────────────────────

function TraitBar({ label, value, max = 5, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = (value / max) * 100
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-slate-600 dark:text-[#d0d6e0]">{label}</span>
        <span className="text-xs font-semibold text-slate-400 dark:text-[#8a8f98]">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ── 미리보기 카드 (새 페르소나 프리뷰) ──────────────────────────────────────

function PersonaPreviewCard({ name, tone, description }: { name: string; tone: string; description: string }) {
  const design = getPersonaDesign({ name, tone })
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-white/8 p-4 ${design.bg} ${design.darkBg}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{design.icon}</span>
        <div>
          <p className="font-semibold text-slate-800 dark:text-[#f7f8f8] text-sm">{name || '새 페르소나'}</p>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${design.darkColor}22`, color: design.color }}
          >
            {tone}
          </span>
        </div>
      </div>
      {description && (
        <p className="text-xs text-slate-600 dark:text-[#8a8f98] line-clamp-2 leading-relaxed">{description}</p>
      )}
    </div>
  )
}

// ── 좌측 페르소나 리스트 아이템 ──────────────────────────────────────────────

function PersonaListItem({
  p,
  selected,
  onSelect,
}: {
  p: Persona
  selected: Persona | null
  onSelect: (p: Persona) => void
}) {
  const design = getPersonaDesign(p)
  const isSelected = selected?.id === p.id

  return (
    <button
      onClick={() => onSelect(p)}
      className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-white/5 transition-colors cursor-pointer group
        ${isSelected
          ? 'bg-indigo-50 dark:bg-indigo-950/30'
          : 'hover:bg-slate-50 dark:hover:bg-[#28282c]'
        }`}
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base ${design.bg} ${design.darkBg}`}
        >
          {design.icon}
        </div>

        {/* 텍스트 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span
              className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-[#f7f8f8]'}`}
            >
              {p.name}
            </span>
            {p.isActive && (
              <span className="shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-[9px] font-semibold px-1.5 py-0.5">
                활성
              </span>
            )}
          </div>

          {/* 어조/스타일 칩 */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${design.color}18`, color: design.color }}
            >
              {p.tone}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#8a8f98]">{p.speakingStyle}</span>
          </div>

          {/* 설명 (2줄 truncate) */}
          {p.description && (
            <p className="text-xs text-slate-500 dark:text-[#8a8f98] line-clamp-2 leading-relaxed">
              {p.description}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

// ── 탭 버튼 ──────────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
        ${active
          ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-slate-500 dark:text-[#8a8f98] hover:text-slate-700 dark:hover:text-[#d0d6e0]'
        }`}
    >
      {icon}
      {label}
    </button>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function PersonaStudioPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selected, setSelected] = useState<Persona | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<PersonaForm>(EMPTY_FORM)
  const [rightTab, setRightTab] = useState<RightTab>('overview')

  useEffect(() => {
    fetch('/api/personas')
      .then(r => r.json())
      .then(d => {
        setPersonas(d.personas || [])
        setLoading(false)
      })
  }, [])

  function selectPersona(p: Persona) {
    setSelected(p)
    setIsNew(false)
    setRightTab('overview')
    setForm({
      name: p.name,
      description: p.description,
      tone: p.tone,
      speakingStyle: p.speakingStyle,
      formalityLevel: p.formalityLevel,
      humorLevel: p.humorLevel,
      empathyLevel: p.empathyLevel,
      responseLength: p.responseLength,
      pronounPolicy: p.pronounPolicy,
      promptFragment: p.promptFragment,
      fallbackBehavior: p.fallbackBehavior,
      refusalBehavior: p.refusalBehavior,
      clarificationBehavior: p.clarificationBehavior,
      allowedBehaviors: p.allowedBehaviors,
      forbiddenBehaviors: p.forbiddenBehaviors,
      exampleResponses: p.exampleResponses,
      isActive: p.isActive,
      isDefault: p.isDefault,
    })
  }

  function startNew() {
    setSelected(null)
    setIsNew(true)
    setRightTab('edit')
    setForm(EMPTY_FORM)
  }

  async function save() {
    setSaving(true)
    try {
      if (isNew) {
        const res = await fetch('/api/personas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const d = await res.json()
        setPersonas(prev => [...prev, d.persona])
        setSelected(d.persona)
        setIsNew(false)
        setRightTab('overview')
      } else if (selected) {
        const res = await fetch(`/api/personas/${selected.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const d = await res.json()
        setPersonas(prev => prev.map(p => (p.id === d.persona.id ? d.persona : p)))
        setSelected(d.persona)
      }
    } finally {
      setSaving(false)
    }
  }

  async function activate(id: string) {
    await fetch(`/api/personas/${id}/activate`, { method: 'POST' })
    const r = await fetch('/api/personas')
    const d = await r.json()
    setPersonas(d.personas || [])
    if (selected) {
      const updated = (d.personas as Persona[]).find(p => p.id === selected.id)
      if (updated) setSelected(updated)
    }
  }

  async function remove(id: string) {
    await fetch(`/api/personas/${id}`, { method: 'DELETE' })
    setPersonas(prev => prev.filter(p => p.id !== id))
    if (selected?.id === id) {
      setSelected(null)
      setIsNew(false)
    }
  }

  function field(key: keyof PersonaForm, label: string, type: 'text' | 'textarea' = 'text') {
    const val = form[key] as string
    return (
      <div key={key}>
        <label className={labelCls}>{label}</label>
        {type === 'textarea' ? (
          <textarea
            value={val}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            rows={4}
            className={inputCls}
            style={{ resize: 'vertical' }}
          />
        ) : (
          <input
            type="text"
            value={val}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className={inputCls}
          />
        )}
      </div>
    )
  }

  const activePersona = personas.find(p => p.isActive)
  const showEditor = selected !== null || isNew
  const defaultPersonas = personas.filter(p => p.isDefault)
  const customPersonas = personas.filter(p => !p.isDefault)

  // 우측 개요 탭
  function OverviewTab() {
    if (!selected) return null
    const design = getPersonaDesign(selected)
    return (
      <div className="space-y-6">
        {/* 헤더 카드 */}
        <div className={`rounded-2xl border border-slate-200 dark:border-white/8 p-6 ${design.bg} ${design.darkBg}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{design.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-[#f7f8f8]">{selected.name}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${design.color}22`, color: design.color }}
                  >
                    {selected.tone}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-[#8a8f98]">{selected.speakingStyle}</span>
                  {selected.isDefault && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-[#d0d6e0]">
                      디폴트
                    </span>
                  )}
                  {selected.isActive && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                      활성 중
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => activate(selected.id)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: design.color }}
              >
                {selected.isActive ? <><Check className="h-3.5 w-3.5" /> 활성</> : <><Zap className="h-3.5 w-3.5" /> 활성화</>}
              </button>
              {!selected.isDefault && (
                <button
                  onClick={() => remove(selected.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> 삭제
                </button>
              )}
            </div>
          </div>
          {selected.description && (
            <p className="mt-4 text-sm text-slate-700 dark:text-[#d0d6e0] leading-relaxed">{selected.description}</p>
          )}
        </div>

        {/* 특성 그리드 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-5">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-4">특성</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <TraitBar label="격식도" value={selected.formalityLevel} color={design.color} />
            <TraitBar label="공감도" value={selected.empathyLevel} color={design.color} />
            <TraitBar label="유머" value={selected.humorLevel} color={design.color} />
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-[#d0d6e0]">응답 길이</span>
                <span className="text-xs font-semibold text-slate-400 dark:text-[#8a8f98]">{selected.responseLength}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: selected.responseLength === 'short' ? '33%' : selected.responseLength === 'medium' ? '66%' : '100%',
                    backgroundColor: design.color,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 허용 / 금지 행동 */}
        {(selected.allowedBehaviors?.length > 0 || selected.forbiddenBehaviors?.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {selected.allowedBehaviors?.length > 0 && (
              <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 p-4">
                <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">허용 행동</h4>
                <ul className="space-y-1.5">
                  {selected.allowedBehaviors.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <Check className="h-3 w-3 mt-0.5 shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selected.forbiddenBehaviors?.length > 0 && (
              <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 p-4">
                <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-3">금지 행동</h4>
                <ul className="space-y-1.5">
                  {selected.forbiddenBehaviors.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-red-800 dark:text-red-300">
                      <span className="mt-0.5 shrink-0 font-bold">×</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 프롬프트 조각 */}
        {selected.promptFragment && (
          <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-slate-50 dark:bg-[#191a1b] p-5">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-3">시스템 프롬프트 조각</h3>
            <pre className="text-xs text-slate-700 dark:text-[#d0d6e0] whitespace-pre-wrap font-mono leading-relaxed">
              {selected.promptFragment}
            </pre>
          </div>
        )}

        {/* 행동 정책 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-5">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-4">행동 정책</h3>
          <div className="space-y-3">
            {[
              { label: '기본 응답', value: selected.fallbackBehavior },
              { label: '거절', value: selected.refusalBehavior },
              { label: '명확화', value: selected.clarificationBehavior },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-3">
                <span className="shrink-0 text-xs font-semibold text-slate-400 dark:text-[#8a8f98] w-16 pt-0.5">{label}</span>
                <p className="text-sm text-slate-700 dark:text-[#d0d6e0] leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 우측 편집 탭
  function EditTab() {
    return (
      <div className="space-y-5">
        {/* 새 페르소나: 실시간 미리보기 */}
        {isNew && (
          <div>
            <p className={labelCls}>미리보기</p>
            <PersonaPreviewCard name={form.name} tone={form.tone} description={form.description} />
          </div>
        )}

        {/* 기본 정보 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-5 space-y-4">
          <h2 className={`${labelCls} !mb-3`}>기본 정보</h2>
          {field('name', '이름')}
          {field('description', '설명')}
        </div>

        {/* 성격 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-5 space-y-4">
          <h2 className={`${labelCls} !mb-3`}>성격</h2>
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                ['tone', '어조', ['helpful', 'professional', 'friendly', 'analytical', 'motivational', 'precise']],
                ['speakingStyle', '말하기 스타일', ['professional', 'conversational', 'formal', 'technical', 'coaching', 'academic']],
                ['responseLength', '응답 길이', ['short', 'medium', 'long']],
              ] as const
            ).map(([key, label, opts]) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <select
                  value={form[key] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className={inputCls}
                >
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}

            {(['formalityLevel', 'empathyLevel', 'humorLevel'] as const).map(key => {
              const labelMap = { formalityLevel: '격식도', empathyLevel: '공감도', humorLevel: '유머' }
              return (
                <div key={key}>
                  <label className={labelCls}>
                    {labelMap[key]}: {form[key]}/5
                  </label>
                  <input
                    type="range" min="1" max="5"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-500 dark:accent-indigo-400"
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* 시스템 프롬프트 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-5 space-y-4">
          <h2 className={`${labelCls} !mb-3`}>시스템 프롬프트</h2>
          {field('promptFragment', '프롬프트 조각 (시스템 프롬프트에 삽입됨)', 'textarea')}
        </div>

        {/* 행동 정책 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-5 space-y-4">
          <h2 className={`${labelCls} !mb-3`}>행동 정책</h2>
          {field('fallbackBehavior', '기본 응답 정책')}
          {field('refusalBehavior', '거절 응답 정책')}
          {field('clarificationBehavior', '명확화 응답 정책')}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-56px)] bg-slate-50 dark:bg-[#08090a]">
      {/* ── 좌측 패널 ── */}
      <div className="flex flex-col w-72 shrink-0 border-r border-slate-200 dark:border-white/8 bg-white dark:bg-[#0f1011]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-white/8">
          <div className="flex items-center gap-2">
            <Users2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">페르소나</span>
            <span className="text-xs text-slate-400 dark:text-[#8a8f98] border border-slate-200 dark:border-white/8 px-1.5 py-0.5 rounded">
              {personas.length}
            </span>
          </div>
          <button
            onClick={startNew}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> 새로만들기
          </button>
        </div>

        {/* 페르소나 목록 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400 dark:text-[#8a8f98]">불러오는 중...</div>
          ) : (
            <>
              {/* 디폴트 그룹 */}
              {defaultPersonas.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-[#8a8f98] uppercase tracking-widest">디폴트</span>
                  </div>
                  {defaultPersonas.map(p => <PersonaListItem key={p.id} p={p} selected={selected} onSelect={selectPersona} />)}
                </div>
              )}

              {/* 커스텀 그룹 */}
              {customPersonas.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-[#8a8f98] uppercase tracking-widest">커스텀</span>
                  </div>
                  {customPersonas.map(p => <PersonaListItem key={p.id} p={p} selected={selected} onSelect={selectPersona} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── 우측 패널 ── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-[#08090a]">
        {!showEditor ? (
          /* 빈 상태 */
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] shadow-sm">
                <Users2 className="h-7 w-7 text-slate-300 dark:text-[#8a8f98]" />
              </div>
              <p className="text-sm text-slate-400 dark:text-[#8a8f98]">페르소나를 선택하거나 새로 만드세요</p>
              {activePersona && (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  활성: {activePersona.name}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* 탭 바 + 액션 버튼 */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
              {/* 탭 */}
              <div className="flex gap-1 border-b border-slate-200 dark:border-white/8 w-full pb-0">
                {!isNew && (
                  <TabButton
                    active={rightTab === 'overview'}
                    onClick={() => setRightTab('overview')}
                    icon={<Eye className="h-3.5 w-3.5" />}
                    label="개요"
                  />
                )}
                <TabButton
                  active={rightTab === 'edit'}
                  onClick={() => setRightTab('edit')}
                  icon={<Pencil className="h-3.5 w-3.5" />}
                  label={isNew ? '새 페르소나 만들기' : '편집'}
                />
              </div>

              {/* 저장 버튼 */}
              {rightTab === 'edit' && (
                <div className="shrink-0 ml-4 pb-0.5">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" /> {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              )}
            </div>

            {/* 탭 컨텐츠 */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {rightTab === 'overview' && selected && <OverviewTab />}
              {rightTab === 'edit' && <EditTab />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
