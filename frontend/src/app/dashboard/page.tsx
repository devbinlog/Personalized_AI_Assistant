'use client'

import { useEffect, useState } from 'react'
import { LayoutDashboard, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatsGrid } from '@/features/dashboard/components/stats-grid'
import { StrategyChart } from '@/features/dashboard/components/strategy-chart'
import { ActivityChart } from '@/features/dashboard/components/activity-chart'
import { MemoryCard } from '@/features/dashboard/components/memory-card'
import type { DashboardStats, PreferenceMemory } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [memory, setMemory] = useState<PreferenceMemory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = async () => {
    const [statsRes, memRes] = await Promise.all([
      fetch('/api/analytics').then(r => r.json()).catch(() => null),
      fetch('/api/memory').then(r => r.json()).catch(() => null),
    ])
    if (statsRes) setStats(statsRes)
    if (memRes?.memory) setMemory(memRes.memory)
  }

  useEffect(() => {
    setIsLoading(true)
    fetchData().finally(() => setIsLoading(false))
  }, [])

  const refreshMemory = async () => {
    setIsRefreshing(true)
    await fetch('/api/memory', { method: 'POST' }).catch(() => {})
    await fetchData()
    setIsRefreshing(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Learning analytics and preference evolution</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={fetchData} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && <StatsGrid stats={stats} />}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium">Top Response Strategies</h3>
          <StrategyChart data={stats?.topStrategies ?? []} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium">Activity (last 14 days)</h3>
          <ActivityChart data={stats?.recentActivity ?? []} />
        </div>
      </div>

      {/* Memory card */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Current Preference Memory</h3>
        <MemoryCard memory={memory} onRefresh={refreshMemory} isRefreshing={isRefreshing} />
      </div>

      {/* Top tags */}
      {stats && stats.topTags.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium">Most Selected Feedback Tags</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(({ tag, count }) => (
              <div key={tag} className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
                <span className="text-xs font-medium">{tag.replace(/_/g, ' ')}</span>
                <span className="text-xs text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
