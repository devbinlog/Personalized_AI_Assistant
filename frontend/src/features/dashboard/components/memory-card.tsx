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
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <Brain className="h-8 w-8 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium">No preference memory yet</p>
          <p className="text-xs text-muted-foreground">Use Learning Mode 3+ times to generate your first memory</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-medium">Preference Memory</span>
          <Badge variant="outline" className="text-[10px]">v{memory.version}</Badge>
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
          <div key={item.label} className="rounded-lg bg-muted/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-sm font-medium">{item.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Preferred strategies */}
      {memory.preferredStrategies.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Preferred Strategies</p>
          <div className="flex flex-wrap gap-1.5">
            {memory.preferredStrategies.map(s => (
              <Badge key={s} variant="secondary" className="text-[11px]">
                {strategyLabel(s as never)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {memory.rawSummary && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs leading-relaxed text-muted-foreground">{memory.rawSummary}</p>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Based on {memory.logCount} preference selections · Last updated: {new Date(memory.lastUpdatedAt).toLocaleDateString()}
      </p>
    </div>
  )
}
