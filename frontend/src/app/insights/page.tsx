'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, Brain, TrendingUp, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { strategyLabel, confidencePercent, formatDate } from '@/lib/utils'
import type { PreferenceMemory } from '@/types'

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
    <div className="flex flex-1 flex-col overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">AI Insights</h1>
            <p className="text-sm text-muted-foreground">
              Explainable AI — understand how the AI learns and adapts to you
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={fetchData} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Current memory state */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Current Preference Profile</h2>
          {memory && <Badge variant="outline" className="text-[10px]">v{memory.version}</Badge>}
        </div>

        {memory ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Preferred Tone', value: memory.preferredTone, icon: '🎭' },
              { label: 'Preferred Length', value: memory.preferredLength, icon: '📏' },
              { label: 'Preferred Structure', value: memory.preferredStructure, icon: '🏗️' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>{item.icon}</span>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
                <p className="text-lg font-semibold capitalize">{item.value ?? 'Not determined yet'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Brain className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Use Learning Mode at least 3 times to generate your first preference profile
            </p>
          </div>
        )}
      </section>

      {/* Memory evolution timeline */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Learning Timeline</h2>
        </div>

        {versions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <TrendingUp className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Memory evolution history will appear here</p>
          </div>
        ) : (
          <div className="relative space-y-3">
            {/* Timeline line */}
            <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />

            {versions.map((version, i) => (
              <div key={version.id} className="relative flex gap-4 pl-10">
                {/* Timeline dot */}
                <div className="absolute left-2.5 flex h-3 w-3 items-center justify-center">
                  <div className="h-3 w-3 rounded-full border-2 border-primary bg-background" />
                </div>

                <div className="flex-1 rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">v{version.version}</Badge>
                      <span className="text-xs text-muted-foreground">
                        After {version.triggerLogCount} preferences
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(version.createdAt)}</span>
                  </div>

                  {version.diff && version.diff.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium">Changes from previous version:</p>
                      {version.diff.map((change, j) => (
                        <div key={j} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                          <span className="font-medium capitalize">{change.field.replace('preferred', '')}</span>
                          <span className="text-muted-foreground line-through">{change.previousValue ?? 'none'}</span>
                          <span className="text-primary">→</span>
                          <span className="text-primary">{change.currentValue ?? 'none'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Initial memory established</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* XAI explainer note */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Why This Answer? (XAI)</p>
            <p className="text-xs text-muted-foreground">
              Every response generated in Normal Mode includes an explanation you can access from the chat.
              Click <strong>Why this answer?</strong> below any AI message to see exactly how your preference
              memory influenced the response strategy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
