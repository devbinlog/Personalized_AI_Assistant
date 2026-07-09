'use client'

import { useState, useEffect } from 'react'
import { FlaskConical, Plus, Play, ChevronRight, X, Info, Loader2, CheckCircle2 } from 'lucide-react'
import type { PromptExperiment } from '@/types'

const isMock = process.env.NEXT_PUBLIC_LLM_PROVIDER === 'mock'

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-[#8a8f98]',
  RUNNING: 'bg-slate-50 border border-slate-200 text-slate-600 dark:bg-white/5 dark:border-white/10 dark:text-[#d0d6e0]',
  COMPLETED: 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-400',
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '대기',
  RUNNING: '실행 중',
  COMPLETED: '완료',
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none dark:border-white/8 dark:bg-[#28282c] dark:text-[#f7f8f8] dark:placeholder:text-[#8a8f98] dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/20 dark:focus:bg-[#28282c]'
const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 dark:text-[#8a8f98]'

type ProgressItem = {
  step: number
  total: number
  input: string
  outputA: string
  outputB: string
  scoreA: number
  scoreB: number
  preferred: string
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<PromptExperiment[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [progressTotal, setProgressTotal] = useState(0)
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
    setProgress([])
    setProgressTotal(0)
    setSelected(null)

    // mark as running in local state
    setExperiments(prev => prev.map(e => e.id === id ? { ...e, status: 'RUNNING' } : e))

    try {
      const res = await fetch(`/api/prompt-experiments/${id}/run`, { method: 'POST' })
      if (!res.body) return

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() ?? ''

        for (const chunk of chunks) {
          const line = chunk.trim()
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'progress') {
              setProgressTotal(event.total)
              setProgress(prev => [...prev, event as ProgressItem])
            } else if (event.type === 'complete') {
              setExperiments(prev => prev.map(e => e.id === id ? event.experiment : e))
              setSelected(event.experiment)
            }
          } catch {
            // malformed event
          }
        }
      }
    } finally {
      setRunning(null)
    }
  }

  async function viewResults(exp: PromptExperiment) {
    const res = await fetch(`/api/prompt-experiments/${exp.id}`)
    const d = await res.json()
    setSelected(d.experiment)
  }

  const runningExp = running ? experiments.find(e => e.id === running) : null

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#08090a]">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-5 w-5 text-indigo-600 dark:text-[#818cf8]" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f7f8f8]">프롬프트 실험</h1>
              <p className="text-sm text-slate-500 dark:text-[#8a8f98]">자동 평가를 통한 시스템 프롬프트 A/B 테스트</p>
            </div>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 bg-indigo-600 dark:bg-[#5e6ad2] text-white text-sm font-medium hover:bg-indigo-700 dark:hover:bg-[#6b77e0] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> 새 실험
          </button>
        </div>

        {/* Mock mode notice */}
        {isMock && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#191a1b] px-4 py-3 text-sm text-slate-700 dark:text-[#d0d6e0]">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-slate-600 dark:text-[#8a8f98]" />
            <p>
              현재 <strong>Mock 모드</strong>로 실행 중입니다. 실험 실행은 가능하지만 결과 점수가 임의값이라 의미있는 비교가 어렵습니다.
              실제 LLM API 키를 설정하면 정확한 A/B 비교가 가능합니다.
            </p>
          </div>
        )}

        {/* Live progress panel */}
        {running && (
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#191a1b] p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-[#818cf8]" />
              <span className="text-sm font-semibold text-slate-800 dark:text-[#f7f8f8]">
                {runningExp?.name} 실행 중
              </span>
              <span className="ml-auto text-xs text-slate-500 dark:text-[#8a8f98]">
                {progressTotal > 0 ? `${progress.length} / ${progressTotal} 완료` : '준비 중...'}
              </span>
            </div>

            {/* Progress bar */}
            {progressTotal > 0 && (
              <div className="h-1.5 bg-slate-100 dark:bg-white/8 rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 dark:bg-[#5e6ad2] rounded-full transition-all duration-500"
                  style={{ width: `${(progress.length / progressTotal) * 100}%` }}
                />
              </div>
            )}

            {/* Completed steps */}
            <div className="space-y-2">
              {progress.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-white dark:bg-[#191a1b] border border-slate-100 dark:border-white/8 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-600 dark:text-[#d0d6e0] truncate mb-1.5">{item.input}</div>
                    <div className="flex gap-3">
                      <div className={`flex items-center gap-1.5 ${item.preferred === 'A' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-400 dark:text-[#8a8f98]'}`}>
                        <span className="text-[10px] font-bold">A</span>
                        <div className="w-16 h-1 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${item.scoreA * 100}%` }} />
                        </div>
                        <span className="text-[10px]">{(item.scoreA * 100).toFixed(0)}%</span>
                        {item.preferred === 'A' && <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">승</span>}
                      </div>
                      <div className={`flex items-center gap-1.5 ${item.preferred === 'B' ? 'text-violet-600 dark:text-violet-400 font-semibold' : 'text-slate-400 dark:text-[#8a8f98]'}`}>
                        <span className="text-[10px] font-bold">B</span>
                        <div className="w-16 h-1 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full" style={{ width: `${item.scoreB * 100}%` }} />
                        </div>
                        <span className="text-[10px]">{(item.scoreB * 100).toFixed(0)}%</span>
                        {item.preferred === 'B' && <span className="text-[9px] px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">승</span>}
                      </div>
                      {item.preferred === 'tie' && <span className="text-[10px] text-slate-400 dark:text-[#8a8f98]">동점</span>}
                    </div>
                  </div>
                </div>
              ))}

              {/* "in progress" step placeholder */}
              {progressTotal > 0 && progress.length < progressTotal && (
                <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-[#191a1b] border border-slate-100 dark:border-white/8 px-3 py-2.5">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-500" />
                  <span className="text-xs text-slate-500 dark:text-[#8a8f98]">입력 {progress.length + 1} 평가 중...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* New experiment form */}
        {showNew && (
          <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-semibold text-slate-900 dark:text-[#f7f8f8]">새 실험</span>
              <button onClick={() => setShowNew(false)} className="text-slate-400 dark:text-[#8a8f98] hover:text-slate-600 dark:hover:text-[#d0d6e0] transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>이름</label>
                  <input type="text" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>설명</label>
                  <input type="text" value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>프롬프트 A (시스템)</label>
                  <textarea value={newForm.promptA} onChange={e => setNewForm(f => ({ ...f, promptA: e.target.value }))} rows={4}
                    placeholder="You are a helpful assistant..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white dark:border-white/8 dark:bg-[#28282c] dark:text-[#f7f8f8] dark:placeholder:text-[#8a8f98] dark:focus:border-indigo-500/50 dark:focus:bg-[#28282c]"
                    style={{ resize: 'vertical' }} />
                </div>
                <div>
                  <label className={labelCls}>프롬프트 B (시스템)</label>
                  <textarea value={newForm.promptB} onChange={e => setNewForm(f => ({ ...f, promptB: e.target.value }))} rows={4}
                    placeholder="You are an expert assistant..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white dark:border-white/8 dark:bg-[#28282c] dark:text-[#f7f8f8] dark:placeholder:text-[#8a8f98] dark:focus:border-indigo-500/50 dark:focus:bg-[#28282c]"
                    style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div>
                <label className={labelCls}>테스트 입력 ({newForm.testInputs.length})</label>
                {newForm.testInputs.map((inp, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="text" value={inp}
                      onChange={e => setNewForm(f => ({ ...f, testInputs: f.testInputs.map((v, j) => j === i ? e.target.value : v) }))}
                      placeholder={`테스트 입력 ${i + 1}`}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white dark:border-white/8 dark:bg-[#28282c] dark:text-[#f7f8f8] dark:placeholder:text-[#8a8f98] dark:focus:border-indigo-500/50 dark:focus:bg-[#28282c]" />
                    {newForm.testInputs.length > 1 && (
                      <button onClick={() => setNewForm(f => ({ ...f, testInputs: f.testInputs.filter((_, j) => j !== i) }))}
                        className="text-slate-400 dark:text-[#8a8f98] hover:text-slate-600 dark:hover:text-[#d0d6e0] transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setNewForm(f => ({ ...f, testInputs: [...f.testInputs, ''] }))}
                  className="text-indigo-600 dark:text-[#818cf8] hover:text-indigo-700 dark:hover:text-indigo-400 text-sm transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  + 입력 추가
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNew(false)} className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-1.5 text-sm text-slate-600 dark:text-[#d0d6e0] hover:bg-slate-50 dark:hover:bg-[#28282c] transition-colors cursor-pointer bg-white dark:bg-transparent">
                  취소
                </button>
                <button onClick={create} className="rounded-xl px-4 py-1.5 bg-indigo-600 dark:bg-[#5e6ad2] text-white text-sm font-medium hover:bg-indigo-700 dark:hover:bg-[#6b77e0] transition-colors cursor-pointer" style={{ border: 'none' }}>
                  생성
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Experiment list */}
        {loading ? (
          <div className="text-center py-10 text-sm text-slate-400 dark:text-[#8a8f98]">불러오는 중...</div>
        ) : experiments.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] shadow-sm">
            <FlaskConical className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-[#8a8f98]" />
            <p className="text-sm text-slate-500 dark:text-[#8a8f98]">아직 실험이 없습니다. 첫 번째 A/B 테스트를 만들어보세요.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] shadow-sm overflow-hidden">
            {experiments.map((exp, idx) => {
              const badgeCls = STATUS_BADGE[exp.status as keyof typeof STATUS_BADGE] ?? STATUS_BADGE.DRAFT
              const isRunningThis = running === exp.id
              return (
                <div key={exp.id} className={`px-5 py-4 hover:bg-slate-50 dark:hover:bg-[#28282c] transition-colors ${idx < experiments.length - 1 ? 'border-b border-slate-100 dark:border-white/8' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">{exp.name}</span>
                        {exp.description && (
                          <span className="text-xs text-slate-400 dark:text-[#8a8f98] ml-2">{exp.description}</span>
                        )}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${badgeCls}`}>
                        {isRunningThis && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                        {STATUS_LABEL[exp.status as string] ?? exp.status}
                      </span>
                      {exp.winner && (
                        <span className="text-[10px] rounded-full border border-indigo-100 dark:border-indigo-800/40 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5">
                          승자: 프롬프트 {exp.winner}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {exp.status === 'DRAFT' && (
                        <button
                          onClick={() => runExperiment(exp.id)}
                          disabled={!!running}
                          className="flex items-center gap-1 rounded-xl px-3 py-1.5 bg-indigo-600 dark:bg-[#5e6ad2] text-white text-xs font-medium hover:bg-indigo-700 dark:hover:bg-[#6b77e0] disabled:opacity-40 transition-colors cursor-pointer"
                          style={{ border: 'none' }}
                        >
                          <Play className="h-3 w-3" />
                          실행
                        </button>
                      )}
                      {exp.status === 'COMPLETED' && (
                        <button
                          onClick={() => viewResults(exp)}
                          className="flex items-center gap-1 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-3 py-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                        >
                          결과 보기 <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-400 dark:text-[#8a8f98]">
                    테스트 입력 {(exp.testInputs as string[]).length}개 ·{' '}
                    {new Date(exp.createdAt).toLocaleDateString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Results panel */}
        {selected && selected.results && selected.results.length > 0 && (
          <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-base font-semibold text-slate-900 dark:text-[#f7f8f8]">결과: {selected.name}</span>
                {selected.winner && (
                  <span className="ml-2 text-xs rounded-full border border-indigo-100 dark:border-indigo-800/40 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5">
                    최종 승자: 프롬프트 {selected.winner}
                  </span>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 dark:text-[#8a8f98] hover:text-slate-600 dark:hover:text-[#d0d6e0] transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              {selected.results.map((result, i) => (
                <div key={result.id} className="rounded-xl border border-slate-100 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] p-4">
                  <div className="text-xs font-semibold text-slate-500 dark:text-[#8a8f98] mb-3">
                    입력 {i + 1}: <span className="font-normal text-slate-700 dark:text-[#d0d6e0]">{result.input}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Prompt A */}
                    <div className={`p-3 rounded-xl border ${result.preferredByEvaluator === 'A' ? 'border-indigo-200 dark:border-indigo-800/40 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-white/8 bg-white dark:bg-[#191a1b]'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${result.preferredByEvaluator === 'A' ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-[#8a8f98]'}`}>
                          프롬프트 A {result.preferredByEvaluator === 'A' ? '· 승자' : ''}
                        </span>
                        <span className="text-xs tabular-nums text-slate-400 dark:text-[#8a8f98]">{(result.scoreA * 100).toFixed(0)}점</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${result.scoreA * 100}%` }} />
                      </div>
                      <div className="text-xs text-slate-600 dark:text-[#8a8f98] leading-relaxed line-clamp-4">{result.outputA}</div>
                    </div>
                    {/* Prompt B */}
                    <div className={`p-3 rounded-xl border ${result.preferredByEvaluator === 'B' ? 'border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/30' : 'border-slate-200 dark:border-white/8 bg-white dark:bg-[#191a1b]'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${result.preferredByEvaluator === 'B' ? 'text-violet-700 dark:text-violet-400' : 'text-slate-500 dark:text-[#8a8f98]'}`}>
                          프롬프트 B {result.preferredByEvaluator === 'B' ? '· 승자' : ''}
                        </span>
                        <span className="text-xs tabular-nums text-slate-400 dark:text-[#8a8f98]">{(result.scoreB * 100).toFixed(0)}점</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${result.scoreB * 100}%` }} />
                      </div>
                      <div className="text-xs text-slate-600 dark:text-[#8a8f98] leading-relaxed line-clamp-4">{result.outputB}</div>
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
