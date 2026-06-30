'use client'

import { useState, useEffect } from 'react'
import { FlaskConical, Plus, Play, ChevronRight, X, Info } from 'lucide-react'
import type { PromptExperiment } from '@/types'

const isMock = process.env.NEXT_PUBLIC_LLM_PROVIDER === 'mock'

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  RUNNING: 'bg-amber-50 border border-amber-200 text-amber-700',
  COMPLETED: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none'

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<PromptExperiment[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<PromptExperiment | null>(null)
  const [newForm, setNewForm] = useState({
    name: '',
    description: '',
    promptA: '',
    promptB: '',
    testInputs: [''],
  })

  useEffect(() => {
    fetch('/api/prompt-experiments')
      .then(r => r.json())
      .then(d => {
        setExperiments(d.experiments || [])
        setLoading(false)
      })
  }, [])

  async function create() {
    const inputs = newForm.testInputs.filter(Boolean)
    const res = await fetch('/api/prompt-experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newForm, testInputs: inputs }),
    })
    const d = await res.json()
    setExperiments(prev => [d.experiment, ...prev])
    setShowNew(false)
    setNewForm({ name: '', description: '', promptA: '', promptB: '', testInputs: [''] })
  }

  async function runExperiment(id: string) {
    setRunning(id)
    try {
      const res = await fetch(`/api/prompt-experiments/${id}/run`, { method: 'POST' })
      const d = await res.json()
      setExperiments(prev => prev.map(e => (e.id === d.experiment.id ? d.experiment : e)))
      if (selected?.id === id) setSelected(d.experiment)
    } finally {
      setRunning(null)
    }
  }

  async function viewResults(exp: PromptExperiment) {
    const res = await fetch(`/api/prompt-experiments/${exp.id}`)
    const d = await res.json()
    setSelected(d.experiment)
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-5 w-5 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Prompt Experiments</h1>
              <p className="text-sm text-slate-500">A/B test system prompts with automated evaluation</p>
            </div>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> New Experiment
          </button>
        </div>

        {/* Mock mode notice */}
        {isMock && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
            <p>
              현재 <strong>Mock 모드</strong>로 실행 중입니다. 실험 실행은 가능하지만 결과 점수가 임의값이라 의미있는 비교가 어렵습니다.
              실제 LLM API 키를 설정하면 정확한 A/B 비교가 가능합니다.
            </p>
          </div>
        )}

        {/* New experiment form */}
        {showNew && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-semibold text-slate-900">New Experiment</span>
              <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600 transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                  <input type="text" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                  <input type="text" value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prompt A (System)</label>
                  <textarea value={newForm.promptA} onChange={e => setNewForm(f => ({ ...f, promptA: e.target.value }))} rows={4}
                    placeholder="You are a helpful assistant..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white"
                    style={{ resize: 'vertical' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prompt B (System)</label>
                  <textarea value={newForm.promptB} onChange={e => setNewForm(f => ({ ...f, promptB: e.target.value }))} rows={4}
                    placeholder="You are an expert assistant..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white"
                    style={{ resize: 'vertical' }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Test Inputs ({newForm.testInputs.length})
                </label>
                {newForm.testInputs.map((inp, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="text" value={inp}
                      onChange={e => setNewForm(f => ({ ...f, testInputs: f.testInputs.map((v, j) => j === i ? e.target.value : v) }))}
                      placeholder={`Test input ${i + 1}`}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white" />
                    {newForm.testInputs.length > 1 && (
                      <button onClick={() => setNewForm(f => ({ ...f, testInputs: f.testInputs.filter((_, j) => j !== i) }))}
                        className="text-slate-400 hover:text-slate-600 transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setNewForm(f => ({ ...f, testInputs: [...f.testInputs, ''] }))}
                  className="text-indigo-600 hover:text-indigo-700 text-sm transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  + Add input
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNew(false)} className="rounded-xl border border-slate-200 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer" style={{ backgroundColor: '#fff' }}>
                  Cancel
                </button>
                <button onClick={create} className="rounded-xl px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer" style={{ border: 'none' }}>
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Experiment list */}
        {loading ? (
          <div className="text-center py-10 text-sm text-slate-400">Loading...</div>
        ) : experiments.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-slate-100 bg-white shadow-sm">
            <FlaskConical className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">No experiments yet. Create your first A/B test.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            {experiments.map((exp, idx) => {
              const badgeCls = STATUS_BADGE[exp.status as keyof typeof STATUS_BADGE] ?? STATUS_BADGE.DRAFT
              return (
                <div key={exp.id} className={`px-5 py-4 hover:bg-slate-50 transition-colors ${idx < experiments.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-sm font-semibold text-slate-900">{exp.name}</span>
                        {exp.description && (
                          <span className="text-xs text-slate-400 ml-2">{exp.description}</span>
                        )}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${badgeCls}`}>
                        {exp.status}
                      </span>
                      {exp.winner && (
                        <span className="text-[10px] rounded-full border border-indigo-100 bg-indigo-50 text-indigo-700 px-2 py-0.5">
                          Winner: Prompt {exp.winner}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {exp.status === 'DRAFT' && (
                        <button
                          onClick={() => runExperiment(exp.id)}
                          disabled={running === exp.id}
                          className="flex items-center gap-1 rounded-xl px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                          style={{ border: 'none' }}
                        >
                          <Play className="h-3 w-3" />
                          {running === exp.id ? 'Running...' : 'Run'}
                        </button>
                      )}
                      {exp.status === 'COMPLETED' && (
                        <button
                          onClick={() => viewResults(exp)}
                          className="flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          Results <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-400">
                    {(exp.testInputs as string[]).length} test input{(exp.testInputs as string[]).length !== 1 ? 's' : ''} ·{' '}
                    {new Date(exp.createdAt).toLocaleDateString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Results panel */}
        {selected && selected.results && selected.results.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-semibold text-slate-900">Results: {selected.name}</span>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              {selected.results.map((result, i) => (
                <div key={result.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 mb-2">Input {i + 1}: {result.input.slice(0, 80)}...</div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Score bar A */}
                    <div className={`p-3 rounded-xl border ${result.preferredByEvaluator === 'A' ? 'border-indigo-200 bg-indigo-50' : 'border-slate-100 bg-white'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${result.preferredByEvaluator === 'A' ? 'text-indigo-700' : 'text-slate-500'}`}>
                          Prompt A {result.preferredByEvaluator === 'A' ? '· Winner' : ''}
                        </span>
                        <span className="text-xs text-slate-400">{(result.scoreA * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${result.scoreA * 100}%` }} />
                      </div>
                      <div className="text-xs text-slate-500 leading-relaxed">{result.outputA.slice(0, 200)}...</div>
                    </div>
                    {/* Score bar B */}
                    <div className={`p-3 rounded-xl border ${result.preferredByEvaluator === 'B' ? 'border-indigo-200 bg-indigo-50' : 'border-slate-100 bg-white'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${result.preferredByEvaluator === 'B' ? 'text-indigo-700' : 'text-slate-500'}`}>
                          Prompt B {result.preferredByEvaluator === 'B' ? '· Winner' : ''}
                        </span>
                        <span className="text-xs text-slate-400">{(result.scoreB * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${result.scoreB * 100}%` }} />
                      </div>
                      <div className="text-xs text-slate-500 leading-relaxed">{result.outputB.slice(0, 200)}...</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
