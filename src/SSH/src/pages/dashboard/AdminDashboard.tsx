import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AdminOverview from '@/components/admin/AdminOverview'
import EnrollmentManagement from '@/components/admin/EnrollmentManagement'
import UserManagement from '@/components/admin/UserManagement'
import StudentManagement from '@/components/admin/StudentManagement'
import CertificateManagement from '@/components/admin/CertificateManagement'
import ContentManagement from '@/components/admin/ContentManagement'
import CourseManagement from '@/components/admin/CourseManagement'
import GurukulManagement from '@/components/admin/GurukulManagement'
import SiteAnalytics from '@/components/admin/SiteAnalytics'
import { getEnrollmentStats } from '@/lib/api/enrollments'
import { getAllUsers } from '@/lib/api/users'
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BookOpenIcon,
  GlobeAltIcon,
  DocumentDuplicateIcon,
  BellIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  Bars3Icon,
  XMarkIcon,
  ChartPieIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  action: () => void
  color: string
}

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  time: string
  unread: boolean
}

export default function AdminDashboard() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'analytics'
    | 'enrollments'
    | 'students'
    | 'users'
    | 'courses'
    | 'gurukuls'
    | 'certificates'
    | 'content'
  >('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [quickStats, setQuickStats] = useState({
    pendingEnrollments: 0,
    newUsers: 0,
    totalUsers: 0,
  })

  useEffect(() => {
    loadQuickStats()
    loadNotifications()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuickStats = async () => {
    try {
      const [enrollmentStats, users] = await Promise.all([getEnrollmentStats(), getAllUsers()])

      setQuickStats({
        pendingEnrollments: enrollmentStats.pending,
        newUsers: users.filter((u) => {
          const createdDate = new Date(u.created_at)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return createdDate > weekAgo
        }).length,
        totalUsers: users.length,
      })
    } catch (error) {
      console.error('Error loading quick stats:', error)
    }
  }

  const loadNotifications = () => {
    // Mock notifications - in real app, these would come from API
    setNotifications([
      {
        id: '1',
        type: 'warning',
        title: 'Pending Enrollments',
        message: `${quickStats.pendingEnrollments} enrollments need approval`,
        time: '5 min ago',
        unread: true,
      },
      {
        id: '2',
        type: 'info',
        title: 'New User Registration',
        message: '3 new students registered today',
        time: '1 hour ago',
        unread: true,
      },
      {
        id: '3',
        type: 'success',
        title: 'Course Published',
        message: 'Sanskrit Basics course is now live',
        time: '2 hours ago',
        unread: false,
      },
    ])
  }

  const tabs = [
    {
      id: 'overview',
      name: 'Dashboard',
      icon: ChartBarIcon,
      component: AdminOverview,
      description: 'Overview & Analytics',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: ChartPieIcon,
      component: SiteAnalytics,
      description: 'Site Traffic & User Insights',
    },
    {
      id: 'enrollments',
      name: 'Enrollments',
      icon: AcademicCapIcon,
      component: EnrollmentManagement,
      description: 'Manage Student Enrollments',
      badge: quickStats.pendingEnrollments > 0 ? quickStats.pendingEnrollments : undefined,
    },
    {
      id: 'students',
      name: 'Students',
      icon: UserIcon,
      component: StudentManagement,
      description: 'Student Management & Analytics',
    },
    {
      id: 'users',
      name: 'Users',
      icon: UserGroupIcon,
      component: UserManagement,
      description: 'User Management & Roles',
    },
    {
      id: 'courses',
      name: 'Courses',
      icon: BookOpenIcon,
      component: CourseManagement,
      description: 'Course Catalog Management',
    },
    {
      id: 'gurukuls',
      name: 'Gurukuls',
      icon: GlobeAltIcon,
      component: GurukulManagement,
      description: 'Gurukul Management',
    },
    {
      id: 'certificates',
      name: 'Certificates',
      icon: DocumentTextIcon,
      component: CertificateManagement,
      description: 'Certificate Management',
    },
    {
      id: 'content',
      name: 'Content',
      icon: DocumentDuplicateIcon,
      component: ContentManagement,
      description: 'Website Content Management',
    },
  ]

  const quickActions: QuickAction[] = [
    {
      id: 'new-course',
      title: 'Create Course',
      description: 'Add a new course to the catalog',
      icon: PlusIcon,
      action: () => setActiveTab('courses'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'approve-enrollments',
      title: 'Review Enrollments',
      description: `${quickStats.pendingEnrollments} pending approvals`,
      icon: CheckCircleIcon,
      action: () => setActiveTab('enrollments'),
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'manage-users',
      title: 'Manage Users',
      description: 'User roles and permissions',
      icon: UserGroupIcon,
      action: () => setActiveTab('users'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      id: 'issue-certificates',
      title: 'Issue Certificates',
      description: 'Generate student certificates',
      icon: DocumentTextIcon,
      action: () => setActiveTab('certificates'),
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ]

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || AdminOverview
  const activeTabInfo = tabs.find((tab) => tab.id === activeTab)

  const unreadCount = notifications.filter((n) => n.unread).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return ExclamationTriangleIcon
      case 'success':
        return CheckCircleIcon
      case 'error':
        return ExclamationTriangleIcon
      default:
        return BellIcon
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'success':
        return 'text-green-600 bg-green-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-blue-600 bg-blue-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex page-with-header">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">eY</span>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Admin Panel</h2>
                  <p className="text-xs text-gray-500">eYogi Gurukul</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? (
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <Bars3Icon className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                activeTab === tab.id
                  ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <tab.icon
                  className={`h-5 w-5 ${activeTab === tab.id ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                />
                {tab.badge && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <div className="font-medium">{tab.name}</div>
                  <div className="text-xs text-gray-500">{tab.description}</div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'Admin'}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button className="p-1 rounded-md hover:bg-gray-100">
                <Cog6ToothIcon className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{activeTabInfo?.name}</h1>
                <p className="text-sm text-gray-600">{activeTabInfo?.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-64"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg"
                >
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => {
                        const IconComponent = getNotificationIcon(notification.type)
                        return (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                              notification.unread ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={`p-1 rounded-full ${getNotificationColor(notification.type)}`}
                              >
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                              </div>
                              {notification.unread && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="p-4 border-t border-gray-200">
                      <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.full_name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Quick Actions Bar - Only show on overview */}
        {activeTab === 'overview' && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ArrowTrendingUpIcon className="h-4 w-4" />
                <span>Streamline your workflow</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={`${action.color} text-white p-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg`}
                >
                  <div className="flex items-center space-x-3">
                    <action.icon className="h-6 w-6" />
                    <div className="text-left">
                      <p className="font-semibold">{action.title}</p>
                      <p className="text-sm opacity-90">{action.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <ActiveComponent />
          </div>
        </main>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
      )}
    </div>
  )
}
