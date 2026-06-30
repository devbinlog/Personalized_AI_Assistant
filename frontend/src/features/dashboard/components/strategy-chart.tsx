'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { strategyLabel } from '@/lib/utils'
import type { ResponseStrategy } from '@/types'

const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']

interface StrategyChartProps {
  data: Array<{ strategy: ResponseStrategy; count: number }>
}

export function StrategyChart({ data }: StrategyChartProps) {
  const chartData = data.map(d => ({
    ...d,
    label: strategyLabel(d.strategy),
  }))

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No preference data yet · Use Learning Mode to collect preferences
      </div>
    )
  }

  return (
    <div className="bg-white">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="label"
            type="category"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 12,
              color: '#0f172a',
            }}
            cursor={{ fill: 'rgba(99,102,241,0.06)' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
