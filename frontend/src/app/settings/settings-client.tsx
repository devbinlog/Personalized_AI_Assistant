'use client'

import { useEffect, useRef, useState } from 'react'
import { Brain, Search, Lightbulb, BarChart2, Sparkles, Cloud, CloudOff, Trash2, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import type { AppSettings } from '@/types'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-5 w-9 rounded-full transition-colors focus:outline-none"
      style={{ backgroundColor: checked ? '#0f172a' : '#e2e8f0' }}
    >
      <span
        className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  )
}

export function SettingsClient() {
  const { mode, setMode, settings, updateSettings } = useAppStore()
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [resetPrefStatus, setResetPrefStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [resetPersonaStatus, setResetPersonaStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [confirmPref, setConfirmPref] = useState(false)
  const [confirmPersona, setConfirmPersona] = useState(false)

  async function handleResetPreferences() {
    if (!confirmPref) { setConfirmPref(true); return }
    setResetPrefStatus('loading')
    setConfirmPref(false)
    try {
      const res = await fetch('/api/preferences/reset', { method: 'DELETE' })
      setResetPrefStatus(res.ok ? 'done' : 'error')
      setTimeout(() => setResetPrefStatus('idle'), 3000)
    } catch {
      setResetPrefStatus('error')
      setTimeout(() => setResetPrefStatus('idle'), 3000)
    }
  }

  async function handleResetPersonas() {
    if (!confirmPersona) { setConfirmPersona(true); return }
    setResetPersonaStatus('loading')
    setConfirmPersona(false)
    try {
      const res = await fetch('/api/personas/reset', { method: 'DELETE' })
      setResetPersonaStatus(res.ok ? 'done' : 'error')
      setTimeout(() => setResetPersonaStatus('idle'), 3000)
    } catch {
      setResetPersonaStatus('error')
      setTimeout(() => setResetPersonaStatus('idle'), 3000)
    }
  }

  // Load settings from server on mount and merge into local store
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then((data: Partial<AppSettings & { defaultMode: string }> | null) => {
        if (!data) return
        const merged: Partial<AppSettings> = {}
        if (data.autoSearch !== undefined) merged.autoSearch = data.autoSearch
        if (data.showExplanations !== undefined) merged.showExplanations = data.showExplanations
        if (data.showConfidence !== undefined) merged.showConfidence = data.showConfidence
        if (data.defaultMode) {
          merged.defaultMode = data.defaultMode as AppSettings['defaultMode']
          setMode(data.defaultMode as AppSettings['defaultMode'])
        }
        if (Object.keys(merged).length > 0) updateSettings(merged)
      })
      .catch(() => {})
  }, [])

  // Debounced save to server whenever settings change
  function saveToServer(next: Partial<AppSettings>) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSyncStatus('saving')
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        })
        setSyncStatus(res.ok ? 'saved' : 'error')
        if (res.ok) setTimeout(() => setSyncStatus('idle'), 2000)
      } catch {
        setSyncStatus('error')
      }
    }, 600)
  }

  function handleMode(v: boolean) {
    const newMode = v ? 'LEARNING' : 'NORMAL'
    setMode(newMode)
    updateSettings({ defaultMode: newMode })
    saveToServer({ ...settings, defaultMode: newMode })
  }

  function handleSetting(key: keyof AppSettings, v: boolean) {
    updateSettings({ [key]: v })
    saveToServer({ ...settings, defaultMode: mode, [key]: v })
  }

  const settingRows = [
    {
      icon: Sparkles,
      label: '학습 모드',
      description: '3가지 응답 스타일 중 선택 — 선택할수록 AI가 선호도를 학습합니다',
      checked: mode === 'LEARNING',
      onChange: handleMode,
      iconCls: 'text-slate-600',
    },
    {
      icon: Search,
      label: '자동 웹 검색',
      description: '실시간 검색이 도움이 될 때 어시스턴트가 자동으로 검색합니다',
      checked: settings.autoSearch,
      onChange: (v: boolean) => handleSetting('autoSearch', v),
      iconCls: 'text-emerald-500',
    },
    {
      icon: Lightbulb,
      label: '설명 표시',
      description: '각 응답 아래 "왜 이 답변인가?" 버튼을 표시합니다',
      checked: settings.showExplanations,
      onChange: (v: boolean) => handleSetting('showExplanations', v),
      iconCls: 'text-slate-600',
    },
    {
      icon: BarChart2,
      label: '일치율 표시',
      description: '응답이 선호도 프로필과 얼마나 일치하는지 표시합니다',
      checked: settings.showConfidence,
      onChange: (v: boolean) => handleSetting('showConfidence', v),
      iconCls: 'text-violet-500',
    },
  ]

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6 md:p-10" style={{ backgroundColor: '#fafaf9' }}>
      <div className="mx-auto w-full max-w-xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1c1917' }}>설정</h1>
          <p className="mt-1 text-sm" style={{ color: '#78716c' }}>어시스턴트 환경설정</p>
        </div>

        {/* Sync indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          {syncStatus === 'saving' && (
            <span className="text-slate-400">저장 중...</span>
          )}
          {syncStatus === 'saved' && (
            <>
              <Cloud className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600">저장됨</span>
            </>
          )}
          {syncStatus === 'error' && (
            <>
              <CloudOff className="h-3.5 w-3.5 text-red-400" />
              <span className="text-red-500">저장 실패</span>
            </>
          )}
        </div>
      </div>

      <div>
        {/* Settings card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          {settingRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-3 pr-6">
                <row.icon className={`h-4 w-4 shrink-0 ${row.iconCls}`} />
                <div>
                  <p className="text-sm font-medium text-slate-700">{row.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{row.description}</p>
                </div>
              </div>
              <Toggle checked={row.checked} onChange={row.onChange} />
            </div>
          ))}
        </div>

        {/* Info note */}
        <div className="mt-6 flex items-start gap-3">
          <Brain className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
          <p className="text-xs text-slate-400 leading-relaxed">
            설정이 서버에 저장되어 다른 기기에서 접속해도 유지됩니다. AI는 선택 내역을 통해 자동으로 취향을 학습합니다.
          </p>
        </div>

        {/* 데이터 초기화 */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#78716c' }}>데이터 초기화</h2>
          <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm space-y-4">

            {/* 선호도 초기화 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 pr-6">
                <RotateCcw className="h-4 w-4 shrink-0 text-orange-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700">선호도 초기화</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    지금까지 학습된 선호도 로그와 메모리를 모두 삭제합니다
                  </p>
                </div>
              </div>
              <button
                onClick={handleResetPreferences}
                disabled={resetPrefStatus === 'loading'}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: confirmPref ? '#ef4444' : '#fef2f2',
                  color: confirmPref ? '#ffffff' : '#ef4444',
                  border: '1px solid #fecaca',
                  cursor: resetPrefStatus === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: resetPrefStatus === 'loading' ? 0.6 : 1,
                }}
              >
                {resetPrefStatus === 'loading' ? '삭제 중...'
                  : resetPrefStatus === 'done' ? '완료'
                  : resetPrefStatus === 'error' ? '오류'
                  : confirmPref ? '정말 삭제'
                  : '초기화'}
              </button>
            </div>

            <div className="border-t border-slate-100" />

            {/* 페르소나 초기화 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 pr-6">
                <Trash2 className="h-4 w-4 shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700">내가 만든 페르소나 삭제</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    직접 만든 페르소나를 삭제합니다. 기본 페르소나 5개는 유지됩니다
                  </p>
                </div>
              </div>
              <button
                onClick={handleResetPersonas}
                disabled={resetPersonaStatus === 'loading'}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: confirmPersona ? '#ef4444' : '#fef2f2',
                  color: confirmPersona ? '#ffffff' : '#ef4444',
                  border: '1px solid #fecaca',
                  cursor: resetPersonaStatus === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: resetPersonaStatus === 'loading' ? 0.6 : 1,
                }}
              >
                {resetPersonaStatus === 'loading' ? '삭제 중...'
                  : resetPersonaStatus === 'done' ? '완료'
                  : resetPersonaStatus === 'error' ? '오류'
                  : confirmPersona ? '정말 삭제'
                  : '삭제'}
              </button>
            </div>

          </div>
          <p className="mt-2 text-xs text-slate-400 pl-1">
            초기화 버튼을 누르면 확인 버튼이 나타납니다. 삭제된 데이터는 복구할 수 없습니다.
          </p>
        </div>

      </div>
      </div>
    </div>
  )
}
