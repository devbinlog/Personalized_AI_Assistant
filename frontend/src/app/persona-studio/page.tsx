'use client'

import { useState, useEffect } from 'react'
import { Users2, Plus, Zap, Check, Trash2, Save } from 'lucide-react'
import type { Persona } from '@/types'

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

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none'

export default function PersonaStudioPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selected, setSelected] = useState<Persona | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<PersonaForm>(EMPTY_FORM)

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
        <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
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

  return (
    <div className="flex h-[calc(100vh-56px)] bg-slate-50">
      {/* Left panel */}
      <div className="flex flex-col w-64 shrink-0 border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users2 className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-slate-900">페르소나</span>
            <span className="text-xs text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">
              {personas.length}
            </span>
          </div>
          <button
            onClick={startNew}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> 새로만들기
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">불러오는 중...</div>
          ) : (
            personas.map(p => (
              <button
                key={p.id}
                onClick={() => selectPersona(p)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${selected?.id === p.id ? 'bg-indigo-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm font-medium ${selected?.id === p.id ? 'text-indigo-700' : 'text-slate-700'}`}>{p.name}</span>
                  {p.isActive && (
                    <span className="rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] px-1.5 py-0.5">
                      활성
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">{p.tone} · {p.speakingStyle}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-white">
        {!showEditor ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
                <Users2 className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">페르소나를 선택하거나 새로 만드세요</p>
              {activePersona && (
                <p className="mt-2 text-xs text-emerald-600 font-medium">
                  활성: {activePersona.name}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 max-w-2xl">
            {/* Editor header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {isNew ? '새 페르소나' : form.name || '페르소나 편집'}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  성격, 어조, 행동 규칙을 설정하세요
                </p>
              </div>
              <div className="flex gap-2">
                {selected && !isNew && (
                  <>
                    <button
                      onClick={() => activate(selected.id)}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      {selected.isActive ? <><Check className="h-3.5 w-3.5" /> 활성</> : <><Zap className="h-3.5 w-3.5" /> 활성화</>}
                    </button>
                    <button
                      onClick={() => remove(selected.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> 삭제
                    </button>
                  </>
                )}
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" /> {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-3">기본 정보</h2>
                {field('name', '이름')}
                {field('description', '설명')}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-3">성격</h2>
                <div className="grid grid-cols-2 gap-4">
                  {(
                    [
                      ['tone', '어조', ['helpful', 'professional', 'friendly', 'analytical', 'motivational', 'precise']],
                      ['speakingStyle', '말하기 스타일', ['professional', 'conversational', 'formal', 'technical', 'coaching', 'academic']],
                      ['responseLength', '응답 길이', ['short', 'medium', 'long']],
                    ] as const
                  ).map(([key, label, opts]) => (
                    <div key={key}>
                      <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
                      <select
                        value={form[key] as string}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className={inputCls}
                      >
                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}

                  {(['formalityLevel', 'empathyLevel'] as const).map(key => (
                    <div key={key}>
                      <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {key === 'formalityLevel' ? '격식도' : '공감도'}: {form[key]}/5
                      </label>
                      <input
                        type="range" min="1" max="5"
                        value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) }))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-3">시스템 프롬프트</h2>
                {field('promptFragment', '프롬프트 조각 (시스템 프롬프트에 삽입됨)', 'textarea')}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-3">행동 정책</h2>
                {field('fallbackBehavior', '기본 응답 정책')}
                {field('refusalBehavior', '거절 응답 정책')}
                {field('clarificationBehavior', '명확화 응답 정책')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
