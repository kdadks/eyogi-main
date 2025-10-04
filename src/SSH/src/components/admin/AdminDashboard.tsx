import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  CheckCircleIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline'
import { supabaseAdmin } from '../../lib/supabase'
import { getBatchStats } from '../../lib/api/batches'
import { User, Course } from '../../types'
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
  type: 'user_registration' | 'course_creation' | 'enrollment' | 'certificate_issued'
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
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
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
        activeUsers: activeUsersResult.count || 0,
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
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30) // Extended to 30 days for more activity data

      console.log('Loading recent activities since:', sevenDaysAgo.toISOString())

      // Fetch recent activities from different tables
      const [recentUsers, recentCourses, recentEnrollments, recentCertificates, recentBatches] =
        await Promise.all([
          // Recent user registrations
          supabaseAdmin
            .from('profiles')
            .select('id, full_name, email, role, created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(5),

          // Recent course creations
          supabaseAdmin
            .from('courses')
            .select('id, title, created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(5),

          // Recent enrollments
          supabaseAdmin
            .from('enrollments')
            .select(
              `
            id,
            enrolled_at,
            profiles!student_id (
              full_name,
              email
            ),
            courses!course_id (
              title
            )
          `,
            )
            .gte('enrolled_at', sevenDaysAgo.toISOString())
            .order('enrolled_at', { ascending: false })
            .limit(5),

          // Recent certificates
          supabaseAdmin
            .from('certificates')
            .select(
              `
            id,
            issued_at,
            profiles!student_id (
              full_name,
              email
            ),
            courses!course_id (
              title
            )
          `,
            )
            .gte('issued_at', sevenDaysAgo.toISOString())
            .order('issued_at', { ascending: false })
            .limit(5),

          // Recent batch creations
          supabaseAdmin
            .from('batches')
            .select('id, name, created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(5),
        ])

      console.log('Recent data fetched:', {
        users: recentUsers.data?.length || 0,
        courses: recentCourses.data?.length || 0,
        enrollments: recentEnrollments.data?.length || 0,
        certificates: recentCertificates.data?.length || 0,
        batches: recentBatches.data?.length || 0,
      })

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

      // Add enrollments
      if (recentEnrollments.data) {
        recentEnrollments.data.forEach((enrollment) => {
          const userProfiles = enrollment.profiles as unknown as User[]
          const courseProfiles = enrollment.courses as unknown as Course[]
          const user = userProfiles?.[0]
          const course = courseProfiles?.[0]
          if (user && course) {
            activities.push({
              id: `enrollment-${enrollment.id}`,
              type: 'enrollment',
              title: 'New Enrollment',
              description: `${user.full_name} enrolled in "${course.title}"`,
              timestamp: enrollment.enrolled_at,
              icon: ClipboardDocumentListIcon,
              iconColor: 'text-yellow-600',
            })
          } else {
            console.log('Enrollment missing user or course data:', { user, course, enrollment })
          }
        })
      }

      // Add certificates
      if (recentCertificates.data) {
        recentCertificates.data.forEach((cert) => {
          const userProfiles = cert.profiles as unknown as User[]
          const courseProfiles = cert.courses as unknown as Course[]
          const user = userProfiles?.[0]
          const course = courseProfiles?.[0]
          if (user && course) {
            activities.push({
              id: `certificate-${cert.id}`,
              type: 'certificate_issued',
              title: 'Certificate Issued',
              description: `${user.full_name} completed "${course.title}"`,
              timestamp: cert.issued_at,
              icon: CheckCircleIcon,
              iconColor: 'text-purple-600',
            })
          } else {
            console.log('Certificate missing user or course data:', { user, course, cert })
          }
        })
      }

      // Add batch creations
      if (recentBatches.data) {
        recentBatches.data.forEach((batch) => {
          activities.push({
            id: `batch-${batch.id}`,
            type: 'course_creation', // Reusing type for consistency
            title: 'New Batch Created',
            description: `Batch "${batch.name}" was created`,
            timestamp: batch.created_at,
            icon: QueueListIcon,
            iconColor: 'text-indigo-600',
          })
        })
      }

      // Sort all activities by timestamp (most recent first) and take top 10
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      console.log('Final activities:', activities.length, activities)
      setActivities(activities.slice(0, 10))
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            <button
              onClick={() => navigate('/admin/batches')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <QueueListIcon className="h-8 w-8 text-orange-600 mb-2" />
              <h3 className="font-medium text-gray-900">Manage Batches</h3>
              <p className="text-sm text-gray-500">Create and organize student batches</p>
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
