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
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Preference Logs',
      value: stats.totalPreferenceLogs,
      icon: Layers,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Memory Version',
      value: `v${stats.memoryVersion}`,
      icon: Brain,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Prompt Version',
      value: `v${stats.promptVersion}`,
      icon: Zap,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Total Messages',
      value: stats.totalMessages,
      icon: TrendingUp,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Learning Sessions',
      value: stats.learningModeConversations,
      icon: BookOpen,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map(item => (
        <div
          key={item.label}
          className="rounded-xl p-5 space-y-3"
          style={{ backgroundColor: '#191a1b', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.bg}`}>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </div>
          <div>
            <p style={{ fontSize: '28px', fontWeight: 600, color: '#f7f8f8', letterSpacing: '-0.8px' }}>
              {item.value}
            </p>
            <p style={{ fontSize: '12px', color: '#8a8f98' }}>{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
