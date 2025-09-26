import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'
import { useRoleBasedUI } from '../../contexts/PermissionContext'
import { Badge } from '../../components/ui/Badge'
import { Enrollment, Certificate, Course } from '../../types'
import { getStudentEnrollments } from '../../lib/api/enrollments'
import { getStudentCertificates } from '../../lib/api/certificates'
import { getCourses } from '../../lib/api/courses'
import { enrollInCourse } from '../../lib/api/enrollments'
import { getUserProfile } from '../../lib/api/users'
import { getCountryName, getStateName } from '../../lib/address-utils'
import toast from 'react-hot-toast'
import type { Database } from '../../lib/supabase'
type Profile = Database['public']['Tables']['profiles']['Row']
// Extended profile interface that includes address fields from database
interface ProfileWithAddress {
  id: string
  email: string
  full_name: string
  phone?: string
  date_of_birth?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
}
import {
  HomeIcon,
  BookOpenIcon,
  UserIcon,
  TrophyIcon,
  FireIcon,
  StarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CogIcon,
  SunIcon,
  MoonIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import ChatBotTrigger from '../../components/chat/ChatBotTrigger'
import ProfileEditModal from '../../components/profile/ProfileEditModal'
interface StudentStats {
  totalEnrollments: number
  completedCourses: number
  activeCourses: number
  certificatesEarned: number
  totalSpent: number
  averageGrade: number
  learningStreak: number
  xpPoints: number
  level: string
  completionRate: number
}
export default function StudentDashboard() {
  const { user } = useWebsiteAuth()
  const { isStudent, shouldShowAnalytics, canAccess, getUserRole } = useRoleBasedUI()
  const [activeTab, setActiveTab] = useState<
    'home' | 'courses' | 'enrollments' | 'certificates' | 'profile' | 'analytics' | 'settings'
  >('home')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StudentStats>({
    totalEnrollments: 0,
    completedCourses: 0,
    activeCourses: 0,
    certificatesEarned: 0,
    totalSpent: 0,
    averageGrade: 0,
    learningStreak: 7,
    xpPoints: 1250,
    level: 'Intermediate',
    completionRate: 0,
  })
  // Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  // Student Profile State
  interface StudentProfile {
    id: string
    full_name: string
    phone?: string
    date_of_birth?: string
    address_line_1?: string
    address_line_2?: string
    city?: string
    state?: string
    zip_code?: string
    country?: string
  }
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  // Enrollment Loading State
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)
  useEffect(() => {
    if (user?.id) {
      loadStudentData()
    } else {
      setLoading(false)
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const loadStudentData = async () => {
    try {
      const [enrollmentsData, certificatesData, coursesData] = await Promise.all([
        getStudentEnrollments(user!.id),
        getStudentCertificates(user!.id),
        getCourses(),
      ])
      setEnrollments(enrollmentsData)
      setCertificates(certificatesData)
      setAvailableCourses(coursesData)
      // Calculate stats
      const completedCount = enrollmentsData.filter((e) => e.status === 'completed').length
      const activeCount = enrollmentsData.filter((e) => e.status === 'approved').length
      const totalSpent = enrollmentsData.reduce((sum, e) => sum + (e.course?.price || 0), 0)
      const completionRate =
        enrollmentsData.length > 0 ? (completedCount / enrollmentsData.length) * 100 : 0
      // Calculate average grade from completed enrollments with final_grade
      const gradesFromEnrollments = enrollmentsData
        .filter((e) => e.status === 'completed' && e.final_grade)
        .map((e) => parseFloat(e.final_grade!))
        .filter((grade) => !isNaN(grade))
      const averageGrade =
        gradesFromEnrollments.length > 0
          ? Math.round(
              gradesFromEnrollments.reduce((sum, grade) => sum + grade, 0) /
                gradesFromEnrollments.length,
            )
          : 0
      // Calculate learning streak from recent completion dates
      const completedEnrollments = enrollmentsData
        .filter((e) => e.status === 'completed' && e.completed_at)
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      let learningStreak = 0
      if (completedEnrollments.length > 0) {
        const today = new Date()
        const oneDayMs = 24 * 60 * 60 * 1000
        let currentDate = new Date(today)
        for (const enrollment of completedEnrollments) {
          const completedDate = new Date(enrollment.completed_at!)
          const daysDiff = Math.floor((currentDate.getTime() - completedDate.getTime()) / oneDayMs)
          if (daysDiff <= 1) {
            learningStreak++
            currentDate = completedDate
          } else {
            break
          }
        }
      }
      // Calculate XP points based on real achievements
      const baseXP = completedCount * 100 // 100 XP per completed course
      const certificateXP = certificatesData.length * 50 // 50 XP per certificate
      const progressXP = enrollmentsData
        .filter((e) => e.status === 'approved')
        .reduce((sum, e) => sum + (e.progress_percentage || 0), 0) // 1 XP per progress percentage point
      const xpPoints = baseXP + certificateXP + Math.round(progressXP)
      setStats({
        totalEnrollments: enrollmentsData.length,
        completedCourses: completedCount,
        activeCourses: activeCount,
        certificatesEarned: certificatesData.length,
        totalSpent,
        averageGrade,
        learningStreak,
        xpPoints,
        level: completedCount < 3 ? 'Beginner' : completedCount < 8 ? 'Intermediate' : 'Advanced',
        completionRate,
      })
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }
  // Load student profile from database
  const loadStudentProfile = useCallback(async () => {
    if (!user?.id) return
    try {
      const profile = await getUserProfile(user.id)
      if (profile) {
        // Cast to ProfileWithAddress since database has flat address fields
        const profileWithAddress = profile as unknown as ProfileWithAddress
        const studentProfileData = {
          id: profileWithAddress.id,
          full_name: profileWithAddress.full_name,
          phone: profileWithAddress.phone || undefined,
          date_of_birth: profileWithAddress.date_of_birth || undefined,
          address_line_1: profileWithAddress.address_line_1 || undefined,
          address_line_2: profileWithAddress.address_line_2 || undefined,
          city: profileWithAddress.city || undefined,
          state: profileWithAddress.state || undefined,
          zip_code: profileWithAddress.zip_code || undefined,
          country: profileWithAddress.country || undefined,
        }
        setStudentProfile(studentProfileData)
      }
    } catch {
      // Error loading student profile - silent fail
    }
  }, [user?.id])
  // Load profile when component mounts
  useEffect(() => {
    if (user?.id) {
      loadStudentProfile()
    }
  }, [user?.id, loadStudentProfile])
  const handleEnrollment = async (courseId: string) => {
    if (!user?.id) {
      toast.error('Please log in to enroll in courses')
      return
    }
    try {
      setEnrollingCourseId(courseId)
      await enrollInCourse(courseId, user.id)
      // Reload student data to reflect new enrollment
      await loadStudentData()
      // Switch to enrollments tab to show the new pending enrollment
      setActiveTab('enrollments')
      toast.success('Successfully enrolled! Your enrollment is pending teacher approval.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to enroll in course')
    } finally {
      setEnrollingCourseId(null)
    }
  }
  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { greeting: 'Good morning', icon: SunIcon }
    if (hour < 18) return { greeting: 'Good afternoon', icon: SunIcon }
    return { greeting: 'Good evening', icon: MoonIcon }
  }
  const { greeting, icon: TimeIcon } = getTimeOfDay()
  const tabs = [
    {
      id: 'home',
      name: 'Home',
      icon: HomeIcon,
      description: 'Your Learning Hub',
      gradient: 'from-blue-500 to-purple-600',
      available: true,
    },
    {
      id: 'courses',
      name: 'My Courses',
      icon: BookOpenIcon,
      description: 'View enrolled courses and progress',
      gradient: 'from-green-500 to-teal-600',
      badge: stats.activeCourses > 0 ? stats.activeCourses : undefined,
      available: canAccess('courses', 'read'),
    },
    {
      id: 'enrollments',
      name: 'My Enrollments',
      icon: ClipboardDocumentListIcon,
      description: 'Track enrollment status and history',
      gradient: 'from-blue-500 to-indigo-600',
      badge:
        enrollments.filter((e) => e.status === 'pending').length > 0
          ? enrollments.filter((e) => e.status === 'pending').length
          : undefined,
      available: canAccess('enrollments', 'read'),
    },
    {
      id: 'certificates',
      name: 'My Certificates',
      icon: AcademicCapIcon,
      description: 'Download earned certificates',
      gradient: 'from-yellow-500 to-orange-600',
      badge: stats.certificatesEarned > 0 ? stats.certificatesEarned : undefined,
      available: canAccess('certificates', 'read'),
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: UserIcon,
      description: 'Personal Settings',
      gradient: 'from-pink-500 to-rose-600',
      available: true,
    },
    // Conditional admin tabs
    ...(shouldShowAnalytics()
      ? [
          {
            id: 'analytics',
            name: 'Analytics',
            icon: ChartBarIcon,
            description: 'System analytics and reports',
            gradient: 'from-purple-500 to-indigo-600',
            available: shouldShowAnalytics(),
          },
        ]
      : []),
    ...(canAccess('settings', 'read')
      ? [
          {
            id: 'settings',
            name: 'Settings',
            icon: CogIcon,
            description: 'Configure system settings',
            gradient: 'from-gray-500 to-slate-600',
            available: canAccess('settings', 'read'),
          },
        ]
      : []),
  ].filter((tab) => tab.available)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center pt-16 lg:pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-6 border-4 border-blue-200 border-t-blue-600 rounded-full"
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Dashboard</h3>
            <p className="text-gray-600">Preparing your learning workspace...</p>
          </motion.div>
        </motion.div>
      </div>
    )
  }
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16 lg:pt-20">
        {/* Enhanced Modern Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-16 lg:top-20 z-40 shadow-lg"
        >
          <div className="container-max py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="h-16 w-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl"
                >
                  <BookOpenIcon className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3 mb-2"
                  >
                    <TimeIcon className="h-6 w-6 text-amber-500" />
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                      {greeting}, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
                    </h1>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 text-lg"
                  >
                    Ready to continue your amazing learning journey?
                  </motion.p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 bg-white/50 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  >
                    <TrophyIcon className="h-6 w-6 text-amber-600" />
                  </motion.div>
                  {stats.certificatesEarned > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse shadow-lg"
                    >
                      {stats.certificatesEarned}
                    </motion.span>
                  )}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200 px-4 py-2 text-sm font-semibold shadow-lg">
                    <StarIcon className="h-5 w-5 mr-2 fill-current" />
                    Level {stats.level}
                  </Badge>
                </motion.div>
              </div>
            </div>
            {/* Enhanced Navigation Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 flex gap-4 bg-white/50 backdrop-blur-sm p-3 rounded-2xl w-fit border border-white/20 shadow-lg"
            >
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveTab(
                      tab.id as
                        | 'home'
                        | 'courses'
                        | 'enrollments'
                        | 'certificates'
                        | 'profile'
                        | 'analytics'
                        | 'settings',
                    )
                    // Scroll to top of page
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`relative flex items-center space-x-3 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-md'
                  }`}
                >
                  <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-white' : ''}`} />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg"
                    >
                      {tab.badge}
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.div>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <AnimatePresence mode="wait">
            {/* Home Tab */}
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    {
                      title: 'Active Courses',
                      value: stats.activeCourses,
                      icon: BookOpenIcon,
                      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
                      bgGradient: 'from-blue-50 via-blue-100 to-indigo-100',
                      message: 'Keep learning! 📚',
                      delay: 0.1,
                    },
                    {
                      title: 'Completed Courses',
                      value: stats.completedCourses,
                      icon: CheckCircleIcon,
                      gradient: 'from-green-500 via-emerald-600 to-teal-600',
                      bgGradient: 'from-green-50 via-emerald-100 to-teal-100',
                      message: 'Amazing progress! 🎉',
                      delay: 0.2,
                    },
                    {
                      title: 'Certificates',
                      value: stats.certificatesEarned,
                      icon: TrophyIcon,
                      gradient: 'from-purple-500 via-violet-600 to-purple-600',
                      bgGradient: 'from-purple-50 via-violet-100 to-purple-100',
                      message: "You're a star! ⭐",
                      delay: 0.3,
                    },
                    {
                      title: 'Learning Streak',
                      value: `${stats.learningStreak} days`,
                      icon: FireIcon,
                      gradient: 'from-orange-500 via-red-500 to-pink-600',
                      bgGradient: 'from-orange-50 via-red-100 to-pink-100',
                      message: 'On fire! 🔥',
                      delay: 0.4,
                    },
                  ].map((stat) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: stat.delay,
                        duration: 0.6,
                        type: 'spring',
                        stiffness: 100,
                      }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="group"
                    >
                      <div className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative rounded-xl p-8">
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
                        />
                        <div className="relative">
                          <div className="flex items-center justify-between">
                            <div className="space-y-3">
                              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">
                                {stat.title}
                              </p>
                              <motion.p
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: stat.delay + 0.2 }}
                                className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                              >
                                {typeof stat.value === 'string'
                                  ? stat.value
                                  : stat.value.toLocaleString()}
                              </motion.p>
                              <p className="text-sm text-gray-500">{stat.message}</p>
                            </div>
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                delay: stat.delay + 0.3,
                                type: 'spring',
                                stiffness: 200,
                              }}
                              whileHover={{ scale: 1.2, rotate: 10 }}
                              className={`h-16 w-16 bg-gradient-to-r ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                            >
                              <stat.icon className="h-8 w-8 text-white" />
                            </motion.div>
                          </div>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: stat.delay + 0.5, duration: 1 }}
                            className="mt-6"
                          >
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '75%' }}
                                transition={{ delay: stat.delay + 0.7, duration: 1.5 }}
                                className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full`}
                              />
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {/* Learning Progress Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 border border-white/20"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      📈 Learning Progress Overview
                    </h3>
                    <div className="text-sm text-gray-500">
                      Overall completion: {Math.round(stats.completionRate)}%
                    </div>
                  </div>
                  {/* Overall Progress Bar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Overall Learning Progress
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round(stats.completionRate)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.completionRate}%` }}
                        transition={{ delay: 0.8, duration: 2, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full relative overflow-hidden"
                      >
                        <motion.div
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                      </motion.div>
                    </div>
                  </div>
                  {/* Active Course Progress */}
                  {enrollments.filter((e) => e.status === 'approved').length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">
                        Active Course Progress
                      </h4>
                      {enrollments
                        .filter((e) => e.status === 'approved')
                        .slice(0, 3)
                        .map((enrollment, index) => {
                          const progress = enrollment.progress_percentage || 0 // Use real progress from database
                          return (
                            <motion.div
                              key={enrollment.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.0 + index * 0.1, duration: 0.5 }}
                              className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900">
                                  {enrollment.course?.title}
                                </h5>
                                <span className="text-sm text-gray-500">
                                  {Math.round(progress)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{
                                    delay: 1.2 + index * 0.1,
                                    duration: 1.5,
                                    ease: 'easeOut',
                                  }}
                                  className={`h-full rounded-full ${
                                    progress < 30
                                      ? 'bg-gradient-to-r from-red-400 to-red-500'
                                      : progress < 70
                                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                        : 'bg-gradient-to-r from-green-400 to-green-500'
                                  }`}
                                />
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                {progress < 30
                                  ? 'Just getting started 🌱'
                                  : progress < 70
                                    ? 'Making great progress! 🚀'
                                    : 'Almost there! 🎯'}
                              </div>
                            </motion.div>
                          )
                        })}
                    </div>
                  )}
                  {/* Learning Goals */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Learning Goals 🎯</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.4, duration: 0.5 }}
                        className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                      >
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {stats.activeCourses}/5
                        </div>
                        <div className="text-sm text-gray-600">Active Courses Goal</div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.5, duration: 0.5 }}
                        className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200"
                      >
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {stats.learningStreak}/30
                        </div>
                        <div className="text-sm text-gray-600">Days Streak Goal</div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.6, duration: 0.5 }}
                        className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                      >
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {stats.certificatesEarned}/10
                        </div>
                        <div className="text-sm text-gray-600">Certificates Goal</div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
                {/* Available Features Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Available Features */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
                      Available Features
                    </h3>
                    <div className="space-y-3">
                      {[
                        {
                          name: 'My Courses',
                          icon: BookOpenIcon,
                          description: 'View enrolled courses and progress',
                          available: canAccess('courses', 'read'),
                        },
                        {
                          name: 'My Enrollments',
                          icon: ClipboardDocumentListIcon,
                          description: 'Track enrollment status and history',
                          available: canAccess('enrollments', 'read'),
                        },
                        {
                          name: 'My Certificates',
                          icon: AcademicCapIcon,
                          description: 'Download earned certificates',
                          available: canAccess('certificates', 'read'),
                        },
                      ]
                        .filter((item) => item.available)
                        .map((item, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <item.icon className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.description}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  {/* Administrative Features (if available) */}
                  {!isStudent() && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <StarIcon className="h-6 w-6 text-blue-500 mr-2" />
                        Administrative Features
                      </h3>
                      <div className="space-y-3">
                        {[
                          {
                            name: 'Analytics Dashboard',
                            icon: ChartBarIcon,
                            description: 'System analytics and reports',
                            available: shouldShowAnalytics(),
                          },
                          {
                            name: 'System Settings',
                            icon: CogIcon,
                            description: 'Configure system settings',
                            available: canAccess('settings', 'read'),
                          },
                        ]
                          .filter((item) => item.available)
                          .map((item, idx) => (
                            <div key={idx} className="flex items-start space-x-3">
                              <item.icon className="h-5 w-5 text-blue-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.description}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* My Courses Tab */}
          {activeTab === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  My Learning Journey 📚
                </h2>
                <p className="text-xl text-gray-600">Track your progress and continue learning</p>
              </div>
              {/* Course Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments
                  .filter((e) => e.status === 'approved')
                  .map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {enrollment.course?.title}
                        </h3>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Active
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{enrollment.course?.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-semibold">
                            {enrollment.progress_percentage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full"
                            style={{ width: `${enrollment.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                {enrollments.filter((e) => e.status === 'approved').length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Courses</h3>
                    <p className="text-gray-500">
                      Enroll in courses to start your learning journey!
                    </p>
                  </div>
                )}
              </div>
              {/* Course Suggestions */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Recommended Courses for You 🎯</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableCourses
                    .filter((course) => !enrollments.some((e) => e.course?.id === course.id))
                    .slice(0, 6)
                    .map((course) => (
                      <div
                        key={course.id}
                        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              course.level === 'basic' || course.level === 'elementary'
                                ? 'bg-green-100 text-green-800'
                                : course.level === 'intermediate'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {course.level?.charAt(0).toUpperCase() + course.level?.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Duration: {course.duration_weeks} weeks
                          </span>
                          <button
                            onClick={() => handleEnrollment(course.id)}
                            disabled={enrollingCourseId === course.id}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg text-sm hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {enrollingCourseId === course.id ? 'Enrolling...' : 'Enroll Now'}
                          </button>
                        </div>
                      </div>
                    ))}
                  {availableCourses.filter(
                    (course) => !enrollments.some((e) => e.course?.id === course.id),
                  ).length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No Course Suggestions
                      </h3>
                      <p className="text-gray-500">All available courses are already enrolled!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          {/* My Enrollments Tab */}
          {activeTab === 'enrollments' && (
            <motion.div
              key="enrollments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  My Enrollments 📋
                </h2>
                <p className="text-xl text-gray-600">Track your enrollment status and history</p>
              </div>
              {/* Search and Filter Controls */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Courses
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by course title..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Filter
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Level
                    </label>
                    <select
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Levels</option>
                      <option value="elementary">Elementary</option>
                      <option value="basic">Basic</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Enrollment Status Cards */}
              <div className="space-y-4">
                {enrollments
                  .filter((enrollment) => {
                    const matchesSearch =
                      searchTerm === '' ||
                      enrollment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      enrollment.course?.course_number
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    const matchesStatus =
                      statusFilter === 'all' || enrollment.status === statusFilter
                    const matchesLevel =
                      courseFilter === 'all' || enrollment.course?.level === courseFilter
                    return matchesSearch && matchesStatus && matchesLevel
                  })
                  .map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {enrollment.course?.title || 'Course Title Not Available'}
                            </h3>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                enrollment.course?.level === 'basic' ||
                                enrollment.course?.level === 'elementary'
                                  ? 'bg-green-100 text-green-800'
                                  : enrollment.course?.level === 'intermediate'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {enrollment.course?.level
                                ? enrollment.course.level.charAt(0).toUpperCase() +
                                  enrollment.course.level.slice(1)
                                : 'Unknown'}{' '}
                              Level
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              Enrolled: {new Date(enrollment.created_at).toLocaleDateString()}
                            </span>
                            {enrollment.completed_at && (
                              <>
                                <span>•</span>
                                <span>
                                  Completed:{' '}
                                  {new Date(enrollment.completed_at).toLocaleDateString()}
                                </span>
                              </>
                            )}
                            {enrollment.course?.duration_weeks && (
                              <>
                                <span>•</span>
                                <span>Duration: {enrollment.course.duration_weeks} weeks</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              enrollment.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : enrollment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : enrollment.status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                {enrollments.length === 0 && (
                  <div className="text-center py-12">
                    <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Enrollments</h3>
                    <p className="text-gray-500">Start by enrolling in your first course!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {/* My Certificates Tab */}
          {activeTab === 'certificates' && (
            <motion.div
              key="certificates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  My Achievements 🏆
                </h2>
                <p className="text-xl text-gray-600">
                  Your earned certificates and accomplishments
                </p>
              </div>
              {/* Certificate Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg p-6 border border-yellow-200"
                  >
                    <div className="text-center">
                      <TrophyIcon className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {certificate.course?.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Completed: {new Date(certificate.issued_at).toLocaleDateString()}
                      </p>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">Verification Code</p>
                        <p className="font-mono text-sm bg-white/50 px-2 py-1 rounded">
                          {certificate.verification_code}
                        </p>
                      </div>
                      {certificate.file_url && (
                        <button
                          onClick={() => window.open(certificate.file_url, '_blank')}
                          className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>Download PDF</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {certificates.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <AcademicCapIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No Certificates Yet
                    </h3>
                    <p className="text-gray-500">
                      Complete courses to earn your first certificate!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  My Profile 👤
                </h2>
                <p className="text-xl text-gray-600">
                  Manage your personal information and preferences
                </p>
              </div>
              {/* Learning Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalEnrollments}</div>
                  <div className="text-sm text-gray-500">Total Enrollments</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.completedCourses}</div>
                  <div className="text-sm text-gray-500">Completed Courses</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.certificatesEarned}
                  </div>
                  <div className="text-sm text-gray-500">Certificates Earned</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20 text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.learningStreak}</div>
                  <div className="text-sm text-gray-500">Day Streak</div>
                </div>
              </div>
              {/* Profile Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <UserIcon className="h-8 w-8 text-gray-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                  </div>
                  <button
                    onClick={async () => {
                      if (!studentProfile) {
                        await loadStudentProfile()
                      }
                      setIsProfileModalOpen(true)
                    }}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <span>✏️</span>
                    <span>Edit Profile</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                      Personal Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-gray-900">{user?.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{studentProfile?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-gray-900">
                          {studentProfile?.date_of_birth
                            ? new Date(studentProfile.date_of_birth).toLocaleDateString()
                            : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Role</label>
                        <p className="text-gray-900">
                          {getUserRole()?.replace('_', ' ').toUpperCase() || 'Student'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Address Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                      Address Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Street Address</label>
                        <p className="text-gray-900">
                          {studentProfile?.address_line_1 || 'Not provided'}
                        </p>
                        {studentProfile?.address_line_2 && (
                          <p className="text-gray-900">{studentProfile.address_line_2}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Show city only if available */}
                        {studentProfile?.city && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">City</label>
                            <p className="text-gray-900">{studentProfile.city}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-500">State</label>
                          <p className="text-gray-900">
                            {studentProfile?.state && studentProfile?.country
                              ? getStateName(studentProfile.country, studentProfile.state) ||
                                studentProfile.state
                              : 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">ZIP Code</label>
                          <p className="text-gray-900">
                            {studentProfile?.zip_code || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Country</label>
                          <p className="text-gray-900">
                            {studentProfile?.country
                              ? getCountryName(studentProfile.country) || studentProfile.country
                              : 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {/* Analytics Tab (Admin Only) */}
          {activeTab === 'analytics' && shouldShowAnalytics() && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Analytics Dashboard 📊
                </h2>
                <p className="text-xl text-gray-600">System analytics and reports</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/20">
                <div className="flex items-center space-x-4 mb-6">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  <h3 className="text-xl font-semibold text-gray-900">System Analytics</h3>
                </div>
                <p className="text-gray-600">
                  Advanced analytics and reporting features are available here for users with
                  appropriate permissions.
                </p>
              </div>
            </motion.div>
          )}
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
                  Account Settings ⚙️
                </h2>
                <p className="text-xl text-gray-600">
                  Manage your account preferences and information
                </p>
              </div>
              {/* Account Settings Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <CogIcon className="h-8 w-8 text-gray-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Account Information</h3>
                  </div>
                  <button
                    onClick={async () => {
                      if (!studentProfile) {
                        await loadStudentProfile()
                      }
                      setIsProfileModalOpen(true)
                    }}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                      Personal Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-gray-900">{user?.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{studentProfile?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-gray-900">
                          {studentProfile?.date_of_birth
                            ? new Date(studentProfile.date_of_birth).toLocaleDateString()
                            : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Address Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                      Address Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Street Address</label>
                        <p className="text-gray-900">
                          {studentProfile?.address_line_1 || 'Not provided'}
                        </p>
                        {studentProfile?.address_line_2 && (
                          <p className="text-gray-900">{studentProfile.address_line_2}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">City</label>
                          <p className="text-gray-900">{studentProfile?.city || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">State</label>
                          <p className="text-gray-900">{studentProfile?.state || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">ZIP Code</label>
                          <p className="text-gray-900">
                            {studentProfile?.zip_code || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Country</label>
                          <p className="text-gray-900">
                            {studentProfile?.country || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* System Settings (Admin Only) */}
              {canAccess('settings', 'read') && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/20">
                  <div className="flex items-center space-x-4 mb-6">
                    <CogIcon className="h-8 w-8 text-purple-600" />
                    <h3 className="text-xl font-semibold text-gray-900">System Configuration</h3>
                  </div>
                  <p className="text-gray-600">
                    Advanced system configuration options are available here for users with
                    administrative permissions.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      <ChatBotTrigger />
      {/* Profile Edit Modal */}
      {isProfileModalOpen && user && (
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={
            studentProfile
              ? ({
                  ...user,
                  // Override with address data from studentProfile which has the latest address info
                  address_line_1: studentProfile.address_line_1,
                  address_line_2: studentProfile.address_line_2,
                  city: studentProfile.city,
                  state: studentProfile.state,
                  zip_code: studentProfile.zip_code,
                  country: studentProfile.country,
                } as Profile)
              : (user as Profile)
          }
          onUpdate={async () => {
            // Dynamically refresh profile data after update
            await loadStudentProfile()
          }}
        />
      )}
    </>
  )
}
