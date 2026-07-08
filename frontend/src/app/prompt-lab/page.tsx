'use client'

import { useEffect, useState } from 'react'
import { FlaskConical, RefreshCw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PromptVersion {
  id: string
  version: number
  systemPrompt: string
  components: Record<string, string>
  tokenCount: number | null
  createdAt: string
}

export default function PromptLabPage() {
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/prompt-versions')
      .then(r => r.json())
      .then(data => setVersions(data.versions ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#08090a]">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f7f8f8]">프롬프트 랩</h1>
              <p className="text-sm text-slate-500 dark:text-[#8a8f98]">
                선호도가 시스템 프롬프트를 어떻게 동적으로 구성하는지 확인하세요
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsLoading(true)
              fetch('/api/prompt-versions').then(r => r.json()).then(d => setVersions(d.versions ?? [])).finally(() => setIsLoading(false))
            }}
            className="gap-2 dark:border-white/10 dark:text-[#d0d6e0] dark:hover:bg-[#28282c]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-white/8 bg-white dark:bg-[#191a1b] p-12 text-center shadow-sm">
            <FlaskConical className="h-8 w-8 text-slate-300 dark:text-[#8a8f98]" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-[#f7f8f8]">아직 프롬프트 버전이 없습니다</p>
              <p className="text-xs text-slate-500 dark:text-[#8a8f98]">대화할 때마다 프롬프트 버전이 자동으로 저장됩니다</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map(version => {
              const isExpanded = expandedId === version.id
              const components = version.components as Record<string, string>

              return (
                <div
                  key={version.id}
                  className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#191a1b] shadow-sm"
                >
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : version.id)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-[#28282c]"
                  >
                    <span className="shrink-0 rounded border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] text-slate-500 dark:text-[#8a8f98] text-xs px-2 py-0.5 font-mono">v{version.version}</span>
                    <p className="flex-1 truncate text-xs text-slate-500 dark:text-[#8a8f98]">
                      {version.systemPrompt.slice(0, 100)}…
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {version.tokenCount && (
                        <span className="text-xs text-slate-400 dark:text-[#8a8f98]">~{version.tokenCount} tokens</span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-[#8a8f98]">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-slate-400 dark:text-[#8a8f98]" />
                        : <ChevronDown className="h-4 w-4 text-slate-400 dark:text-[#8a8f98]" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-5 space-y-4 border-t border-slate-100 dark:border-white/8">
                      {/* Full prompt */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider">
                            전체 시스템 프롬프트
                          </p>
                          <button
                            onClick={() => copy(version.systemPrompt, version.id)}
                            className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-[#8a8f98] hover:text-slate-600 dark:hover:text-[#d0d6e0] transition-colors"
                          >
                            {copied === version.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copied === version.id ? '복사됨' : '복사'}
                          </button>
                        </div>
                        <pre className="max-h-64 overflow-y-auto rounded-lg border border-slate-100 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] p-4 font-mono leading-relaxed whitespace-pre-wrap text-[11px] text-slate-600 dark:text-[#d0d6e0]">
                          {version.systemPrompt}
                        </pre>
                      </div>

                      {/* Components breakdown */}
                      {Object.entries(components).filter(([k, v]) => v && k !== 'userRequest').map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-[#8a8f98] uppercase tracking-wider">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <div className="rounded-lg border border-slate-100 dark:border-white/8 bg-slate-50 dark:bg-[#28282c] p-3">
                            <p className="whitespace-pre-wrap text-xs text-slate-600 dark:text-[#d0d6e0]">
                              {value || '—'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
