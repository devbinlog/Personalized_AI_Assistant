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

const COLORS = ['#7170ff', '#5e6ad2', '#6e6fd0', '#8a89ff', '#10b981']

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
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No preference data yet · Use Learning Mode to collect preferences
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
        <Tooltip
          contentStyle={{ background: '#191a1b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: '#d0d6e0' }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
