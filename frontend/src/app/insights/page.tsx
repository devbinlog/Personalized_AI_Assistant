'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, Brain, TrendingUp, RefreshCw, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { PreferenceMemory } from '@/types'

const isMock = process.env.NEXT_PUBLIC_LLM_PROVIDER === 'mock'

interface MemoryVersion {
  id: string
  version: number
  snapshot: Record<string, unknown>
  diff: Array<{ field: string; previousValue: string | null; currentValue: string | null }> | null
  triggerLogCount: number
  createdAt: string
}

export default function InsightsPage() {
  const [memory, setMemory] = useState<PreferenceMemory | null>(null)
  const [versions, setVersions] = useState<MemoryVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    const res = await fetch('/api/memory').then(r => r.json()).catch(() => ({}))
    if (res.memory) setMemory(res.memory)
    if (res.versions) setVersions(res.versions)
  }

  useEffect(() => {
    setIsLoading(true)
    fetchData().finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-slate-700" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI 인사이트</h1>
              <p className="text-sm text-slate-500">
                설명 가능한 AI — AI가 어떻게 학습하고 적응하는지 확인하세요
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={fetchData} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        {/* Mock mode notice */}
        {isMock && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-slate-500" />
            <p>
              현재 <strong>Mock 모드</strong>입니다. 선호도 메모리 프로파일은 실제 LLM이 있어야 생성됩니다.
              학습 모드로 채팅은 가능하지만 AI 분석 결과가 표시되지 않습니다.
            </p>
          </div>
        )}

        {/* Current memory state */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900">현재 선호도 프로필</h2>
            {memory && (
              <span className="text-[10px] rounded border border-slate-200 bg-slate-50 text-slate-500 px-1.5 py-0.5">v{memory.version}</span>
            )}
          </div>

          {memory ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: '선호 어조', value: memory.preferredTone, icon: '🎭' },
                { label: '선호 길이', value: memory.preferredLength, icon: '📏' },
                { label: '선호 구조', value: memory.preferredStructure, icon: '🏗️' },
              ].map(item => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm border-l-4 border-l-slate-400"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span>{item.icon}</span>
                    <p className="text-xs text-slate-500">{item.label}</p>
                  </div>
                  <p className="capitalize text-lg font-semibold text-slate-900">
                    {item.value ?? '아직 미정'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
              <Brain className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">
                학습 모드를 3회 이상 사용하면 첫 번째 선호도 프로필이 생성됩니다
              </p>
            </div>
          )}
        </section>

        {/* Memory evolution timeline */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900">학습 타임라인</h2>
          </div>

          {versions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
              <TrendingUp className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">메모리 변화 이력이 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="relative space-y-3">
              {/* Timeline line */}
              <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-100" />

              {versions.map((version) => (
                <div key={version.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 flex h-3 w-3 items-center justify-center">
                    <div
                      className="h-3 w-3 rounded-full border-2"
                      style={{ borderColor: '#334155', backgroundColor: '#fff' }}
                    />
                  </div>

                  <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] rounded border border-slate-200 bg-slate-50 text-slate-500 px-1.5 py-0.5">v{version.version}</span>
                        <span className="text-xs text-slate-500">
                          선호도 {version.triggerLogCount}회 후 갱신
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(version.createdAt)}</span>
                    </div>

                    {version.diff && version.diff.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-600">이전 버전과 달라진 점:</p>
                        {version.diff.map((change, j) => (
                          <div
                            key={j}
                            className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                          >
                            <span className="font-medium text-slate-700 capitalize">
                              {change.field.replace('preferred', '')}
                            </span>
                            <span className="text-slate-400 line-through">
                              {change.previousValue ?? 'none'}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="text-slate-700">{change.currentValue ?? 'none'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">첫 번째 메모리 생성됨</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* XAI explainer note */}
        {!isMock && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 shrink-0 mt-0.5 text-slate-700" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">왜 이 답변인가? (XAI)</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                일반 모드에서 생성된 모든 응답에는 설명이 포함됩니다.
                AI 메시지 아래 <strong className="text-slate-700">왜 이 답변인가?</strong>를 클릭하면
                선호도 메모리가 응답 전략에 어떤 영향을 미쳤는지 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>}
      </div>
    </div>
  )
}
