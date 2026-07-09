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
      <div className="flex h-48 items-center justify-center text-sm text-slate-400 dark:text-[#8a8f98]">
        대화가 쌓이면 활동 그래프가 표시됩니다
      </div>
    )
  }

  return (
    <div className="bg-transparent">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ left: -16, right: 8, top: 4 }}>
          <defs>
            <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="prefGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#8a8f98' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#8a8f98' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#191a1b',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              fontSize: 11,
              color: '#f7f8f8',
            }}
            formatter={(value: number, name: string) => [
              `${value}회`,
              name === 'conversations' ? '대화' : '선호도 선택',
            ]}
          />
          <Area
            type="monotone"
            dataKey="conversations"
            stroke="#6366f1"
            fill="url(#convGradient)"
            strokeWidth={2}
            name="conversations"
          />
          <Area
            type="monotone"
            dataKey="preferences"
            stroke="#818cf8"
            fill="url(#prefGradient)"
            strokeWidth={2}
            name="preferences"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
