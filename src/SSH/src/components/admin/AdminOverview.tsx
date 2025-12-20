import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { getEnrollmentStats } from '@/lib/api/enrollments'
import { getAllUsers } from '@/lib/api/users'
import { getCourses } from '@/lib/api/courses'
import { getGurukuls } from '@/lib/api/gurukuls'
import { getConsentStats } from '../../lib/api/consent'
import {
  UserGroupIcon,
  BookOpenIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
interface DashboardStats {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  totalGurukuls: number
  totalEnrollments: number
  pendingEnrollments: number
  completedEnrollments: number
  consentGiven: number
  consentNotGiven: number
  consentWithdrawn: number
  recentActivity: Array<{
    type: string
    message: string
    time: string
  }>
}
export default function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalGurukuls: 0,
    totalEnrollments: 0,
    pendingEnrollments: 0,
    completedEnrollments: 0,
    consentGiven: 0,
    consentNotGiven: 0,
    consentWithdrawn: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    loadStats()
  }, [])
  const loadStats = async () => {
    try {
      const [users, coursesResult, gurukulsResult, enrollmentStats, consentStats] =
        await Promise.all([
          getAllUsers(),
          getCourses(),
          getGurukuls(),
          getEnrollmentStats(),
          getConsentStats(),
        ])
      const courses = coursesResult.courses
      const gurukuls = gurukulsResult.gurukuls
      const students = users.filter((u) => u.role === 'student')
      const teachers = users.filter((u) => u.role === 'teacher')
      setStats({
        totalUsers: users.length,
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalCourses: courses.length,
        totalGurukuls: gurukuls.length,
        totalEnrollments: enrollmentStats.total,
        pendingEnrollments: enrollmentStats.pending,
        completedEnrollments: enrollmentStats.completed,
        consentGiven: consentStats.consented,
        consentNotGiven: consentStats.not_consented,
        consentWithdrawn: consentStats.withdrawn,
        recentActivity: [
          {
            type: 'enrollment',
            message: 'New student enrolled in Hindu Philosophy',
            time: '2 hours ago',
          },
          { type: 'course', message: 'Sanskrit Basics course updated', time: '4 hours ago' },
          { type: 'user', message: 'New teacher account created', time: '6 hours ago' },
          { type: 'certificate', message: '5 certificates issued', time: '1 day ago' },
        ],
      })
    } catch (error) {
      console.error('Error loading admin overview:', error)
    } finally {
      setLoading(false)
    }
  }
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Students',
      value: stats.totalStudents,
      icon: AcademicCapIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Teachers',
      value: stats.totalTeachers,
      icon: UserGroupIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Courses',
      value: stats.totalCourses,
      icon: BookOpenIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Gurukuls',
      value: stats.totalGurukuls,
      icon: DocumentTextIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Total Enrollments',
      value: stats.totalEnrollments,
      icon: ChartBarIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingEnrollments,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Completed',
      value: stats.completedEnrollments,
      icon: CheckCircleIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ]
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Enrollment Trends */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
                Enrollment Overview
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Total Enrollments</p>
                    <p className="text-sm text-gray-600">All time</p>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalEnrollments}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="font-medium text-yellow-800">Pending</p>
                    <p className="text-xl font-bold text-yellow-600">{stats.pendingEnrollments}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-800">Completed</p>
                    <p className="text-xl font-bold text-green-600">{stats.completedEnrollments}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Recent Activity and Consent Stats */}
        <div className="space-y-4">
          {/* Consent Statistics */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Student Consent Status
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">Consented</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{stats.consentGiven}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800">No Consent</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-600">{stats.consentNotGiven}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-800">Withdrawn</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">{stats.consentWithdrawn}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'enrollment'
                          ? 'bg-blue-500'
                          : activity.type === 'course'
                            ? 'bg-green-500'
                            : activity.type === 'user'
                              ? 'bg-purple-500'
                              : 'bg-orange-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
