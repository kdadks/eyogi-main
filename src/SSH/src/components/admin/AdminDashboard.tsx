import React, { useEffect, useState } from 'react'
import {
  UsersIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import { supabaseAdmin } from '../../lib/supabase'
interface DashboardStats {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  totalCertificates: number
  recentEnrollments: number
  activeUsers: number
}
const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalCertificates: 0,
    recentEnrollments: 0,
    activeUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    loadDashboardStats()
  }, [])
  const loadDashboardStats = async () => {
    try {
      // Make all queries in parallel for speed
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const [
        totalUsersResult,
        totalCoursesResult,
        totalEnrollmentsResult,
        totalCertificatesResult,
        recentEnrollmentsResult,
        activeUsersResult,
      ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('enrollments').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('certificates').select('*', { count: 'exact', head: true }),
        supabaseAdmin
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
      ])
      setStats({
        totalUsers: totalUsersResult.count || 0,
        totalCourses: totalCoursesResult.count || 0,
        totalEnrollments: totalEnrollmentsResult.count || 0,
        totalCertificates: totalCertificatesResult.count || 0,
        recentEnrollments: recentEnrollmentsResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
      })
    } catch {
      // Show zero values on error instead of mock data
      setStats({
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        totalCertificates: 0,
        recentEnrollments: 0,
        activeUsers: 0,
      })
    } finally {
      setLoading(false)
    }
  }
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: `+${stats.recentEnrollments} this month`,
    },
    {
      title: 'Active Courses',
      value: stats.totalCourses,
      icon: BookOpenIcon,
      color: 'bg-green-500',
      change: 'All time',
    },
    {
      title: 'Total Enrollments',
      value: stats.totalEnrollments,
      icon: ClipboardDocumentListIcon,
      color: 'bg-yellow-500',
      change: `+${stats.recentEnrollments} recent`,
    },
    {
      title: 'Certificates Issued',
      value: stats.totalCertificates,
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      change: 'All time',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: ArrowTrendingUpIcon,
      color: 'bg-indigo-500',
      change: 'Currently active',
    },
    {
      title: 'Monthly Growth',
      value: `${stats.recentEnrollments}`,
      icon: ChartBarIcon,
      color: 'bg-pink-500',
      change: 'Last 30 days',
    },
  ]
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
        {/* Skeleton Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-lg bg-gray-200 animate-pulse">
                      <div className="h-6 w-6 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-1 w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the eYogi Gurukul Admin Console</p>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {card.value.toLocaleString()}
                      </div>
                    </dd>
                    <dd className="text-sm text-gray-500">{card.change}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Quick Actions */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <UsersIcon className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Add New User</h3>
              <p className="text-sm text-gray-500">Create student or teacher account</p>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <BookOpenIcon className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">Create Course</h3>
              <p className="text-sm text-gray-500">Set up a new course</p>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <ClipboardDocumentListIcon className="h-8 w-8 text-yellow-600 mb-2" />
              <h3 className="font-medium text-gray-900">Manage Enrollments</h3>
              <p className="text-sm text-gray-500">Review pending enrollments</p>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <ChartBarIcon className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-500">Analytics and insights</p>
            </button>
          </div>
        </div>
      </div>
      {/* Recent Activity */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <p>Activity feed will be implemented in Phase 2</p>
            <p className="text-sm">
              Coming soon: Real-time enrollment updates, user registrations, and system events
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AdminDashboard
