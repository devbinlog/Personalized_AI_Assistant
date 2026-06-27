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

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981']

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
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
          cursor={{ fill: 'hsl(var(--muted))' }}
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
