'use client'

import { useState, useEffect } from 'react'
import { Users2, Plus, Zap, Check, Trash2, Save, Eye, Pencil, Sparkles, ChevronRight } from 'lucide-react'
import type { Persona } from '@/types'

// ── 비주얼 디자인 매핑 ───────────────────────────────────────────────────────

interface PersonaDesign {
  icon: string
}

function getPersonaDesign(persona: { name: string; tone: string }): PersonaDesign {
  const name = persona.name.toLowerCase()
  const tone = persona.tone.toLowerCase()

  // Korean names
  if (name.includes('전문')) return { icon: '💼' }
  if (name.includes('친근') || name.includes('멘토')) return { icon: '🌱' }
  if (name.includes('면접') || name.includes('코치')) return { icon: '🎯' }
  if (name.includes('개발')) return { icon: '⚡' }
  if (name.includes('리서치') || name.includes('분석')) return { icon: '🔬' }

  // English names / tone fallback
  if (name.includes('professional') || tone === 'professional') return { icon: '💼' }
  if (name.includes('friendly') || (name.includes('mentor') && tone === 'friendly')) return { icon: '🌱' }
  if (name.includes('interview') || tone === 'motivational') return { icon: '🎯' }
  if (name.includes('developer') || tone === 'precise' || tone === 'technical') return { icon: '⚡' }
  if (name.includes('research') || tone === 'analytical') return { icon: '🔬' }

  const toneMap: Record<string, string> = {
    helpful: '✨', analytical: '📊', coaching: '🏆', friendly: '🌱', precise: '⚡', motivational: '🎯',
  }
  return { icon: toneMap[tone] ?? '🤖' }
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
  fallbackBehavior: '도움이 되는 응답을 제공하겠습니다.',
  refusalBehavior: '죄송합니다, 그 요청은 처리할 수 없습니다.',
  clarificationBehavior: '좀 더 자세히 설명해 주시겠어요?',
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
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-100 outline-none dark:border-white/8 dark:bg-[#21262d] dark:text-[#f7f8f8] dark:placeholder:text-[#8a8f98] dark:focus:border-[#1E293B]/60 dark:focus:ring-[#1E293B]/15 transition-colors'

const labelCls = 'block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-[#8a8f98]'

// ── 특성 바 컴포넌트 ─────────────────────────────────────────────────────────

function TraitBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-slate-600 dark:text-[#d0d6e0]">{label}</span>
        <span className="text-xs font-bold tabular-nums text-[#1E293B] dark:text-[#334155]">{value}<span className="text-slate-400 dark:text-[#8a8f98] font-normal">/{max}</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#1E293B] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
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
      className={`w-full text-left px-3 py-3 border-b border-slate-100 dark:border-white/5 transition-all cursor-pointer group relative
        ${isSelected
          ? 'bg-slate-50 dark:bg-[#1c1f26]'
          : 'hover:bg-slate-50/70 dark:hover:bg-white/[0.03]'
        }`}
    >
      {/* 선택 표시 줄 */}
      {isSelected && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-[#1E293B]" />
      )}
      <div className="flex items-center gap-3 pl-2">
        {/* 아이콘 뱃지 */}
        <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-slate-100 dark:bg-white/8 transition-all">
          {design.icon}
        </div>

        {/* 텍스트 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className={`text-sm font-semibold truncate ${isSelected ? 'text-slate-900 dark:text-[#f7f8f8]' : 'text-slate-800 dark:text-[#d0d6e0]'}`}>
              {p.name}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {p.isActive && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  활성
                </span>
              )}
              {isSelected && <ChevronRight className="h-3 w-3 text-slate-400 dark:text-[#8a8f98]" />}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#1E293B]/10 text-[#1E293B] dark:text-[#334155]">
              {p.tone}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#8a8f98]">{p.speakingStyle}</span>
          </div>
        </div>
      </div>
    </button>
  )
}

// ── 탭 버튼 ──────────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px
        ${active
          ? 'border-[#1E293B] text-[#1E293B] dark:border-[#334155] dark:text-[#334155]'
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
      name: p.name, description: p.description, tone: p.tone, speakingStyle: p.speakingStyle,
      formalityLevel: p.formalityLevel, humorLevel: p.humorLevel, empathyLevel: p.empathyLevel,
      responseLength: p.responseLength, pronounPolicy: p.pronounPolicy, promptFragment: p.promptFragment,
      fallbackBehavior: p.fallbackBehavior, refusalBehavior: p.refusalBehavior,
      clarificationBehavior: p.clarificationBehavior, allowedBehaviors: p.allowedBehaviors,
      forbiddenBehaviors: p.forbiddenBehaviors, exampleResponses: p.exampleResponses,
      isActive: p.isActive, isDefault: p.isDefault,
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
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        const d = await res.json()
        setPersonas(prev => [...prev, d.persona])
        setSelected(d.persona)
        setIsNew(false)
        setRightTab('overview')
      } else if (selected) {
        const res = await fetch(`/api/personas/${selected.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
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
    if (selected?.id === id) { setSelected(null); setIsNew(false) }
  }

  function field(key: keyof PersonaForm, label: string, type: 'text' | 'textarea' = 'text') {
    const val = form[key] as string
    return (
      <div key={key}>
        <label className={labelCls}>{label}</label>
        {type === 'textarea' ? (
          <textarea value={val} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            rows={4} className={inputCls} style={{ resize: 'vertical' }} />
        ) : (
          <input type="text" value={val} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputCls} />
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
      <div className="space-y-5">
        {/* 히어로 카드 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#0f1011] p-6">
          <div className="flex items-start gap-5">
            {/* 이모지 뱃지 */}
            <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-[#1E293B]/10 dark:bg-[#1E293B]/15">
              {design.icon}
            </div>

            {/* 이름/상태 */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-[#f7f8f8]">{selected.name}</h2>
                {selected.isActive && (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    활성 중
                  </span>
                )}
                {selected.isDefault && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-[#d0d6e0]">디폴트</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-[#1E293B]/10 text-[#1E293B] dark:text-[#334155]">
                  {selected.tone}
                </span>
                <span className="text-xs text-slate-500 dark:text-[#8a8f98]">{selected.speakingStyle}</span>
                <span className="text-xs text-slate-400 dark:text-[#8a8f98]">·</span>
                <span className="text-xs text-slate-500 dark:text-[#8a8f98]">{selected.responseLength} 응답</span>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => activate(selected.id)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-[#1E293B] hover:bg-[#334155] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {selected.isActive ? <><Check className="h-3.5 w-3.5" /> 활성</> : <><Zap className="h-3.5 w-3.5" /> 활성화</>}
              </button>
              {!selected.isDefault && (
                <button
                  onClick={() => remove(selected.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {selected.description && (
            <p className="mt-4 text-sm text-slate-700 dark:text-[#d0d6e0] leading-relaxed border-t border-slate-100 dark:border-white/8 pt-4">
              {selected.description}
            </p>
          )}
        </div>

        {/* 특성 그리드 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#0f1011] p-5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-5 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> 특성
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <TraitBar label="격식도" value={selected.formalityLevel} />
            <TraitBar label="공감도" value={selected.empathyLevel} />
            <TraitBar label="유머" value={selected.humorLevel} />
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-slate-600 dark:text-[#d0d6e0]">응답 길이</span>
                <span className="text-xs font-bold text-[#1E293B] dark:text-[#334155]">{selected.responseLength}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
                <div className="h-full rounded-full bg-[#1E293B] transition-all duration-700" style={{
                  width: selected.responseLength === 'short' ? '33%' : selected.responseLength === 'medium' ? '66%' : '100%',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* 허용/금지 행동 */}
        {(selected.allowedBehaviors?.length > 0 || selected.forbiddenBehaviors?.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {selected.allowedBehaviors?.length > 0 && (
              <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 p-4">
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">허용 행동</h4>
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
                <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-3">금지 행동</h4>
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
          <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-slate-50 dark:bg-[#0f1011] p-5">
            <h3 className="text-xs font-bold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-3">시스템 프롬프트 조각</h3>
            <pre className="text-xs text-slate-700 dark:text-[#d0d6e0] whitespace-pre-wrap font-mono leading-relaxed">
              {selected.promptFragment}
            </pre>
          </div>
        )}

        {/* 행동 정책 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#0f1011] p-5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-4">행동 정책</h3>
          <div className="space-y-3">
            {[
              { label: '기본 응답', value: selected.fallbackBehavior },
              { label: '거절', value: selected.refusalBehavior },
              { label: '명확화', value: selected.clarificationBehavior },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-3 py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                <span className="shrink-0 text-xs font-bold text-slate-400 dark:text-[#8a8f98] w-16 pt-0.5">{label}</span>
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
    const previewDesign = getPersonaDesign({ name: form.name, tone: form.tone })
    return (
      <div className="space-y-5">
        {/* 새 페르소나: 실시간 미리보기 */}
        {isNew && (
          <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#0f1011] p-5">
            <p className="text-xs font-bold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider mb-3">미리보기</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl bg-[#1E293B]/10 dark:bg-[#1E293B]/15">
                {previewDesign.icon}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-[#f7f8f8]">{form.name || '새 페르소나'}</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#1E293B]/10 text-[#1E293B] dark:text-[#334155]">
                  {form.tone}
                </span>
              </div>
            </div>
            {form.description && (
              <p className="mt-3 text-xs text-slate-600 dark:text-[#8a8f98] leading-relaxed line-clamp-2">{form.description}</p>
            )}
          </div>
        )}

        {/* 기본 정보 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#0f1011] p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider flex items-center gap-2">
            <Users2 className="h-3.5 w-3.5" /> 기본 정보
          </h2>
          {field('name', '이름')}
          {field('description', '설명')}
        </div>

        {/* 성격 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#0f1011] p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> 성격
          </h2>
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
                <select value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputCls}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}

            {(['formalityLevel', 'empathyLevel', 'humorLevel'] as const).map(key => {
              const labelMap = { formalityLevel: '격식도', empathyLevel: '공감도', humorLevel: '유머' }
              return (
                <div key={key}>
                  <label className={labelCls}>{labelMap[key]}: {form[key]}/5</label>
                  <input type="range" min="1" max="5" value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) }))}
                    className="w-full accent-slate-700 dark:accent-slate-600 mt-2" />
                </div>
              )
            })}
          </div>
        </div>

        {/* 시스템 프롬프트 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#0f1011] p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider">시스템 프롬프트</h2>
          {field('promptFragment', '프롬프트 조각 (시스템 프롬프트에 삽입됨)', 'textarea')}
        </div>

        {/* 행동 정책 */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#0f1011] p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider">행동 정책</h2>
          {field('fallbackBehavior', '기본 응답 정책')}
          {field('refusalBehavior', '거절 응답 정책')}
          {field('clarificationBehavior', '명확화 응답 정책')}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-56px)] bg-white dark:bg-[#08090a]">
      {/* ── 좌측 패널 ── */}
      <div className="flex flex-col w-72 shrink-0 border-r border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0d0f10]">
        {/* 헤더 */}
        <div className="px-4 py-4 border-b border-slate-200 dark:border-white/8">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-500/20 flex items-center justify-center">
                <Users2 className="h-3.5 w-3.5 text-[#334155]" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-[#f7f8f8]">페르소나 스튜디오</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-[#8a8f98] bg-slate-200 dark:bg-white/8 px-1.5 py-0.5 rounded">{personas.length}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#8a8f98] mt-1 ml-8">AI 어시스턴트의 성격을 정의하세요</p>
        </div>

        {/* 새로만들기 버튼 */}
        <div className="px-3 py-2.5 border-b border-slate-100 dark:border-white/5">
          <button
            onClick={startNew}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#1E293B]/15 hover:bg-[#1E293B]/25 border border-[#1E293B]/20 hover:border-[#1E293B]/40 px-3 py-2 text-xs font-semibold text-[#334155] transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> 새 페르소나 만들기
          </button>
        </div>

        {/* 페르소나 목록 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-[#8a8f98]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 dark:border-white/10 border-t-[#1E293B] mx-auto mb-2" />
              불러오는 중...
            </div>
          ) : (
            <>
              {defaultPersonas.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-[#8a8f98]/60 uppercase tracking-widest">기본 제공</span>
                  </div>
                  {defaultPersonas.map(p => <PersonaListItem key={p.id} p={p} selected={selected} onSelect={selectPersona} />)}
                </div>
              )}
              {customPersonas.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-[#8a8f98]/60 uppercase tracking-widest">커스텀</span>
                  </div>
                  {customPersonas.map(p => <PersonaListItem key={p.id} p={p} selected={selected} onSelect={selectPersona} />)}
                </div>
              )}
              {personas.length === 0 && (
                <div className="py-10 text-center text-xs text-slate-500 dark:text-[#8a8f98]">페르소나가 없습니다</div>
              )}
            </>
          )}
        </div>

        {/* 하단 현재 활성 페르소나 */}
        {activePersona && (
          <div className="border-t border-slate-200 dark:border-white/8 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[11px] text-slate-500 dark:text-[#8a8f98]">활성: <span className="text-slate-700 dark:text-[#d0d6e0] font-medium">{activePersona.name}</span></span>
            </div>
          </div>
        )}
      </div>

      {/* ── 우측 패널 ── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-[#08090a]">
        {!showEditor ? (
          /* 빈 상태 */
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E293B]/10 border border-[#1E293B]/20">
                <Users2 className="h-8 w-8 text-[#1E293B]" />
              </div>
              <p className="text-base font-semibold text-slate-900 dark:text-[#f7f8f8] mb-2">페르소나를 선택하세요</p>
              <p className="text-sm text-slate-500 dark:text-[#8a8f98] leading-relaxed">
                왼쪽에서 페르소나를 선택하거나 새로 만들어서 AI 어시스턴트의 성격을 설정하세요.
              </p>
              <button
                onClick={startNew}
                className="mt-5 flex items-center gap-2 mx-auto rounded-xl bg-[#1E293B] hover:bg-[#334155] px-5 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                <Plus className="h-4 w-4" /> 첫 페르소나 만들기
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* 탭 바 + 액션 버튼 */}
            <div className="flex items-center justify-between px-6 pt-5 border-b border-slate-200 dark:border-white/8 shrink-0 bg-white dark:bg-[#08090a]">
              <div className="flex gap-1">
                {!isNew && (
                  <TabButton active={rightTab === 'overview'} onClick={() => setRightTab('overview')}
                    icon={<Eye className="h-3.5 w-3.5" />} label="개요" />
                )}
                <TabButton active={rightTab === 'edit'} onClick={() => setRightTab('edit')}
                  icon={<Pencil className="h-3.5 w-3.5" />} label={isNew ? '새 페르소나' : '편집'} />
              </div>

              {rightTab === 'edit' && (
                <div className="pb-2.5">
                  <button onClick={save} disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold bg-[#1E293B] hover:bg-[#334155] text-white transition-colors disabled:opacity-50">
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
