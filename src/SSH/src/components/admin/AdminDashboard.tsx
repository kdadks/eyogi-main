import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HelpButton, adminDashboardHelpTopics } from '../help'
import {
  UsersIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  UserPlusIcon,
  BookOpenIcon as BookIcon,
  QueueListIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline'
import { supabaseAdmin } from '../../lib/supabase'
import { getBatchStats } from '../../lib/api/batches'
interface DashboardStats {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  totalCertificates: number
  recentEnrollments: number
  activeUsers: number
  totalBatches: number
  activeBatches: number
}
interface ActivityItem {
  id: string
  type:
    | 'user_registration'
    | 'course_creation'
    | 'enrollment'
    | 'certificate_issued'
    | 'data_deletion'
    | 'account_deletion'
  title: string
  description: string
  timestamp: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
}
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalCertificates: 0,
    recentEnrollments: 0,
    activeUsers: 0,
    totalBatches: 0,
    activeBatches: 0,
  })
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    loadDashboardStats()
    loadRecentActivities()
  }, [])
  const loadDashboardStats = async () => {
    try {
      // Optimized: Fetch counts only with head: true to avoid fetching actual data
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const [
        totalUsersResult,
        totalCoursesResult,
        totalEnrollmentsResult,
        totalCertificatesResult,
        recentEnrollmentsResult,
        batchStatsResult,
      ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('enrollments').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('certificates').select('*', { count: 'exact', head: true }),
        supabaseAdmin
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        getBatchStats().catch(() => ({
          total: 0,
          active: 0,
          inactive: 0,
          completed: 0,
          archived: 0,
        })),
      ])
      setStats({
        totalUsers: totalUsersResult.count || 0,
        totalCourses: totalCoursesResult.count || 0,
        totalEnrollments: totalEnrollmentsResult.count || 0,
        totalCertificates: totalCertificatesResult.count || 0,
        recentEnrollments: recentEnrollmentsResult.count || 0,
        activeUsers: totalUsersResult.count || 0,
        totalBatches: batchStatsResult.total || 0,
        activeBatches: batchStatsResult.active || 0,
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
        totalBatches: 0,
        activeBatches: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const loadRecentActivities = async () => {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7) // 7 days for recent activities

      // Optimized: Fetch only essential data without complex joins
      const [recentUsers, recentCourses, recentBatches, recentDeletions] = await Promise.all([
        // Recent user registrations
        supabaseAdmin
          .from('profiles')
          .select('id, full_name, role, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(3),

        // Recent course creations
        supabaseAdmin
          .from('courses')
          .select('id, title, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(3),

        // Recent batch creations
        supabaseAdmin
          .from('batches')
          .select('id, name, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(3),

        // Recent GDPR deletion requests (completed)
        supabaseAdmin
          .from('deletion_requests')
          .select('id, target_user_id, request_type, status, completed_at')
          .eq('status', 'completed')
          .gte('completed_at', sevenDaysAgo.toISOString())
          .order('completed_at', { ascending: false })
          .limit(5),
      ])

      const activities: ActivityItem[] = []

      // Add user registrations
      if (recentUsers.data) {
        recentUsers.data.forEach((user) => {
          activities.push({
            id: `user-${user.id}`,
            type: 'user_registration',
            title: 'New User Registration',
            description: `${user.full_name} (${user.role}) joined the platform`,
            timestamp: user.created_at,
            icon: UserPlusIcon,
            iconColor: 'text-blue-600',
          })
        })
      }

      // Add course creations
      if (recentCourses.data) {
        recentCourses.data.forEach((course) => {
          activities.push({
            id: `course-${course.id}`,
            type: 'course_creation',
            title: 'New Course Created',
            description: `Course "${course.title}" was added`,
            timestamp: course.created_at,
            icon: BookIcon,
            iconColor: 'text-green-600',
          })
        })
      }

      // Add batch creations
      if (recentBatches.data) {
        recentBatches.data.forEach((batch) => {
          activities.push({
            id: `batch-${batch.id}`,
            type: 'course_creation',
            title: 'New Batch Created',
            description: `Batch "${batch.name}" was created`,
            timestamp: batch.created_at,
            icon: QueueListIcon,
            iconColor: 'text-indigo-600',
          })
        })
      }

      // Add GDPR deletions
      if (recentDeletions.data) {
        recentDeletions.data.forEach((deletion) => {
          const isFullAccount = deletion.request_type === 'full_account'
          activities.push({
            id: `deletion-${deletion.id}`,
            type: isFullAccount ? 'account_deletion' : 'data_deletion',
            title: isFullAccount ? 'Account Deleted' : 'Data Deleted',
            description: isFullAccount
              ? `User account (ID: ${deletion.target_user_id ? deletion.target_user_id.substring(0, 8) : 'Unknown'}...) was permanently deleted`
              : `User data (ID: ${deletion.target_user_id ? deletion.target_user_id.substring(0, 8) : 'Unknown'}...) was deleted`,
            timestamp: deletion.completed_at!,
            icon: ShieldExclamationIcon,
            iconColor: isFullAccount ? 'text-red-600' : 'text-orange-600',
          })
        })
      }

      // Sort all activities by timestamp (most recent first) and take top 9
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setActivities(activities.slice(0, 9))
    } catch (error) {
      console.error('Error loading recent activities:', error)
      setActivities([])
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
    {
      title: 'Total Batches',
      value: stats.totalBatches,
      icon: QueueListIcon,
      color: 'bg-orange-500',
      change: 'All time',
    },
    {
      title: 'Active Batches',
      value: stats.activeBatches,
      icon: QueueListIcon,
      color: 'bg-emerald-500',
      change: 'Currently running',
    },
  ]
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, index) => (
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <UsersIcon className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="text-sm font-medium text-gray-900">Add New User</h3>
              <p className="text-xs text-gray-500">Create student or teacher account</p>
            </button>
            <button
              onClick={() => navigate('/admin/courses')}
              className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <BookOpenIcon className="h-6 w-6 text-green-600 mb-2" />
              <h3 className="text-sm font-medium text-gray-900">Create Course</h3>
              <p className="text-xs text-gray-500">Set up a new course</p>
            </button>
            <button
              onClick={() => navigate('/admin/batches')}
              className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <QueueListIcon className="h-6 w-6 text-orange-600 mb-2" />
              <h3 className="text-sm font-medium text-gray-900">Manage Batches</h3>
              <p className="text-xs text-gray-500">Create and organize student batches</p>
            </button>
            <button
              onClick={() => navigate('/admin/enrollments')}
              className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600 mb-2" />
              <h3 className="text-sm font-medium text-gray-900">Manage Enrollments</h3>
              <p className="text-xs text-gray-500">Review pending enrollments</p>
            </button>
            <button
              onClick={() => navigate('/admin/analytics')}
              className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ChartBarIcon className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="text-sm font-medium text-gray-900">View Reports</h3>
              <p className="text-xs text-gray-500">Analytics and insights</p>
            </button>
            <button
              onClick={() => navigate('/admin/gdpr')}
              className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ShieldExclamationIcon className="h-6 w-6 text-red-600 mb-2" />
              <h3 className="text-sm font-medium text-gray-900">GDPR Requests</h3>
              <p className="text-xs text-gray-500">Manage data deletion requests</p>
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
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No recent activity</p>
              <p className="text-sm">Activity from the last 30 days will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-2 rounded-lg bg-gray-50`}>
                    <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default AdminDashboard
