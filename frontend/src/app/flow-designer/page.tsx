'use client'

import { useState, useEffect } from 'react'
import { GitBranch, Plus, Save, Trash2, Zap, Check, Play, X } from 'lucide-react'
import type { ConversationFlow, ConversationFlowStep } from '@/types'

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
  fallbackPolicy: 'Provide a helpful response.',
  clarificationPolicy: 'Could you clarify what you mean?',
  errorRecoveryPolicy: 'Let me try a different approach.',
  searchPolicy: 'auto',
  steps: [] as ConversationFlowStep[],
  isActive: false,
}

type FlowForm = typeof EMPTY_FLOW

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none'

const inputSmCls =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white outline-none'

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
  }

  function startNew() {
    setSelected(null)
    setIsNew(true)
    setForm(EMPTY_FLOW)
    setSimResult(null)
  }

  async function save() {
    setSaving(true)
    try {
      if (isNew) {
        const res = await fetch('/api/flows', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const d = await res.json()
        setFlows(prev => [...prev, d.flow])
        setSelected(d.flow)
        setIsNew(false)
      } else if (selected) {
        const res = await fetch(`/api/flows/${selected.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
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

  return (
    <div className="flex h-[calc(100vh-56px)] bg-slate-50">
      {/* Left panel */}
      <div className="flex flex-col w-64 shrink-0 border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-slate-900">Flows</span>
            <span className="text-xs text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">{flows.length}</span>
          </div>
          <button onClick={startNew} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
          ) : flows.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No flows yet. Create your first flow.</div>
          ) : (
            flows.map(f => (
              <button
                key={f.id}
                onClick={() => selectFlow(f)}
                className={`w-full text-left px-3 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors ${selected?.id === f.id ? 'bg-indigo-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm font-medium ${selected?.id === f.id ? 'text-indigo-700' : 'text-slate-700'}`}>{f.name}</span>
                  {f.isActive && (
                    <span className="rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] px-1.5 py-0.5">Active</span>
                  )}
                </div>
                <span className="text-xs text-slate-400">{f.domain} · {f.steps.length} steps</span>
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
                <GitBranch className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">Select a flow or create a new one</p>
            </div>
          </div>
        ) : (
          <div className="p-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{isNew ? 'New Flow' : form.name || 'Edit Flow'}</h1>
                <p className="text-sm text-slate-500 mt-0.5">Define trigger conditions and conversation steps</p>
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
                    <button onClick={() => remove(selected.id)} className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </>
                )}
                <button
                  onClick={save} disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Basic Info</h2>
                {(['name', 'description', 'triggerCondition'] as const).map(key => (
                  <div key={key}>
                    <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {key === 'triggerCondition' ? 'Trigger Condition' : key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <input type="text" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputCls} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Domain</label>
                    <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} className={inputCls}>
                      {['general', 'technology', 'business', 'career', 'education', 'science'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Search Policy</label>
                    <select value={form.searchPolicy} onChange={e => setForm(f => ({ ...f, searchPolicy: e.target.value }))} className={inputCls}>
                      {['auto', 'always', 'never'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fallback Policy</label>
                  <textarea value={form.fallbackPolicy} onChange={e => setForm(f => ({ ...f, fallbackPolicy: e.target.value }))} rows={2}
                    className={inputCls} style={{ resize: 'vertical' }} />
                </div>
              </div>

              {/* Steps */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Steps ({form.steps.length})
                  </h2>
                  <button onClick={addStep} className="flex items-center gap-1 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 px-2 py-1 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add Step
                  </button>
                </div>

                {form.steps.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                    No steps yet. Add steps to define conversation branches.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.steps.map((step, i) => (
                      <div key={step.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                        <div
                          className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors ${editingStep === i ? 'bg-slate-50' : ''}`}
                          onClick={() => setEditingStep(editingStep === i ? null : i)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="rounded border border-slate-200 bg-slate-50 text-xs font-mono text-slate-500 px-1.5 py-0.5">{i + 1}</span>
                            <span className="text-sm font-medium text-slate-700">{step.name || `Step ${i + 1}`}</span>
                            <span className="text-xs text-slate-400">{step.triggerKeywords.join(', ') || 'no keywords'}</span>
                          </div>
                          <button onClick={e => { e.stopPropagation(); removeStep(i) }} className="text-slate-300 hover:text-red-500 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {editingStep === i && (
                          <div className="p-3 space-y-3 border-t border-slate-100 bg-slate-50">
                            <div>
                              <label className="block mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Step Name</label>
                              <input type="text" value={step.name} onChange={e => updateStep(i, { name: e.target.value })} className={inputSmCls} />
                            </div>
                            <div>
                              <label className="block mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trigger Keywords (comma-separated)</label>
                              <input type="text" value={step.triggerKeywords.join(', ')}
                                onChange={e => updateStep(i, { triggerKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                                className={inputSmCls} />
                            </div>
                            <div>
                              <label className="block mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Instruction</label>
                              <textarea value={step.instruction} onChange={e => updateStep(i, { instruction: e.target.value })} rows={2}
                                className={inputSmCls} style={{ resize: 'vertical' }} />
                            </div>
                            <div>
                              <label className="block mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Search Policy</label>
                              <select value={step.searchPolicy} onChange={e => updateStep(i, { searchPolicy: e.target.value as 'auto' | 'always' | 'never' })}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-300">
                                {['auto', 'always', 'never'].map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Simulation panel */}
              {selected && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-900">Simulate</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={simInput}
                      onChange={e => setSimInput(e.target.value)}
                      placeholder="Type a message to test this flow..."
                      onKeyDown={e => e.key === 'Enter' && simulate()}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                    />
                    <button
                      onClick={simulate} disabled={simulating}
                      className="rounded-xl px-4 py-2 bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {simulating ? '...' : 'Run'}
                    </button>
                  </div>
                  {simResult && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-slate-500">
                        Matched step:{' '}
                        <span className={simResult.matchedStep ? 'text-emerald-700 font-medium' : 'text-red-500'}>
                          {simResult.matchedStep?.name ?? 'None (using fallback)'}
                        </span>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
                        {simResult.instruction}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
