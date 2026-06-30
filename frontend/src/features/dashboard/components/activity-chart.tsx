'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { ActivityPoint } from '@/types'

interface ActivityChartProps {
  data: ActivityPoint[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        Activity will appear here after a few conversations
      </div>
    )
  }

  return (
    <div className="bg-white">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ left: -16, right: 8, top: 4 }}>
          <defs>
            <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="prefGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 11,
              color: '#0f172a',
            }}
          />
          <Area
            type="monotone"
            dataKey="conversations"
            stroke="#6366f1"
            fill="url(#convGradient)"
            strokeWidth={2}
            name="Conversations"
          />
          <Area
            type="monotone"
            dataKey="preferences"
            stroke="#818cf8"
            fill="url(#prefGradient)"
            strokeWidth={2}
            name="Preferences"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
