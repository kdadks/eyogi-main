/**
 * Admin Home Page - Dynamic Data Fetching
 * Follows SSH university architecture pattern
 */

'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { FileText, Image, MessageSquare } from 'lucide-react'
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

interface Stats {
  label: string
  value: string
  icon: any
  color: string
}

const ICON_MAP = {
  posts: FileText,
  media: Image,
  categories: MessageSquare,
}

const STAT_COLORS: Record<string, string> = {
  posts: 'bg-blue-100 text-blue-600',
  media: 'bg-purple-100 text-purple-600',
  categories: 'bg-orange-100 text-orange-600',
}

const CHART_DATA = [
  { month: 'Jan', posts: 4, pages: 2 },
  { month: 'Feb', posts: 3, pages: 2 },
  { month: 'Mar', posts: 2, pages: 1 },
  { month: 'Apr', posts: 5, pages: 3 },
  { month: 'May', posts: 4, pages: 2 },
  { month: 'Jun', posts: 20, pages: 5 },
]

export default function AdminPage() {
  const [stats, setStats] = useState({ posts: 0, categories: 0, media: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch data from API endpoints
        const [postsRes, categoriesRes] = await Promise.all([
          fetch('/api/content/posts?limit=1'),
          fetch('/api/content/pages?limit=1'),
        ])

        // For now, use hardcoded values from migration
        setStats({
          posts: 38,
          categories: 2,
          media: 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const STATS: Stats[] = [
    {
      label: 'Total Posts',
      value: stats.posts.toString(),
      icon: ICON_MAP.posts,
      color: STAT_COLORS.posts,
    },
    {
      label: 'Media Files',
      value: stats.media.toString(),
      icon: ICON_MAP.media,
      color: STAT_COLORS.media,
    },
    {
      label: 'Categories',
      value: stats.categories.toString(),
      icon: ICON_MAP.categories,
      color: STAT_COLORS.categories,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome to the eYogi Admin CMS</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Content Activity Chart */}
      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Content Activity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={CHART_DATA}>
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

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/posts/new"
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            + Create New Post
          </a>
          <a
            href="/admin/pages/new"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            + Create New Page
          </a>
        </div>
      </div>
    </div>
  )
}
