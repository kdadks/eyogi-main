/**
 * Dashboard Chart Component - Client-side Recharts
 */

'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ChartDataPoint {
  month: string
  posts: number
  pages: number
}

interface DashboardChartProps {
  data: ChartDataPoint[]
}

export function DashboardChart({ data }: DashboardChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Content Activity</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="posts" fill="#f97316" name="Posts" />
          <Bar dataKey="pages" fill="#3b82f6" name="Pages" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
