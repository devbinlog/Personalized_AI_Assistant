'use client'

import { MessageSquare, Layers, Brain, TrendingUp, BookOpen, Zap } from 'lucide-react'
import type { DashboardStats } from '@/types'

interface StatsGridProps {
  stats: DashboardStats
}

export function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    { label: '대화 수', value: stats.totalConversations, icon: MessageSquare, iconCls: 'text-indigo-500' },
    { label: '선호도 로그', value: stats.totalPreferenceLogs, icon: Layers, iconCls: 'text-emerald-500' },
    { label: '메모리 버전', value: `v${stats.memoryVersion}`, icon: Brain, iconCls: 'text-violet-500' },
    { label: '프롬프트 버전', value: `v${stats.promptVersion}`, icon: Zap, iconCls: 'text-slate-600' },
    { label: '총 메시지', value: stats.totalMessages, icon: TrendingUp, iconCls: 'text-sky-500' },
    { label: '학습 세션', value: stats.learningModeConversations, icon: BookOpen, iconCls: 'text-rose-500' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map(item => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-100 dark:border-white/8 bg-white dark:bg-[#191a1b] p-6 shadow-sm space-y-3 hover:bg-slate-50 dark:hover:bg-[#28282c] transition-colors"
        >
          <item.icon className={`h-4 w-4 ${item.iconCls}`} />
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-[#f7f8f8]">
              {item.value}
            </p>
            <p className="text-xs text-slate-500 dark:text-[#8a8f98] mt-1">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
