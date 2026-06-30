'use client'

import { MessageSquare, Layers, Brain, TrendingUp, BookOpen, Zap } from 'lucide-react'
import type { DashboardStats } from '@/types'

interface StatsGridProps {
  stats: DashboardStats
}

export function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    {
      label: 'Conversations',
      value: stats.totalConversations,
      icon: MessageSquare,
      iconCls: 'text-indigo-500',
    },
    {
      label: 'Preference Logs',
      value: stats.totalPreferenceLogs,
      icon: Layers,
      iconCls: 'text-emerald-500',
    },
    {
      label: 'Memory Version',
      value: `v${stats.memoryVersion}`,
      icon: Brain,
      iconCls: 'text-violet-500',
    },
    {
      label: 'Prompt Version',
      value: `v${stats.promptVersion}`,
      icon: Zap,
      iconCls: 'text-amber-500',
    },
    {
      label: 'Total Messages',
      value: stats.totalMessages,
      icon: TrendingUp,
      iconCls: 'text-sky-500',
    },
    {
      label: 'Learning Sessions',
      value: stats.learningModeConversations,
      icon: BookOpen,
      iconCls: 'text-rose-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map(item => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-3 hover:bg-slate-50 transition-colors"
        >
          <item.icon className={`h-4 w-4 ${item.iconCls}`} />
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {item.value}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
