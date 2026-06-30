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
            <span className="text-sm font-semibold text-slate-900">Personas</span>
            <span className="text-xs text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">
              {personas.length}
            </span>
          </div>
          <button
            onClick={startNew}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
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
                      Active
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
              <p className="text-sm text-slate-400">Select a persona or create a new one</p>
              {activePersona && (
                <p className="mt-2 text-xs text-emerald-600 font-medium">
                  Active: {activePersona.name}
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
                  {isNew ? 'New Persona' : form.name || 'Edit Persona'}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Configure personality, tone, and behavioral rules
                </p>
              </div>
              <div className="flex gap-2">
                {selected && !isNew && (
                  <>
                    <button
                      onClick={() => activate(selected.id)}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      {selected.isActive ? <><Check className="h-3.5 w-3.5" /> Active</> : <><Zap className="h-3.5 w-3.5" /> Activate</>}
                    </button>
                    <button
                      onClick={() => remove(selected.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </>
                )}
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-3">Basic Info</h2>
                {field('name', 'Name')}
                {field('description', 'Description')}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-3">Personality</h2>
                <div className="grid grid-cols-2 gap-4">
                  {(
                    [
                      ['tone', 'Tone', ['helpful', 'professional', 'friendly', 'analytical', 'motivational', 'precise']],
                      ['speakingStyle', 'Speaking Style', ['professional', 'conversational', 'formal', 'technical', 'coaching', 'academic']],
                      ['responseLength', 'Response Length', ['short', 'medium', 'long']],
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
                        {key === 'formalityLevel' ? 'Formality' : 'Empathy'}: {form[key]}/5
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
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-3">System Prompt</h2>
                {field('promptFragment', 'Prompt Fragment (injected into system prompt)', 'textarea')}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-3">Behavior Policies</h2>
                {field('fallbackBehavior', 'Fallback Behavior')}
                {field('refusalBehavior', 'Refusal Behavior')}
                {field('clarificationBehavior', 'Clarification Behavior')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
