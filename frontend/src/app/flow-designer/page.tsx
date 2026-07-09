'use client'

import { useState, useEffect } from 'react'
import { GitBranch, Plus, Save, Trash2, Zap, Check, Play, X, ChevronDown, ChevronRight, Globe, Code, Briefcase, BookOpen, FlaskConical, GraduationCap } from 'lucide-react'
import type { ConversationFlow, ConversationFlowStep } from '@/types'

// ── 도메인 디자인 매핑 ──────────────────────────────────────────────────────

interface DomainDesign {
  icon: React.ReactNode
  color: string
  label: string
}

function getDomainDesign(domain: string): DomainDesign {
  const map: Record<string, DomainDesign> = {
    general: { icon: <Globe className="h-3.5 w-3.5" />, color: '#1E293B', label: '일반' },
    technology: { icon: <Code className="h-3.5 w-3.5" />, color: '#8b5cf6', label: '기술' },
    business: { icon: <Briefcase className="h-3.5 w-3.5" />, color: '#f59e0b', label: '비즈니스' },
    career: { icon: <GraduationCap className="h-3.5 w-3.5" />, color: '#10b981', label: '커리어' },
    education: { icon: <BookOpen className="h-3.5 w-3.5" />, color: '#06b6d4', label: '교육' },
    science: { icon: <FlaskConical className="h-3.5 w-3.5" />, color: '#ec4899', label: '과학' },
  }
  return map[domain] ?? { icon: <Globe className="h-3.5 w-3.5" />, color: '#1E293B', label: domain }
}

// ── 기본값 ───────────────────────────────────────────────────────────────────

const EMPTY_STEP: Omit<ConversationFlowStep, 'id'> = {
  name: '',
  triggerKeywords: [],
  instruction: '',
  searchPolicy: 'auto',
}

const EMPTY_FLOW = {
  name: '',
  description: '',
  domain: 'general',
  triggerCondition: '',
  fallbackPolicy: '도움이 되는 응답을 제공하겠습니다.',
  clarificationPolicy: '좀 더 자세히 설명해 주시겠어요?',
  errorRecoveryPolicy: '다른 방법으로 시도해 보겠습니다.',
  searchPolicy: 'auto',
  steps: [] as ConversationFlowStep[],
  isActive: false,
}

type FlowForm = typeof EMPTY_FLOW

const inputCls =
  'w-full rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#21262d] px-3 py-2.5 text-sm text-slate-900 dark:text-[#f7f8f8] placeholder:text-slate-400 dark:placeholder:text-[#8a8f98] focus:border-slate-200 dark:focus:border-[#1E293B]/60 focus:bg-white dark:focus:bg-[#21262d] focus:ring-2 focus:ring-slate-100 dark:focus:ring-[#1E293B]/15 outline-none transition-colors'

const inputSmCls =
  'w-full rounded-lg border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#21262d] px-3 py-2 text-sm text-slate-900 dark:text-[#f7f8f8] placeholder:text-slate-400 dark:placeholder:text-[#8a8f98] focus:border-slate-200 dark:focus:border-[#1E293B]/60 focus:bg-white dark:focus:bg-[#21262d] outline-none transition-colors'

const labelCls = 'block mb-1.5 text-xs font-bold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider'

export default function FlowDesignerPage() {
  const [flows, setFlows] = useState<ConversationFlow[]>([])
  const [selected, setSelected] = useState<ConversationFlow | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FlowForm>(EMPTY_FLOW)
  const [simInput, setSimInput] = useState('')
  const [simResult, setSimResult] = useState<{ matchedStep: ConversationFlowStep | null; instruction: string } | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [editingStep, setEditingStep] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/flows')
      .then(r => r.json())
      .then(d => {
        setFlows(d.flows || [])
        setLoading(false)
      })
  }, [])

  function selectFlow(f: ConversationFlow) {
    setSelected(f)
    setIsNew(false)
    setForm({
      name: f.name, description: f.description, domain: f.domain,
      triggerCondition: f.triggerCondition, fallbackPolicy: f.fallbackPolicy,
      clarificationPolicy: f.clarificationPolicy, errorRecoveryPolicy: f.errorRecoveryPolicy,
      searchPolicy: f.searchPolicy, steps: f.steps, isActive: f.isActive,
    })
    setSimResult(null)
    setEditingStep(null)
  }

  function startNew() {
    setSelected(null)
    setIsNew(true)
    setForm(EMPTY_FLOW)
    setSimResult(null)
    setEditingStep(null)
  }

  async function save() {
    setSaving(true)
    try {
      if (isNew) {
        const res = await fetch('/api/flows', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        const d = await res.json()
        setFlows(prev => [...prev, d.flow])
        setSelected(d.flow)
        setIsNew(false)
      } else if (selected) {
        const res = await fetch(`/api/flows/${selected.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        const d = await res.json()
        setFlows(prev => prev.map(f => (f.id === d.flow.id ? d.flow : f)))
        setSelected(d.flow)
      }
    } finally {
      setSaving(false)
    }
  }

  async function activate(id: string) {
    await fetch(`/api/flows/${id}/activate`, { method: 'POST' })
    const r = await fetch('/api/flows')
    const d = await r.json()
    setFlows(d.flows || [])
    if (selected) {
      const updated = (d.flows as ConversationFlow[]).find(f => f.id === selected.id)
      if (updated) setSelected(updated)
    }
  }

  async function remove(id: string) {
    await fetch(`/api/flows/${id}`, { method: 'DELETE' })
    setFlows(prev => prev.filter(f => f.id !== id))
    if (selected?.id === id) { setSelected(null); setIsNew(false) }
  }

  async function simulate() {
    if (!simInput.trim() || (!selected && !isNew)) return
    setSimulating(true)
    try {
      const res = await fetch('/api/flows/simulate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: simInput, flowId: selected?.id }),
      })
      const d = await res.json()
      setSimResult(d.result)
    } finally {
      setSimulating(false)
    }
  }

  function addStep() {
    const newStep: ConversationFlowStep = { ...EMPTY_STEP, id: `step_${Date.now()}` }
    setForm(f => ({ ...f, steps: [...f.steps, newStep] }))
    setEditingStep(form.steps.length)
  }

  function updateStep(index: number, updates: Partial<ConversationFlowStep>) {
    setForm(f => ({ ...f, steps: f.steps.map((s, i) => (i === index ? { ...s, ...updates } : s)) }))
  }

  function removeStep(index: number) {
    setForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== index) }))
    if (editingStep === index) setEditingStep(null)
  }

  const showEditor = selected !== null || isNew
  const domainDesign = getDomainDesign(form.domain)

  return (
    <div className="flex h-[calc(100vh-56px)] bg-white dark:bg-[#08090a]">
      {/* ── 좌측 패널 ── */}
      <div className="flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0d0f10]">
        {/* 헤더 */}
        <div className="px-4 py-4 border-b border-slate-200 dark:border-white/8">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#1E293B]/20 flex items-center justify-center">
                <GitBranch className="h-3.5 w-3.5 text-[#334155]" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-[#f7f8f8]">플로우 디자이너</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-[#8a8f98] bg-slate-200 dark:bg-white/8 px-1.5 py-0.5 rounded">{flows.length}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#8a8f98] mt-1 ml-8">대화 흐름과 분기를 설계하세요</p>
        </div>

        {/* 새로만들기 버튼 */}
        <div className="px-3 py-2.5 border-b border-slate-100 dark:border-white/5">
          <button
            onClick={startNew}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#1E293B]/15 hover:bg-[#1E293B]/25 border border-[#1E293B]/20 hover:border-[#1E293B]/40 px-3 py-2 text-xs font-semibold text-[#334155] transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> 새 플로우 만들기
          </button>
        </div>

        {/* 플로우 목록 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-[#8a8f98]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 dark:border-white/10 border-t-[#1E293B] mx-auto mb-2" />
              불러오는 중...
            </div>
          ) : flows.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-[#8a8f98] px-4 leading-relaxed">
              아직 플로우가 없습니다.<br />첫 번째 플로우를 만들어보세요.
            </div>
          ) : (
            flows.map(f => {
              const dd = getDomainDesign(f.domain)
              const isSelected = selected?.id === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => selectFlow(f)}
                  className={`w-full text-left px-3 py-3.5 border-b border-slate-100 dark:border-white/5 transition-all relative
                    ${isSelected ? 'bg-slate-100 dark:bg-[#1c1f26]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'}`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-r-full bg-[#1E293B]" />
                  )}
                  <div className="pl-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-slate-900 dark:text-[#f7f8f8]' : 'text-slate-600 dark:text-[#d0d6e0]'}`}>{f.name}</span>
                      {f.isActive && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/50">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          활성
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#1E293B]/10 text-[#334155]">
                        {dd.icon}{dd.label}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-[#8a8f98]">{f.steps.length}단계</span>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── 우측 패널 ── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-[#08090a]">
        {!showEditor ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E293B]/10 border border-[#1E293B]/20">
                <GitBranch className="h-8 w-8 text-[#1E293B]" />
              </div>
              <p className="text-base font-semibold text-slate-900 dark:text-[#f7f8f8] mb-2">플로우를 선택하세요</p>
              <p className="text-sm text-slate-500 dark:text-[#8a8f98] leading-relaxed">
                왼쪽에서 플로우를 선택하거나 새로 만들어서 대화 흐름을 설계하세요.
              </p>
              <button
                onClick={startNew}
                className="mt-5 flex items-center gap-2 mx-auto rounded-xl bg-[#1E293B] hover:bg-[#334155] px-5 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                <Plus className="h-4 w-4" /> 첫 플로우 만들기
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* 상단 헤더 */}
            <div className="shrink-0 px-6 py-5 border-b border-slate-200 dark:border-white/8 bg-white dark:bg-[#08090a]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg bg-[#1E293B]/10 text-[#334155]">
                      {domainDesign.icon} {domainDesign.label}
                    </span>
                    {(selected?.isActive) && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        활성 중
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-[#f7f8f8]">{isNew ? '새 플로우' : form.name || '플로우 편집'}</h1>
                  <p className="text-xs text-slate-500 dark:text-[#8a8f98] mt-1">{form.steps.length}개 단계 · {form.searchPolicy} 검색</p>
                </div>
                <div className="flex gap-2">
                  {selected && !isNew && (
                    <>
                      <button
                        onClick={() => activate(selected.id)}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-[#1E293B] hover:bg-[#334155] transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {selected.isActive ? <><Check className="h-3.5 w-3.5" /> 활성</> : <><Zap className="h-3.5 w-3.5" /> 활성화</>}
                      </button>
                      <button onClick={() => remove(selected.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-red-900/50 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/30 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button onClick={save} disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold bg-[#1E293B] hover:bg-[#334155] text-white disabled:opacity-50 transition-colors">
                    <Save className="h-3.5 w-3.5" /> {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            </div>

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5 max-w-3xl">
                {/* 기본 정보 */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#0f1011] p-5 space-y-4">
                  <h2 className={labelCls}>기본 정보</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={labelCls}>이름</label>
                      <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="예: 기술 지원 플로우" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>설명</label>
                      <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="이 플로우의 목적을 설명하세요" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>트리거 조건</label>
                      <input type="text" value={form.triggerCondition} onChange={e => setForm(f => ({ ...f, triggerCondition: e.target.value }))}
                        placeholder="예: 기술 문제나 오류 메시지 관련 질문" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>도메인</label>
                        <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} className={inputCls}>
                          {[
                            ['general', '일반'], ['technology', '기술'], ['business', '비즈니스'],
                            ['career', '커리어'], ['education', '교육'], ['science', '과학']
                          ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>검색 정책</label>
                        <select value={form.searchPolicy} onChange={e => setForm(f => ({ ...f, searchPolicy: e.target.value }))} className={inputCls}>
                          {[['auto', '자동'], ['always', '항상'], ['never', '사용 안 함']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>기본 응답 정책</label>
                      <textarea value={form.fallbackPolicy} onChange={e => setForm(f => ({ ...f, fallbackPolicy: e.target.value }))}
                        rows={2} className={inputCls} style={{ resize: 'vertical' }} />
                    </div>
                  </div>
                </div>

                {/* 대화 단계 */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#0f1011] p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className={`${labelCls} mb-0.5`}>대화 단계</h2>
                      <p className="text-[11px] text-slate-500 dark:text-[#8a8f98]">트리거 키워드에 따라 적절한 단계가 실행됩니다</p>
                    </div>
                    <button onClick={addStep}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/8 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-[#d0d6e0] transition-all">
                      <Plus className="h-3.5 w-3.5" /> 단계 추가
                    </button>
                  </div>

                  {form.steps.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 py-10 text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <GitBranch className="h-5 w-5 text-slate-500 dark:text-[#8a8f98]" />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-[#8a8f98] mb-1">단계가 없습니다</p>
                      <p className="text-xs text-slate-400 dark:text-[#8a8f98]/60">대화 분기를 정의하려면 단계를 추가하세요</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* 왼쪽 연결선 */}
                      {form.steps.length > 1 && (
                        <div className="absolute left-[19px] top-9 bottom-9 w-px bg-slate-200 dark:bg-white/8" />
                      )}
                      <div className="space-y-3">
                        {form.steps.map((step, i) => {
                          const isEditing = editingStep === i
                          return (
                            <div key={step.id} className="relative flex gap-3">
                              {/* 스텝 번호 원 */}
                              <div className="shrink-0 relative z-10">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                                    ${isEditing
                                      ? 'bg-[#1E293B] border-[#1E293B] text-white'
                                      : 'bg-slate-100 dark:bg-[#1c1f26] border-slate-300 dark:border-white/15 text-slate-500 dark:text-[#8a8f98]'
                                    }`}
                                >
                                  {i + 1}
                                </div>
                              </div>

                              {/* 스텝 카드 */}
                              <div className={`flex-1 rounded-xl border transition-all overflow-hidden
                                ${isEditing ? 'border-[#1E293B]/40 bg-[#1E293B]/5' : 'border-slate-200 dark:border-white/8 bg-white dark:bg-[#191a1b]'}`}>
                                {/* 스텝 헤더 */}
                                <div
                                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors`}
                                  onClick={() => setEditingStep(isEditing ? null : i)}
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-600 dark:text-[#d0d6e0] truncate">
                                      {step.name || `단계 ${i + 1}`}
                                    </p>
                                    {step.triggerKeywords.length > 0 && (
                                      <div className="flex gap-1 mt-1 flex-wrap">
                                        {step.triggerKeywords.slice(0, 3).map(kw => (
                                          <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/8 text-slate-500 dark:text-[#8a8f98]">{kw}</span>
                                        ))}
                                        {step.triggerKeywords.length > 3 && (
                                          <span className="text-[10px] text-slate-500 dark:text-[#8a8f98]">+{step.triggerKeywords.length - 3}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 ml-3">
                                    <button onClick={e => { e.stopPropagation(); removeStep(i) }}
                                      className="text-slate-400 dark:text-[#8a8f98] hover:text-red-400 transition-colors p-1 rounded hover:bg-red-950/30">
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                    {isEditing
                                      ? <ChevronDown className="h-4 w-4 text-[#1E293B]" />
                                      : <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8a8f98]" />
                                    }
                                  </div>
                                </div>

                                {/* 스텝 편집 영역 */}
                                {isEditing && (
                                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-200 dark:border-white/8">
                                    <div>
                                      <label className={labelCls}>단계 이름</label>
                                      <input type="text" value={step.name} placeholder="예: 오류 진단"
                                        onChange={e => updateStep(i, { name: e.target.value })} className={inputSmCls} />
                                    </div>
                                    <div>
                                      <label className={labelCls}>트리거 키워드 (쉼표로 구분)</label>
                                      <input type="text" value={step.triggerKeywords.join(', ')}
                                        placeholder="예: 오류, 에러, error, bug"
                                        onChange={e => updateStep(i, { triggerKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                                        className={inputSmCls} />
                                    </div>
                                    <div>
                                      <label className={labelCls}>지시사항</label>
                                      <textarea value={step.instruction} placeholder="이 단계에서 AI가 어떻게 행동해야 하는지..."
                                        onChange={e => updateStep(i, { instruction: e.target.value })} rows={3}
                                        className={inputSmCls} style={{ resize: 'vertical' }} />
                                    </div>
                                    <div>
                                      <label className={labelCls}>검색 정책</label>
                                      <select value={step.searchPolicy}
                                        onChange={e => updateStep(i, { searchPolicy: e.target.value as 'auto' | 'always' | 'never' })}
                                        className="rounded-lg border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#21262d] px-3 py-2 text-sm text-slate-900 dark:text-[#f7f8f8] outline-none focus:border-[#1E293B]/60">
                                        {[['auto', '자동'], ['always', '항상'], ['never', '사용 안 함']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 시뮬레이션 패널 */}
                {selected && (
                  <div className="rounded-2xl border border-[#1E293B]/25 bg-[#1E293B]/5 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-[#1E293B]/20 flex items-center justify-center">
                        <Play className="h-3.5 w-3.5 text-[#334155]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-[#f7f8f8]">플로우 시뮬레이션</p>
                        <p className="text-[11px] text-slate-500 dark:text-[#8a8f98]">입력 메시지로 어떤 단계가 실행될지 확인하세요</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={simInput}
                        onChange={e => setSimInput(e.target.value)}
                        placeholder="테스트 메시지를 입력하세요..."
                        onKeyDown={e => e.key === 'Enter' && simulate()}
                        className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191a1b] px-3 py-2.5 text-sm text-slate-900 dark:text-[#f7f8f8] placeholder:text-slate-400 dark:placeholder:text-[#8a8f98] outline-none focus:border-[#1E293B]/60"
                      />
                      <button
                        onClick={simulate} disabled={simulating}
                        className="rounded-xl px-4 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        {simulating ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                        실행
                      </button>
                    </div>
                    {simResult && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 dark:text-[#8a8f98]">일치 단계:</span>
                          <span className={`font-semibold ${simResult.matchedStep ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {simResult.matchedStep?.name ?? '없음 (기본 응답 사용)'}
                          </span>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#191a1b] p-3 text-sm text-slate-600 dark:text-[#d0d6e0] font-mono leading-relaxed">
                          {simResult.instruction}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
