'use client'

import { Brain, RefreshCw, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { strategyLabel } from '@/lib/utils'
import type { PreferenceMemory } from '@/types'

interface MemoryCardProps {
  memory: PreferenceMemory | null
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function MemoryCard({ memory, onRefresh, isRefreshing }: MemoryCardProps) {
  if (!memory) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl p-8 text-center"
        style={{ border: '1px dashed rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.01)' }}
      >
        <Brain className="h-8 w-8" style={{ color: 'rgba(138,143,152,0.4)' }} />
        <div>
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#f7f8f8' }}>No preference memory yet</p>
          <p style={{ fontSize: '12px', color: '#8a8f98' }}>Use Learning Mode 3+ times to generate your first memory</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ backgroundColor: '#191a1b', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" style={{ color: '#7170ff' }} />
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#f7f8f8' }}>Preference Memory</span>
          <Badge variant="outline">v{memory.version}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={onRefresh} disabled={isRefreshing} className="h-7 gap-1.5 text-xs">
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Memory details */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: 'Tone', value: memory.preferredTone },
          { label: 'Length', value: memory.preferredLength },
          { label: 'Structure', value: memory.preferredStructure },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-lg p-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          >
            <p
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#62666d',
              }}
            >
              {item.label}
            </p>
            <p
              className="mt-1 capitalize"
              style={{ fontSize: '13px', fontWeight: 500, color: '#d0d6e0' }}
            >
              {item.value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Preferred strategies */}
      {memory.preferredStrategies.length > 0 && (
        <div className="space-y-2">
          <p style={{ fontSize: '12px', fontWeight: 500, color: '#8a8f98' }}>Preferred Strategies</p>
          <div className="flex flex-wrap gap-1.5">
            {memory.preferredStrategies.map(s => (
              <span
                key={s}
                style={{
                  backgroundColor: 'rgba(94,106,210,0.1)',
                  color: '#7170ff',
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {strategyLabel(s as never)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {memory.rawSummary && (
        <div
          className="rounded-lg p-3"
          style={{ border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}
        >
          <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#8a8f98' }}>{memory.rawSummary}</p>
        </div>
      )}

      <p style={{ fontSize: '10px', color: '#62666d' }}>
        Based on {memory.logCount} preference selections · Last updated: {new Date(memory.lastUpdatedAt).toLocaleDateString()}
      </p>
    </div>
  )
}
