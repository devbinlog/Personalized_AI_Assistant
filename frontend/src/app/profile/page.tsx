'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { User, Briefcase, Globe, Tag, Target, BookOpen, Save, CheckCircle, X, Plus, Brain, AlertCircle } from 'lucide-react'
import type { UserProfile, PreferenceMemory } from '@/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    displayName: '',
    occupation: '',
    background: '',
    interests: [],
    goals: [],
    language: 'ko',
  })
  const [memory, setMemory] = useState<PreferenceMemory | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [interestInput, setInterestInput] = useState('')
  const [goalInput, setGoalInput] = useState('')
  const interestRef = useRef<HTMLInputElement>(null)
  const goalRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [profileRes, memoryRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/memory'),
        ])
        const profileData = await profileRes.json()
        const memoryData = await memoryRes.json()

        if (profileData.profile) {
          setProfile({
            displayName: profileData.profile.displayName ?? '',
            occupation: profileData.profile.occupation ?? '',
            background: profileData.profile.background ?? '',
            interests: profileData.profile.interests ?? [],
            goals: profileData.profile.goals ?? [],
            language: profileData.profile.language ?? 'ko',
          })
        }

        if (memoryData.memory) {
          setMemory(memoryData.memory)
        }
      } catch {
        // silently handle fetch errors
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaveError(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        setSaveError(true)
        setTimeout(() => setSaveError(false), 3000)
      }
    } catch {
      setSaveError(true)
      setTimeout(() => setSaveError(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  function addInterest() {
    const val = interestInput.trim()
    if (!val) return
    const current = profile.interests ?? []
    if (!current.includes(val)) {
      setProfile(p => ({ ...p, interests: [...(p.interests ?? []), val] }))
    }
    setInterestInput('')
    interestRef.current?.focus()
  }

  function removeInterest(tag: string) {
    setProfile(p => ({ ...p, interests: (p.interests ?? []).filter(i => i !== tag) }))
  }

  function addGoal() {
    const val = goalInput.trim()
    if (!val) return
    const current = profile.goals ?? []
    if (!current.includes(val)) {
      setProfile(p => ({ ...p, goals: [...(p.goals ?? []), val] }))
    }
    setGoalInput('')
    goalRef.current?.focus()
  }

  function removeGoal(tag: string) {
    setProfile(p => ({ ...p, goals: (p.goals ?? []).filter(g => g !== tag) }))
  }

  function handleInterestKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addInterest()
    }
  }

  function handleGoalKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addGoal()
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center dark:bg-[#08090a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 dark:border-white/10 border-t-slate-700 dark:border-t-[#5e6ad2]" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-700 dark:bg-[#5e6ad2]">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-[#f7f8f8]">내 프로필</h1>
            <p className="text-sm text-slate-500 dark:text-[#8a8f98]">AI 어시스턴트가 나를 더 잘 이해하도록 정보를 입력하세요.</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Basic Info Card */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">
            <User className="h-4 w-4 text-slate-600 dark:text-[#8a8f98]" />
            기본 정보
          </h2>

          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-[#8a8f98]">이름 (표시명)</label>
              <input
                type="text"
                value={profile.displayName ?? ''}
                onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                placeholder="홍길동"
                className="w-full rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#f7f8f8] placeholder:text-slate-400 dark:placeholder:text-[#8a8f98] focus:border-slate-400 dark:focus:border-white/20 focus:bg-white dark:focus:bg-[#28282c] focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/10 transition-colors"
              />
            </div>

            {/* Occupation */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-[#8a8f98]">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3 text-slate-500 dark:text-[#8a8f98]" />
                  직업 / 역할
                </span>
              </label>
              <input
                type="text"
                value={profile.occupation ?? ''}
                onChange={e => setProfile(p => ({ ...p, occupation: e.target.value }))}
                placeholder="소프트웨어 개발자"
                className="w-full rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#f7f8f8] placeholder:text-slate-400 dark:placeholder:text-[#8a8f98] focus:border-slate-400 dark:focus:border-white/20 focus:bg-white dark:focus:bg-[#28282c] focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/10 transition-colors"
              />
            </div>

            {/* Background */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-[#8a8f98]">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3 text-slate-500 dark:text-[#8a8f98]" />
                  배경 / 자기소개
                </span>
              </label>
              <textarea
                value={profile.background ?? ''}
                onChange={e => setProfile(p => ({ ...p, background: e.target.value }))}
                placeholder="Python을 주로 사용하며, AI/ML에 관심이 많습니다."
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#f7f8f8] placeholder:text-slate-400 dark:placeholder:text-[#8a8f98] focus:border-slate-400 dark:focus:border-white/20 focus:bg-white dark:focus:bg-[#28282c] focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/10 transition-colors"
              />
            </div>

            {/* Language */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-[#8a8f98]">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-slate-500 dark:text-[#8a8f98]" />
                  응답 언어
                </span>
              </label>
              <select
                value={profile.language ?? 'ko'}
                onChange={e => setProfile(p => ({ ...p, language: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#f7f8f8] focus:border-slate-400 dark:focus:border-white/20 focus:bg-white dark:focus:bg-[#28282c] focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/10 transition-colors"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interests Card */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">
            <Tag className="h-4 w-4 text-slate-600 dark:text-[#8a8f98]" />
            관심사
          </h2>

          <div className="mb-3 flex gap-2">
            <input
              ref={interestRef}
              type="text"
              value={interestInput}
              onChange={e => setInterestInput(e.target.value)}
              onKeyDown={handleInterestKeyDown}
              placeholder="관심사 입력 후 Enter"
              className="flex-1 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#f7f8f8] placeholder:text-slate-400 dark:placeholder:text-[#8a8f98] focus:border-slate-400 dark:focus:border-white/20 focus:bg-white dark:focus:bg-[#28282c] focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/10 transition-colors"
            />
            <button
              onClick={addInterest}
              className="flex items-center gap-1 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-[#28282c] px-3 py-2.5 text-xs font-medium text-slate-800 dark:text-[#d0d6e0] hover:bg-slate-200 dark:hover:bg-[#333338] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              추가
            </button>
          </div>

          {(profile.interests ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(profile.interests ?? []).map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/8 bg-slate-100 dark:bg-[#28282c] px-3 py-1 text-xs font-medium text-slate-800 dark:text-[#d0d6e0]"
                >
                  {tag}
                  <button
                    onClick={() => removeInterest(tag)}
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-slate-500 dark:text-[#8a8f98] hover:bg-slate-300 dark:hover:bg-[#333338] hover:text-slate-800 dark:hover:text-[#f7f8f8] transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-[#8a8f98]">아직 관심사가 없습니다. 위에서 추가해보세요.</p>
          )}
        </div>

        {/* Goals Card */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">
            <Target className="h-4 w-4 text-slate-600 dark:text-[#8a8f98]" />
            목표
          </h2>

          <div className="mb-3 flex gap-2">
            <input
              ref={goalRef}
              type="text"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              onKeyDown={handleGoalKeyDown}
              placeholder="목표 입력 후 Enter"
              className="flex-1 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#f7f8f8] placeholder:text-slate-400 dark:placeholder:text-[#8a8f98] focus:border-slate-400 dark:focus:border-white/20 focus:bg-white dark:focus:bg-[#28282c] focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/10 transition-colors"
            />
            <button
              onClick={addGoal}
              className="flex items-center gap-1 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-[#28282c] px-3 py-2.5 text-xs font-medium text-slate-800 dark:text-[#d0d6e0] hover:bg-slate-200 dark:hover:bg-[#333338] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              추가
            </button>
          </div>

          {(profile.goals ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(profile.goals ?? []).map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/8 bg-slate-100 dark:bg-[#28282c] px-3 py-1 text-xs font-medium text-slate-800 dark:text-[#d0d6e0]"
                >
                  {tag}
                  <button
                    onClick={() => removeGoal(tag)}
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-slate-500 dark:text-[#8a8f98] hover:bg-slate-300 dark:hover:bg-[#333338] hover:text-slate-800 dark:hover:text-[#f7f8f8] transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-[#8a8f98]">아직 목표가 없습니다. 위에서 추가해보세요.</p>
          )}
        </div>

        {/* Memory Summary Card */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">
            <Brain className="h-4 w-4 text-slate-600 dark:text-[#8a8f98]" />
            현재 선호도 메모리
          </h2>

          {memory?.rawSummary ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-[#d0d6e0]">{memory.rawSummary}</p>
              <div className="flex flex-wrap gap-3 pt-1">
                {memory.preferredTone && (
                  <span className="rounded-lg bg-slate-50 dark:bg-[#28282c] px-3 py-1.5 text-xs text-slate-600 dark:text-[#d0d6e0]">
                    <span className="font-medium text-slate-900 dark:text-[#f7f8f8]">톤</span>: {memory.preferredTone}
                  </span>
                )}
                {memory.preferredLength && (
                  <span className="rounded-lg bg-slate-50 dark:bg-[#28282c] px-3 py-1.5 text-xs text-slate-600 dark:text-[#d0d6e0]">
                    <span className="font-medium text-slate-900 dark:text-[#f7f8f8]">길이</span>: {memory.preferredLength}
                  </span>
                )}
                {memory.preferredStructure && (
                  <span className="rounded-lg bg-slate-50 dark:bg-[#28282c] px-3 py-1.5 text-xs text-slate-600 dark:text-[#d0d6e0]">
                    <span className="font-medium text-slate-900 dark:text-[#f7f8f8]">구조</span>: {memory.preferredStructure}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-[#8a8f98]">
                총 {memory.logCount}개의 학습 데이터 기반
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-[#28282c] px-4 py-4">
              <Brain className="h-5 w-5 shrink-0 text-slate-300 dark:text-[#8a8f98]" />
              <p className="text-sm text-slate-500 dark:text-[#8a8f98]">아직 학습 데이터가 없습니다. 학습 모드로 대화를 시작해보세요.</p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={[
              'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-60 transition-colors',
              saveError
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                : saved
                ? 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700'
                : 'bg-slate-700 dark:bg-[#5e6ad2] hover:bg-slate-600 dark:hover:bg-[#6b77e0] active:bg-slate-600',
            ].join(' ')}
          >
            {saveError ? (
              <>
                <AlertCircle className="h-4 w-4" />
                저장 실패
              </>
            ) : saved ? (
              <>
                <CheckCircle className="h-4 w-4" />
                저장됨
              </>
            ) : saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                저장하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
