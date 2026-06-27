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
              <div
                key={item.label}
                className="rounded-xl p-4"
                style={{ backgroundColor: '#191a1b', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>{item.icon}</span>
                  <p style={{ fontSize: '12px', color: '#8a8f98' }}>{item.label}</p>
                </div>
                <p
                  className="capitalize"
                  style={{ fontSize: '18px', fontWeight: 600, color: '#f7f8f8', letterSpacing: '-0.5px' }}
                >
                  {item.value ?? 'Not determined yet'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl p-8 text-center"
            style={{ border: '1px dashed rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.01)' }}
          >
            <Brain className="mx-auto mb-3 h-8 w-8" style={{ color: 'rgba(138,143,152,0.4)' }} />
            <p style={{ fontSize: '13px', color: '#8a8f98' }}>
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
          <div
            className="rounded-xl p-8 text-center"
            style={{ border: '1px dashed rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.01)' }}
          >
            <TrendingUp className="mx-auto mb-3 h-8 w-8" style={{ color: 'rgba(138,143,152,0.4)' }} />
            <p style={{ fontSize: '13px', color: '#8a8f98' }}>Memory evolution history will appear here</p>
          </div>
        ) : (
          <div className="relative space-y-3">
            {/* Timeline line */}
            <div
              className="absolute left-4 top-4 bottom-4 w-px"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
            />

            {versions.map((version) => (
              <div key={version.id} className="relative flex gap-4 pl-10">
                {/* Timeline dot */}
                <div className="absolute left-2.5 flex h-3 w-3 items-center justify-center">
                  <div
                    className="h-3 w-3 rounded-full border-2"
                    style={{ borderColor: '#7170ff', backgroundColor: '#08090a' }}
                  />
                </div>

                <div
                  className="flex-1 rounded-xl p-4 space-y-3"
                  style={{ backgroundColor: '#191a1b', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{version.version}</Badge>
                      <span style={{ fontSize: '12px', color: '#8a8f98' }}>
                        After {version.triggerLogCount} preferences
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#8a8f98' }}>{formatDate(version.createdAt)}</span>
                  </div>

                  {version.diff && version.diff.length > 0 ? (
                    <div className="space-y-2">
                      <p style={{ fontSize: '12px', fontWeight: 500, color: '#d0d6e0' }}>Changes from previous version:</p>
                      {version.diff.map((change, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-3 rounded-lg px-3 py-2"
                          style={{ backgroundColor: 'rgba(255,255,255,0.03)', fontSize: '12px' }}
                        >
                          <span style={{ fontWeight: 500, color: '#d0d6e0', textTransform: 'capitalize' }}>
                            {change.field.replace('preferred', '')}
                          </span>
                          <span style={{ color: '#62666d', textDecoration: 'line-through' }}>
                            {change.previousValue ?? 'none'}
                          </span>
                          <span style={{ color: '#7170ff' }}>→</span>
                          <span style={{ color: '#7170ff' }}>{change.currentValue ?? 'none'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#8a8f98' }}>Initial memory established</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* XAI explainer note */}
      <div
        className="rounded-xl p-4"
        style={{
          border: '1px solid rgba(113,112,255,0.2)',
          backgroundColor: 'rgba(113,112,255,0.04)',
        }}
      >
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#7170ff' }} />
          <div className="space-y-1">
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#f7f8f8' }}>Why This Answer? (XAI)</p>
            <p style={{ fontSize: '12px', color: '#8a8f98', lineHeight: 1.6 }}>
              Every response generated in Normal Mode includes an explanation you can access from the chat.
              Click <strong style={{ color: '#d0d6e0' }}>Why this answer?</strong> below any AI message to see exactly how your preference
              memory influenced the response strategy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
