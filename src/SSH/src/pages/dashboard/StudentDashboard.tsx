import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'
import { useRoleBasedUI } from '../../contexts/PermissionContext'
import { Badge } from '../../components/ui/Badge'

import { Button } from '../../components/ui/Button'
import { Enrollment, Certificate, Course, StudentBatchProgress } from '../../types'
import { getStudentEnrollments, getStudentCourseProgress } from '../../lib/api/enrollments'
import { getStudentCertificates } from '../../lib/api/certificates'
import { getCourses } from '../../lib/api/courses'
import { enrollInCourse } from '../../lib/api/enrollments'
import { getUserProfile } from '../../lib/api/users'
import { getStudentBatches, getStudentBatchProgress } from '../../lib/api/batches'
import { sanitizeHtml } from '../../utils/sanitize'
import { getCountryName, getStateName } from '../../lib/address-utils'
import DashboardComplianceSection from '../../components/compliance/DashboardComplianceSection'
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
  QueueListIcon,
  SunIcon,
  MoonIcon,
  PencilIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import ChatBotTrigger from '../../components/chat/ChatBotTrigger'
import ProfileEditModal from '../../components/profile/ProfileEditModal'
interface StudentStats {
  totalEnrollments: number
  completedCourses: number
  activeCourses: number
  certificatesEarned: number
  totalBatches: number
  totalSpent: number
  averageGrade: number
  learningStreak: number
  xpPoints: number
  level: string
  completionRate: number
}
export default function StudentDashboard() {
  const { user, canAccess } = useWebsiteAuth()
  const { isStudent, shouldShowAnalytics, getUserRole } = useRoleBasedUI()
  const [activeTab, setActiveTab] = useState<
    | 'home'
    | 'courses'
    | 'enrollments'
    | 'certificates'
    | 'batches'
    | 'profile'
    | 'analytics'
    | 'settings'
  >('home')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])

  const [batchProgress, setBatchProgress] = useState<StudentBatchProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StudentStats>({
    totalEnrollments: 0,
    completedCourses: 0,
    activeCourses: 0,
    certificatesEarned: 0,
    totalBatches: 0,
    totalSpent: 0,
    averageGrade: 0,
    learningStreak: 0,
    xpPoints: 0,
    level: 'Beginner',
    completionRate: 0,
  })
  // Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const achievementsRef = useRef<HTMLDivElement>(null)

  // Close achievements panel when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (achievementsRef.current && !achievementsRef.current.contains(event.target as Node)) {
        setShowAchievements(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAchievements(false)
      }
    }

    if (showAchievements) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [showAchievements])

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
  // Course Progress State
  const [courseProgressData, setCourseProgressData] = useState<Record<string, number>>({})
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
      const [
        enrollmentsData,
        certificatesData,
        coursesData,
        batchesData,
        batchProgressData,
        courseProgressData,
      ] = await Promise.all([
        getStudentEnrollments(user!.id),
        getStudentCertificates(user!.id),
        getCourses(),
        getStudentBatches(user!.id),
        getStudentBatchProgress(user!.id),
        getStudentCourseProgress(user!.id),
      ])
      setEnrollments(enrollmentsData)
      setCertificates(certificatesData)
      setAvailableCourses(coursesData)

      setBatchProgress(batchProgressData)
      setCourseProgressData(courseProgressData)

      // Calculate stats using real progress data from course_progress table
      // Count completed courses based on 100% progress in course_progress table only
      const completedCount = enrollmentsData.filter((enrollment) => {
        const courseId = enrollment.course?.id || enrollment.course_id
        const progress = courseProgressData[courseId] || 0
        const isCompleted = progress >= 100
        if (isCompleted) {
          console.log(`✅ Course completed: ${enrollment.course?.title} with ${progress}% progress`)
        }
        return isCompleted // Only count courses with 100% actual progress
      }).length

      // Active courses are those that are approved and not yet 100% completed
      const activeCount = enrollmentsData.filter((enrollment) => {
        if (enrollment.status !== 'approved') return false
        const courseId = enrollment.course?.id || enrollment.course_id
        const progress = courseProgressData[courseId] || 0
        return progress < 100
      }).length
      const totalSpent = enrollmentsData.reduce((sum, e) => sum + (e.course?.price || 0), 0)

      // Calculate overall completion rate using real progress data
      const totalProgressSum = enrollmentsData
        .filter((e) => e.status === 'approved' || e.status === 'completed')
        .reduce((sum, enrollment) => {
          const courseId = enrollment.course?.id || enrollment.course_id
          return sum + (courseProgressData[courseId] || 0)
        }, 0)
      const completionRate =
        enrollmentsData.length > 0 ? totalProgressSum / enrollmentsData.length : 0

      // Calculate average grade from completed courses with real progress data
      const completedCoursesWithProgress = enrollmentsData.filter((enrollment) => {
        const courseId = enrollment.course?.id || enrollment.course_id
        const progress = courseProgressData[courseId] || 0
        return progress >= 100 && enrollment.final_grade
      })
      const gradesFromProgress = completedCoursesWithProgress
        .map((e) => parseFloat(e.final_grade!))
        .filter((grade) => !isNaN(grade))
      const averageGrade =
        gradesFromProgress.length > 0
          ? Math.round(
              gradesFromProgress.reduce((sum, grade) => sum + grade, 0) / gradesFromProgress.length,
            )
          : 0

      // Calculate learning streak based on completed courses from progress data
      const completedWithProgress = enrollmentsData
        .filter((enrollment) => {
          const courseId = enrollment.course?.id || enrollment.course_id
          const progress = courseProgressData[courseId] || 0
          return progress >= 100 && enrollment.completed_at
        })
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())

      let learningStreak = 0
      if (completedWithProgress.length > 0) {
        const today = new Date()
        const oneDayMs = 24 * 60 * 60 * 1000
        let currentDate = new Date(today)
        for (const enrollment of completedWithProgress) {
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
      // Calculate XP points based on real progress data
      const baseXP = completedCount * 100 // 100 XP per completed course
      const certificateXP = certificatesData.length * 50 // 50 XP per certificate
      const progressXP = enrollmentsData
        .filter((e) => e.status === 'approved' || e.status === 'completed')
        .reduce((sum, enrollment) => {
          const courseId = enrollment.course?.id || enrollment.course_id
          return sum + (courseProgressData[courseId] || 0)
        }, 0) // 1 XP per progress percentage point from real progress data
      const xpPoints = baseXP + certificateXP + Math.round(progressXP)
      setStats({
        totalEnrollments: enrollmentsData.length,
        completedCourses: completedCount,
        activeCourses: activeCount,
        certificatesEarned: certificatesData.length,
        totalBatches: batchesData.length,
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

  // Achievements and progress data
  const achievements = [
    // Earned certificates
    ...certificates.map((cert) => ({
      id: cert.id,
      type: 'certificate' as const,
      title: 'Certificate Earned',
      description: `Certificate for ${cert.course?.title || 'course completion'}`,
      icon: TrophyIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      date: new Date(cert.issued_at || new Date().toISOString()),
      points: 50,
      action: () => setActiveTab('certificates'),
    })),
    // Completed courses
    ...enrollments
      .filter((e) => e.status === 'completed')
      .map((enrollment) => ({
        id: `course-${enrollment.id}`,
        type: 'completion' as const,
        title: 'Course Completed',
        description: `Successfully completed ${enrollment.course?.title || 'course'}`,
        icon: CheckCircleIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        date: new Date(enrollment.completed_at || enrollment.updated_at),
        points: 100,
        action: () => setActiveTab('courses'),
      })),
    // Progress milestones
    ...enrollments
      .filter((e) => {
        const courseId = e.course?.id || e.course_id
        const progress = courseProgressData[courseId] || 0
        return progress >= 50 && e.status !== 'completed'
      })
      .map((enrollment) => {
        const courseId = enrollment.course?.id || enrollment.course_id
        const progress = courseProgressData[courseId] || 0
        return {
          id: `progress-${enrollment.id}`,
          type: 'progress' as const,
          title: 'Great Progress!',
          description: `${Math.round(progress)}% completed in ${enrollment.course?.title || 'course'}`,
          icon: ChartBarIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          date: new Date(enrollment.updated_at),
          points: Math.floor(progress / 10) * 5, // 5 points per 10% progress
          action: () => setActiveTab('courses'),
        }
      }),
    // Level achievements
    ...(stats.level !== 'Beginner'
      ? [
          {
            id: 'level-achievement',
            type: 'level' as const,
            title: `${stats.level} Level Reached!`,
            description: `You've advanced to ${stats.level} level with ${stats.completedCourses} completed courses`,
            icon: StarIcon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            date: new Date(), // Current date for level achievement
            points: stats.level === 'Intermediate' ? 200 : 500,
            action: () => setActiveTab('home'),
          },
        ]
      : []),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8) // Show only latest 8 achievements
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
      name: 'Dashboard',
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
      available: canAccess('courses', 'view'),
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
      available: canAccess('enrollments', 'view'),
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
      id: 'batches',
      name: 'My Batches',
      icon: QueueListIcon,
      description: 'View assigned batches and groups',
      gradient: 'from-orange-500 to-red-600',
      badge: stats.totalBatches > 0 ? stats.totalBatches : undefined,
      available: canAccess('batches', 'read'),
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: UserIcon,
      description: 'Personal Settings',
      gradient: 'from-pink-500 to-rose-600',
      available: canAccess('settings', 'view'),
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
    // Removed separate settings tab - Profile tab now serves as settings
  ].filter((tab) => {
    if (tab.id !== 'home') {
      // Skip logging for dashboard tab since it's always available
      console.log(`Student tab "${tab.name}" (${tab.id}): ${tab.available ? 'ALLOWED' : 'DENIED'}`)
    }
    return tab.available
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center pt-6 lg:pt-8">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-0">
        {/* Enhanced Modern Header - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-lg"
        >
          <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-8">
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0"
              >
                <BookOpenIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 mb-1"
                >
                  <h1 className="text-base sm:text-lg lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent truncate">
                    Welcome back, {user?.full_name || 'Student'}!
                  </h1>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs sm:text-sm text-gray-600 font-medium truncate"
                >
                  Continue your amazing learning journey
                </motion.p>
              </div>
              <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="relative"
                  ref={achievementsRef}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 sm:p-3 bg-white/50 rounded-lg sm:rounded-xl backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => setShowAchievements(!showAchievements)}
                    title="View your achievements and progress"
                  >
                    <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 group-hover:text-amber-700 transition-colors" />
                  </motion.div>
                  {achievements.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse shadow-lg border-2 border-white"
                    >
                      {achievements.length}
                    </motion.span>
                  )}

                  {/* Achievements Dropdown */}
                  <AnimatePresence>
                    {showAchievements && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="fixed sm:absolute top-16 left-0 sm:left-auto sm:right-0 right-0 w-full sm:w-96 mx-2 sm:mx-0 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden"
                      >
                        <div className="p-2 sm:p-4 border-b border-gray-100">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 flex-shrink-0" />
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                Achievements
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-amber-100 text-amber-800">
                                {achievements.length}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowAchievements(false)}
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {achievements.length === 0 ? (
                            <div className="p-4 sm:p-6 text-center">
                              <TrophyIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-sm sm:text-base text-gray-500 font-medium mb-1">
                                No achievements yet
                              </p>
                              <p className="text-xs sm:text-sm text-gray-400">
                                Complete courses and earn certificates to unlock achievements!
                              </p>
                            </div>
                          ) : (
                            achievements.map((achievement) => (
                              <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-2 sm:p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => {
                                  achievement.action()
                                  setShowAchievements(false)
                                }}
                              >
                                <div className="flex items-start gap-2 sm:gap-3">
                                  <div
                                    className={`flex-shrink-0 p-1 sm:p-2 rounded-lg ${achievement.bgColor} border ${achievement.borderColor}`}
                                  >
                                    <achievement.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1 gap-2">
                                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                        {achievement.title}
                                      </p>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <StarIcon className="h-3 w-3 text-amber-500" />
                                        <span className="text-xs font-medium text-amber-600 whitespace-nowrap">
                                          +{achievement.points} XP
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                      {achievement.description}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {achievement.date.toLocaleDateString()}{' '}
                                      {achievement.date.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                        {achievements.length > 0 && (
                          <div className="p-3 border-t border-gray-100 bg-gradient-to-r from-amber-50 to-yellow-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <StarIcon className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-medium text-amber-700">
                                  Total XP: {stats.xpPoints}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-amber-600 hover:text-amber-700"
                                onClick={() => {
                                  setActiveTab('home')
                                  setShowAchievements(false)
                                }}
                              >
                                View Dashboard
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
            {/* Enhanced Navigation Pills - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-4 sm:mt-8 flex gap-2 sm:gap-4 bg-white/50 backdrop-blur-sm p-2 sm:p-3 rounded-xl sm:rounded-2xl w-full sm:w-fit overflow-x-auto border border-white/20 shadow-lg"
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
                  title={tab.name}
                  className={`relative flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap min-h-[44px] ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-md'
                  }`}
                >
                  <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.name}</span>
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
        <div className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Dashboard Tab */}
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full space-y-8"
              >
                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {[
                    {
                      title: 'Active Courses',
                      value: stats.activeCourses,
                      icon: BookOpenIcon,
                      gradient: 'from-blue-500 to-indigo-600',
                      bgGradient: 'from-blue-500/20 to-indigo-600/20',
                      description: 'Enrolled courses',
                      delay: 0.1,
                      permission: { resource: 'courses', action: 'view' },
                    },
                    {
                      title: 'Completed Courses',
                      value: stats.completedCourses,
                      icon: CheckCircleIcon,
                      gradient: 'from-green-500 to-teal-600',
                      bgGradient: 'from-green-500/20 to-teal-600/20',
                      description: 'Finished successfully',
                      delay: 0.2,
                      permission: { resource: 'courses', action: 'view' },
                    },
                    {
                      title: 'Certificates Earned',
                      value: stats.certificatesEarned,
                      icon: TrophyIcon,
                      gradient: 'from-yellow-500 to-orange-600',
                      bgGradient: 'from-yellow-500/20 to-orange-600/20',
                      description: 'Achievements unlocked',
                      delay: 0.3,
                      permission: { resource: 'certificates', action: 'read' },
                    },
                    {
                      title: 'My Batches',
                      value: stats.totalBatches,
                      icon: QueueListIcon,
                      gradient: 'from-orange-500 to-red-600',
                      bgGradient: 'from-orange-500/20 to-red-600/20',
                      description: 'Learning groups',
                      delay: 0.4,
                      permission: { resource: 'batches', action: 'read' },
                    },
                    {
                      title: 'Learning Streak',
                      value: stats.learningStreak,
                      icon: FireIcon,
                      gradient: 'from-purple-500 to-pink-600',
                      bgGradient: 'from-purple-500/20 to-pink-600/20',
                      description: stats.learningStreak === 1 ? 'Day' : 'Days',
                      suffix: stats.learningStreak === 1 ? ' day' : ' days',
                      delay: 0.5,
                      permission: null, // Always show learning streak
                    },
                  ]
                    .filter((stat) => {
                      if (stat.permission === null) return true
                      const hasPermission = canAccess(
                        stat.permission.resource,
                        stat.permission.action,
                      )
                      console.log(
                        `Student stat "${stat.title}" - ${stat.permission.resource}.${stat.permission.action}: ${hasPermission ? 'ALLOWED' : 'DENIED'}`,
                      )
                      return hasPermission
                    })
                    .map((stat) => (
                      <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
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
                        <div className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8">
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
                          />
                          <div className="relative">
                            <div className="flex items-center justify-between gap-2">
                              <div className="space-y-2 sm:space-y-3 min-w-0">
                                <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                                  {stat.title}
                                </p>
                                <motion.p
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: stat.delay + 0.2 }}
                                  className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                                >
                                  {stat.value}
                                  {stat.suffix || ''}
                                </motion.p>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">
                                  {stat.description}
                                </p>
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
                                className={`h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-gradient-to-r ${stat.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 flex-shrink-0`}
                              >
                                <stat.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>

                {/* Batch Information Section - Show if student is in any batches */}
                {batchProgress.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 border border-orange-200"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <QueueListIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-orange-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 truncate">
                            Your Learning Groups
                          </h3>
                          <p className="text-xs text-gray-600 truncate">
                            You're part of {batchProgress.length} batch
                            {batchProgress.length !== 1 ? 'es' : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('batches')}
                        className="bg-orange-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-orange-700 transition-colors cursor-pointer text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                      >
                        View All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {batchProgress.slice(0, 3).map((batchData, index) => (
                        <div
                          key={batchData.batch.id || index}
                          className="bg-white/60 rounded-lg p-4 border border-orange-100"
                        >
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {batchData.batch.name || 'Unnamed Batch'}
                          </h4>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progress:</span>
                            <span className="font-medium text-orange-600">
                              {Math.round(batchData.progress_percentage || 0)}%
                            </span>
                          </div>
                          <div className="mt-2">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, Math.max(0, batchData.progress_percentage || 0))}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {batchProgress.length > 3 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setActiveTab('batches')}
                          className="text-orange-600 hover:text-orange-800 font-medium cursor-pointer"
                        >
                          View {batchProgress.length - 3} more batch
                          {batchProgress.length - 3 !== 1 ? 'es' : ''}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Learning Progress Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 lg:p-8 border border-white/20"
                >
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      📈 Learning Progress Overview
                    </h3>
                    <div className="text-xs sm:text-sm text-gray-500">
                      Overall completion: {Math.round(stats.completionRate)}%
                    </div>
                  </div>
                  {/* Overall Progress Bar */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        Overall Learning Progress
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
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
                          const courseId = enrollment.course?.id || enrollment.course_id
                          const progress = courseProgressData?.[courseId] || 0 // Use real progress from course_progress table
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
                        className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                      >
                        <div className="text-lg sm:text-xl font-bold text-blue-600 mb-1">
                          {stats.activeCourses}/5
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Active Courses Goal</div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.5, duration: 0.5 }}
                        className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200"
                      >
                        <div className="text-lg sm:text-xl font-bold text-green-600 mb-1">
                          {stats.learningStreak}/
                          {(() => {
                            // Dynamic streak goal based on level
                            if (stats.level === 'Beginner') return 7
                            if (stats.level === 'Intermediate') return 21
                            return 30 // Advanced
                          })()}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          {stats.level} Streak Goal
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.6, duration: 0.5 }}
                        className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                      >
                        <div className="text-lg sm:text-xl font-bold text-purple-600 mb-1">
                          {stats.certificatesEarned}/10
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Certificates Goal</div>
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
                          available: canAccess('courses', 'view'),
                        },
                        {
                          name: 'My Enrollments',
                          icon: ClipboardDocumentListIcon,
                          description: 'Track enrollment status and history',
                          available: canAccess('enrollments', 'view'),
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
                            available: canAccess('settings', 'view'),
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
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  My Learning Journey 📚
                </h2>
                <p className="text-base sm:text-lg text-gray-600 mt-2">
                  Track your progress and continue learning
                </p>
              </div>
              {/* Course Progress Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {enrollments
                  .filter((e) => e.status === 'approved')
                  .map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 border border-white/20 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 line-clamp-2">
                          {enrollment.course?.title}
                        </h3>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                          Active
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                        {enrollment.course?.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span>Progress</span>
                          <span className="font-semibold">
                            {Math.round(
                              courseProgressData?.[enrollment.course?.id || enrollment.course_id] ||
                                0,
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, courseProgressData?.[enrollment.course?.id || enrollment.course_id] || 0)}%`,
                            }}
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
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                  Recommended Courses for You 🎯
                </h3>
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
                        <div
                          className="text-gray-600 text-sm mb-4"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Duration: {course.duration_weeks} weeks
                          </span>
                          <button
                            onClick={() => handleEnrollment(course.id)}
                            disabled={enrollingCourseId === course.id}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg text-sm hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                <h2 className="text-base sm:text-lg lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  My Enrollments 📋
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  Track your enrollment status and history
                </p>
              </div>
              {/* Search and Filter Controls */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 border border-white/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
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
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  My Achievements 🏆
                </h2>
                <p className="text-base sm:text-lg text-gray-600 mt-2">
                  Your earned certificates and accomplishments
                </p>
              </div>
              {/* Certificate Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 border border-yellow-200"
                  >
                    <div className="text-center">
                      <TrophyIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-yellow-600 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {certificate.course?.title}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                        Completed:{' '}
                        {new Date(
                          certificate.issued_at || new Date().toISOString(),
                        ).toLocaleDateString()}
                      </p>
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-xs text-gray-500">Verification Code</p>
                        <p className="font-mono text-xs sm:text-sm bg-white/50 px-2 py-1 rounded break-all">
                          {certificate.verification_code}
                        </p>
                      </div>
                      {certificate.file_url && (
                        <button
                          onClick={() => window.open(certificate.file_url!, '_blank')}
                          className="mt-3 sm:mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base min-h-[44px] sm:min-h-auto"
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
          {/* My Batches Tab */}
          {activeTab === 'batches' && (
            <motion.div
              key="batches"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  My Batches 👥
                </h2>
                <p className="text-xl text-gray-600">Your assigned batches and learning groups</p>
              </div>
              {/* Batch Progress Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batchProgress.map((batchData, index) => (
                  <div
                    key={batchData.batch.id || index}
                    className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-lg p-6 border border-orange-200 hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <QueueListIcon className="h-8 w-8 text-orange-600 flex-shrink-0" />
                        <Badge
                          className={`text-xs ${
                            batchData.batch.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : batchData.batch.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : batchData.batch.status === 'in_progress'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {batchData.batch.status || 'Unknown'}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {batchData.batch.name || 'Unknown Batch'}
                      </h3>
                      {batchData.batch.description && (
                        <div
                          className="text-sm text-gray-600 mb-3 line-clamp-2"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(batchData.batch.description),
                          }}
                        />
                      )}
                    </div>

                    {/* Course Progress */}
                    {batchData.courses.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Course:</h4>
                        {batchData.courses.map((courseData) => (
                          <div key={courseData.course_id} className="text-sm text-gray-600 mb-2">
                            <div className="font-medium">{courseData.courses.title}</div>
                            <div className="text-xs text-gray-500">
                              {courseData.courses.course_number} •{' '}
                              {courseData.courses.duration_weeks} weeks
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm text-gray-600">
                          {batchData.completed_weeks}/{batchData.total_weeks} weeks
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${batchData.total_weeks > 0 ? (batchData.completed_weeks / batchData.total_weeks) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-center text-gray-500 mt-1">
                        {batchData.progress_percentage}% complete
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {batchData.batch.gurukul && (
                        <div className="flex items-center text-gray-600">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                          <span className="font-medium">Gurukul:</span>
                          <span className="ml-1">{batchData.batch.gurukul.name}</span>
                        </div>
                      )}

                      {batchData.batch.start_date && (
                        <div className="flex items-center text-gray-600">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          <span className="font-medium">Start Date:</span>
                          <span className="ml-1">
                            {new Date(batchData.batch.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {batchData.batch.end_date && (
                        <div className="flex items-center text-gray-600">
                          <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                          <span className="font-medium">End Date:</span>
                          <span className="ml-1">
                            {new Date(batchData.batch.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                        <span className="font-medium">Joined:</span>
                        <span className="ml-1">
                          {new Date(batchData.assigned_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {batchProgress.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <QueueListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No Batches Assigned
                    </h3>
                    <p className="text-gray-500">
                      You haven't been assigned to any batches yet. Contact your instructor for more
                      information.
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
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2 cursor-pointer"
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
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2 cursor-pointer"
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

              {/* Compliance Section */}
              <div>
                <DashboardComplianceSection
                  userId={user?.id || ''}
                  userRole="student"
                  compactView={false}
                  showNotifications={true}
                />
              </div>

              {/* System Settings (Admin Only) */}
              {canAccess('settings', 'view') && (
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
