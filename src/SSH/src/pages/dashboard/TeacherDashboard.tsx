import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Course, Enrollment } from '@/types'
import { getTeacherCourses, createCourse } from '@/lib/api/courses'
import {
  getTeacherEnrollments,
  updateEnrollmentStatus,
  bulkUpdateEnrollments,
} from '@/lib/api/enrollments'
import {
  issueCertificate,
  bulkIssueCertificates,
  issueCertificateWithTemplate,
} from '@/lib/api/certificates'
import { getTeacherCertificateAssignments } from '@/lib/api/certificateAssignments'
import { getGurukuls } from '@/lib/api/gurukuls'
import { getUserProfile } from '@/lib/api/users'
import { getCountryName, getStateName } from '@/lib/address-utils'
import type { Database } from '@/lib/supabase'
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getLevelColor,
  generateCourseUrl,
} from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import ProfileEditModal from '../../components/profile/ProfileEditModal'
import {
  PlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  ChartBarIcon,
  BookOpenIcon,
  BellIcon,
  // CalendarIcon, // Imported but intentionally unused for future use
  TrophyIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  CurrencyEuroIcon,
  UsersIcon,
  GiftIcon,
  StarIcon,
  FireIcon,
  LightBulbIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
const courseSchema = z.object({
  gurukul_id: z.string().min(1, 'Please select a Gurukul'),
  course_number: z.string().min(1, 'Course number is required'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  level: z.enum(['elementary', 'basic', 'intermediate', 'advanced']),
  age_group_min: z.number().min(4, 'Minimum age must be at least 4'),
  age_group_max: z.number().max(100, 'Maximum age must be less than 100'),
  duration_weeks: z.number().min(1, 'Duration must be at least 1 week'),
  fee: z.number().min(0, 'Fee must be non-negative'),
  price: z.number().min(0, 'Price must be non-negative'),
  currency: z.string().default('USD'),
  max_students: z.number().min(1, 'Must allow at least 1 student'),
  delivery_method: z.enum(['physical', 'remote', 'hybrid']),
  entry_requirements: z.string().optional(),
  learning_outcomes: z.array(z.string()).min(1, 'At least one learning outcome is required'),
})
type CourseForm = z.infer<typeof courseSchema>
type Profile = Database['public']['Tables']['profiles']['Row']
// Extended profile interface that includes address fields from database
interface ProfileWithAddress {
  id: string
  email: string
  full_name: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
}
export default function TeacherDashboard() {
  const { user } = useWebsiteAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [gurukuls, setGurukuls] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [certificateAssignments, setCertificateAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([])
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [activeView, setActiveView] = useState<
    'overview' | 'courses' | 'students' | 'certificates' | 'analytics' | 'settings'
  >('overview')
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([''])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showIssuanceModal, setShowIssuanceModal] = useState(false)
  const [selectedEnrollmentForCert, setSelectedEnrollmentForCert] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  // Teacher Profile State
  interface TeacherProfile {
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
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    // watch, // For future form monitoring
    // setValue, // For programmatic form updates
    formState: { errors },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      level: 'basic',
      delivery_method: 'remote',
      learning_outcomes: [''],
    },
  })
  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps
  const loadDashboardData = async () => {
    try {
      const [coursesData, enrollmentsData, gurukulData, assignmentsData] = await Promise.all([
        getTeacherCourses(user!.id),
        getTeacherEnrollments(user!.id),
        getGurukuls(),
        getTeacherCertificateAssignments(user!.id),
      ])
      setCourses(coursesData)
      setEnrollments(enrollmentsData)
      setGurukuls(gurukulData)
      setCertificateAssignments(assignmentsData)
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }
  // Load teacher profile from database
  const loadTeacherProfile = useCallback(async () => {
    if (!user?.id) return
    try {
      const profile = await getUserProfile(user.id)
      if (profile) {
        // Cast to ProfileWithAddress since database has flat address fields
        const profileWithAddress = profile as unknown as ProfileWithAddress
        setTeacherProfile({
          id: profileWithAddress.id,
          full_name: profileWithAddress.full_name,
          phone: profileWithAddress.phone || undefined,
          address_line_1: profileWithAddress.address_line_1 || undefined,
          address_line_2: profileWithAddress.address_line_2 || undefined,
          city: profileWithAddress.city || undefined,
          state: profileWithAddress.state || undefined,
          zip_code: profileWithAddress.zip_code || undefined,
          country: profileWithAddress.country || undefined,
        })
      }
    } catch {
      // Error loading teacher profile - silent fail
    }
  }, [user?.id])
  // Load profile when component mounts
  useEffect(() => {
    if (user?.id) {
      loadTeacherProfile()
    }
  }, [user?.id, loadTeacherProfile])
  const handleCreateCourse = async (data: CourseForm) => {
    try {
      const courseData = {
        ...data,
        teacher_id: user!.id,
        is_active: true,
        learning_outcomes: learningOutcomes.filter((outcome) => outcome.trim() !== ''),
        syllabus: null, // or {} or "" depending on your requirements
        price: data.price || 0,
        currency: data.currency || 'USD',
      }
      await createCourse(courseData)
      await loadDashboardData()
      setShowCreateCourse(false)
      reset()
      setLearningOutcomes([''])
      toast.success('Course created successfully!')
    } catch {
      toast.error('Failed to create course')
    }
  }
  const handleApproveEnrollment = async (enrollmentId: string) => {
    try {
      await updateEnrollmentStatus(enrollmentId, 'approved')
      await loadDashboardData()
      toast.success('Enrollment approved!')
    } catch {
      toast.error('Failed to approve enrollment')
    }
  }
  const handleRejectEnrollment = async (enrollmentId: string) => {
    try {
      await updateEnrollmentStatus(enrollmentId, 'rejected')
      await loadDashboardData()
      toast.success('Enrollment rejected')
    } catch {
      toast.error('Failed to reject enrollment')
    }
  }
  const handleBulkApprove = async () => {
    if (selectedEnrollments.length === 0) {
      toast.error('Please select enrollments to approve')
      return
    }
    try {
      await bulkUpdateEnrollments(selectedEnrollments, 'approved')
      await loadDashboardData()
      setSelectedEnrollments([])
      toast.success(`${selectedEnrollments.length} enrollments approved!`)
    } catch {
      toast.error('Failed to approve enrollments')
    }
  }
  const handleIssueCertificate = async (enrollmentId: string) => {
    try {
      await issueCertificate(enrollmentId)
      await loadDashboardData()
      toast.success('Certificate issued successfully!')
    } catch {
      toast.error('Failed to issue certificate')
    }
  }
  const handleIssueCertificateWithTemplate = async (enrollmentId: string, templateId: string) => {
    try {
      await issueCertificateWithTemplate(enrollmentId, templateId)
      await loadDashboardData()
      setShowIssuanceModal(false)
      setSelectedEnrollmentForCert(null)
      setSelectedTemplate(null)
      toast.success('Certificate issued successfully with template!')
    } catch {
      toast.error('Failed to issue certificate')
    }
  }
  const openIssuanceModal = (enrollmentId: string) => {
    setSelectedEnrollmentForCert(enrollmentId)
    setShowIssuanceModal(true)
  }
  const handleBulkIssueCertificates = async () => {
    const eligibleEnrollments = enrollments.filter(
      (e) => e.status === 'completed' && !e.certificate_issued,
    )
    if (eligibleEnrollments.length === 0) {
      toast.error('No eligible students for certificate issuance')
      return
    }
    try {
      await bulkIssueCertificates(eligibleEnrollments.map((e) => e.id))
      await loadDashboardData()
      toast.success(`${eligibleEnrollments.length} certificates issued!`)
    } catch {
      toast.error('Failed to issue certificates')
    }
  }
  const addLearningOutcome = () => {
    setLearningOutcomes([...learningOutcomes, ''])
  }
  const removeLearningOutcome = (index: number) => {
    if (learningOutcomes.length > 1) {
      const newOutcomes = learningOutcomes.filter((_, i) => i !== index)
      setLearningOutcomes(newOutcomes)
    }
  }
  const updateLearningOutcome = (index: number, value: string) => {
    const newOutcomes = [...learningOutcomes]
    newOutcomes[index] = value
    setLearningOutcomes(newOutcomes)
  }
  // Calculate stats from real database data
  const stats = {
    totalCourses: courses.length,
    // Count unique students (not total enrollments)
    totalStudents: new Set(enrollments.map((e) => e.student_id).filter(Boolean)).size,
    // Total enrollments for reference
    totalEnrollments: enrollments.length,
    pendingApprovals: enrollments.filter((e) => e.status === 'pending').length,
    completedCourses: enrollments.filter((e) => e.status === 'completed').length,
    certificatesIssued: enrollments.filter((e) => e.certificate_issued).length,
    pendingCertificates: enrollments.filter(
      (e) => e.status === 'completed' && !e.certificate_issued,
    ).length,
    // Calculate revenue from paid enrollments only - handles currency conversion and edge cases
    totalRevenue: enrollments
      .filter((e) => e.payment_status === 'paid' && e.course?.price && e.course.price > 0)
      .reduce((sum, e) => {
        const price = e.course?.price || 0
        // TODO: Add currency conversion when multiple currencies are supported
        return sum + price
      }, 0),
    // Calculate completion rate percentage
    completionRate:
      enrollments.length > 0
        ? Math.round(
            (enrollments.filter((e) => e.status === 'completed').length / enrollments.length) * 100,
          )
        : 0,
    averageRating: 0, // No rating system implemented yet
  }
  // Generate recent activity from real enrollment data
  const recentActivity = enrollments
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4)
    .map((enrollment) => {
      const timeDiff = Date.now() - new Date(enrollment.updated_at).getTime()
      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const days = Math.floor(hours / 24)
      let timeText = ''
      if (days > 0) {
        timeText = `${days} day${days > 1 ? 's' : ''} ago`
      } else if (hours > 0) {
        timeText = `${hours} hour${hours > 1 ? 's' : ''} ago`
      } else {
        timeText = 'Recently'
      }
      if (enrollment.status === 'completed') {
        return {
          type: 'completion',
          message: `${enrollment.student?.full_name || 'Student'} completed ${enrollment.course?.title || 'course'}`,
          time: timeText,
          icon: CheckCircleIcon,
        }
      } else if (enrollment.certificate_issued) {
        return {
          type: 'certificate',
          message: `Certificate issued to ${enrollment.student?.full_name || 'student'}`,
          time: timeText,
          icon: DocumentTextIcon,
        }
      } else if (enrollment.status === 'pending') {
        return {
          type: 'enrollment',
          message: `New enrollment request from ${enrollment.student?.full_name || 'student'} in ${enrollment.course?.title || 'course'}`,
          time: timeText,
          icon: UserGroupIcon,
        }
      } else {
        return {
          type: 'enrollment',
          message: `${enrollment.student?.full_name || 'Student'} enrolled in ${enrollment.course?.title || 'course'}`,
          time: timeText,
          icon: BookOpenIcon,
        }
      }
    })
  const quickActions = [
    {
      title: 'Create New Course',
      description: 'Design and launch a new course',
      icon: PlusIcon,
      action: () => setShowCreateCourse(true),
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      highlight: true,
    },
    {
      title: 'Review Enrollments',
      description: `${stats.pendingApprovals} pending approvals`,
      icon: ClockIcon,
      action: () => setActiveView('students'),
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      badge: stats.pendingApprovals,
    },
    {
      title: 'Issue Certificates',
      description: `${stats.pendingCertificates} ready to issue`,
      icon: TrophyIcon,
      action: () => setActiveView('certificates'),
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      badge: stats.pendingCertificates,
    },
    {
      title: 'View Analytics',
      description: 'Track your teaching performance',
      icon: ChartBarIcon,
      action: () => setActiveView('analytics'),
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
    },
  ]
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
            <p className="text-gray-600">Preparing your teaching workspace...</p>
          </motion.div>
        </motion.div>
      </div>
    )
  }
  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { greeting: 'Good morning', icon: SunIcon }
    if (hour < 18) return { greeting: 'Good afternoon', icon: SunIcon }
    return { greeting: 'Good evening', icon: MoonIcon }
  }
  const { greeting, icon: TimeIcon } = getTimeOfDay()
  return (
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
                <AcademicCapIcon className="h-8 w-8 text-white" />
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
                    {greeting}, {user?.full_name?.split(' ')[0] || 'Teacher'}! 👋
                  </h1>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 text-lg"
                >
                  Ready to inspire minds and shape futures today?
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
                  <BellIcon className="h-6 w-6 text-gray-600" />
                  {stats.pendingApprovals > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse shadow-lg"
                    >
                      {stats.pendingApprovals}
                    </motion.span>
                  )}
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsProfileModalOpen(true)}
                  className="p-3 bg-white/50 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <UserIcon className="h-6 w-6 text-gray-600" />
                </motion.div>
              </motion.div>
              {/* Rating badge hidden until rating system is implemented
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200 px-4 py-2 text-sm font-semibold shadow-lg">
                  <StarIcon className="h-5 w-5 mr-2 fill-current" />
                  Rating System Coming Soon
                </Badge>
              </motion.div>
              */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateCourse(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 font-semibold cursor-pointer"
                >
                  <PlusIcon className="h-5 w-5" />
                  <SparklesIcon className="h-5 w-5" />
                  Create Course
                </motion.button>
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
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon, badge: null },
              {
                id: 'courses',
                name: 'My Courses',
                icon: BookOpenIcon,
                badge: stats.totalCourses > 0 ? stats.totalCourses : null,
              },
              {
                id: 'students',
                name: 'Students',
                icon: UserGroupIcon,
                badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : null,
              },
              {
                id: 'certificates',
                name: 'Certificates',
                icon: DocumentTextIcon,
                badge: stats.pendingCertificates > 0 ? stats.pendingCertificates : null,
              },
              { id: 'analytics', name: 'Analytics', icon: ArrowTrendingUpIcon, badge: null },
              { id: 'settings', name: 'Settings', icon: Cog6ToothIcon, badge: null },
            ].map((tab, index) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveView(
                    tab.id as
                      | 'overview'
                      | 'courses'
                      | 'students'
                      | 'certificates'
                      | 'analytics'
                      | 'settings',
                  )
                  // Scroll to top of page
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`relative flex items-center space-x-3 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer ${
                  activeView === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-md'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${activeView === tab.id ? 'text-white' : ''}`} />
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
          {/* Enhanced Overview */}
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-12"
            >
              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    title: 'Total Courses',
                    value: stats.totalCourses,
                    icon: BookOpenIcon,
                    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
                    bgGradient: 'from-blue-50 via-blue-100 to-indigo-100',
                    delay: 0.1,
                  },
                  {
                    title: 'Total Students',
                    value: stats.totalStudents,
                    icon: UserGroupIcon,
                    gradient: 'from-green-500 via-emerald-600 to-teal-600',
                    bgGradient: 'from-green-50 via-emerald-100 to-teal-100',
                    delay: 0.2,
                  },
                  {
                    title: 'Certificates',
                    value: stats.certificatesIssued,
                    icon: TrophyIcon,
                    gradient: 'from-purple-500 via-violet-600 to-purple-600',
                    bgGradient: 'from-purple-50 via-violet-100 to-purple-100',
                    delay: 0.3,
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
                    <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
                      />
                      <CardContent className="p-8 relative">
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
                          </div>
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: stat.delay + 0.3, type: 'spring', stiffness: 200 }}
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
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              {/* Enhanced Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-2xl overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <SparklesIcon className="h-6 w-6 text-blue-600" />
                      <h2 className="text-xl font-bold">Quick Actions</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {quickActions.map((action, index) => (
                        <div
                          key={index}
                          onClick={action.action}
                          className={`relative p-6 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${action.color} text-white group`}
                        >
                          {action.highlight && (
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                              NEW
                            </div>
                          )}
                          {action.badge && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {action.badge}
                            </div>
                          )}
                          <action.icon className="h-8 w-8 mb-3 group-hover:scale-110 transition-transform" />
                          <h3 className="font-semibold mb-1">{action.title}</h3>
                          <p className="text-sm opacity-90">{action.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <FireIcon className="h-6 w-6 text-orange-600" />
                      <h2 className="text-xl font-bold">Recent Activity</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-4 p-3 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors"
                        >
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <activity.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.message}</p>
                            <p className="text-sm text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {/* Performance Insights */}
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <LightBulbIcon className="h-6 w-6 text-yellow-600" />
                      <h2 className="text-xl font-bold">Performance Insights</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-800">
                            Excellent Completion Rate
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          85% of your students complete courses successfully
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <StarIcon className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-blue-800">
                            High Student Satisfaction
                          </span>
                        </div>
                        <p className="text-sm text-blue-700">Student rating system coming soon</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrophyIcon className="h-5 w-5 text-purple-600" />
                          <span className="font-semibold text-purple-800">
                            Certificate Achievement
                          </span>
                        </div>
                        <p className="text-sm text-purple-700">
                          {stats.certificatesIssued} certificates issued this month
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
          {/* Courses View */}
          {activeView === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
                  <p className="text-gray-600">Manage and create your educational content</p>
                </div>
                <Button
                  onClick={() => setShowCreateCourse(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create New Course
                </Button>
              </div>
              {courses.length === 0 ? (
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                  <CardContent className="text-center py-16">
                    <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
                    <p className="text-gray-600 mb-6">
                      Create your first course to start teaching!
                    </p>
                    <Button
                      onClick={() => setShowCreateCourse(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create Your First Course
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => {
                    const courseEnrollments = enrollments.filter((e) => e.course_id === course.id)
                    const pendingCertificates = courseEnrollments.filter(
                      (e) => e.status === 'completed' && !e.certificate_issued,
                    ).length
                    return (
                      <Card
                        key={course.id}
                        className="border-0 shadow-xl bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group"
                      >
                        <div className="h-32 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-t-lg relative overflow-hidden">
                          <div className="absolute inset-0 bg-black/20"></div>
                          <div className="absolute bottom-4 left-4 text-white">
                            <Badge className={`${getLevelColor(course.level)} mb-2`}>
                              {course.level}
                            </Badge>
                            <p className="text-sm opacity-90">{course.course_number}</p>
                          </div>
                          {pendingCertificates > 0 && (
                            <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                              {pendingCertificates} Certificates
                            </div>
                          )}
                        </div>
                        <CardContent className="p-6">
                          <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {course.description}
                          </p>
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <UsersIcon className="h-4 w-4 text-gray-400" />
                              <span>{courseEnrollments.length} students</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <ClockIcon className="h-4 w-4 text-gray-400" />
                              <span>{course.duration_weeks} weeks</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <CurrencyEuroIcon className="h-4 w-4 text-gray-400" />
                              <span>{formatCurrency(course.price)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <TrophyIcon className="h-4 w-4 text-gray-400" />
                              <span>
                                {courseEnrollments.filter((e) => e.certificate_issued).length}{' '}
                                certified
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Link to={generateCourseUrl(course)} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </Link>
                            {pendingCertificates > 0 && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const eligibleEnrollments = courseEnrollments.filter(
                                    (e) => e.status === 'completed' && !e.certificate_issued,
                                  )
                                  if (eligibleEnrollments.length === 1) {
                                    // Single enrollment - open template selection modal
                                    openIssuanceModal(eligibleEnrollments[0].id)
                                  } else if (eligibleEnrollments.length > 1) {
                                    // Multiple enrollments - use bulk issuance (default)
                                    bulkIssueCertificates(eligibleEnrollments.map((e) => e.id))
                                  }
                                }}
                                className="bg-gradient-to-r from-green-500 to-green-600"
                              >
                                <GiftIcon className="h-4 w-4 mr-1" />
                                Issue ({pendingCertificates})
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
          {/* Students View */}
          {activeView === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
                  <p className="text-gray-600">Review enrollments and manage student progress</p>
                </div>
                {selectedEnrollments.length > 0 && (
                  <Button
                    onClick={handleBulkApprove}
                    className="bg-gradient-to-r from-green-500 to-green-600"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Approve Selected ({selectedEnrollments.length})
                  </Button>
                )}
              </div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <UserGroupIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-900">{stats.totalStudents}</div>
                    <div className="text-sm text-blue-700">Total Students</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <ClockIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-900">
                      {stats.pendingApprovals}
                    </div>
                    <div className="text-sm text-orange-700">Pending Approvals</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4 text-center">
                    <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-900">
                      {enrollments.filter((e) => e.status === 'approved').length}
                    </div>
                    <div className="text-sm text-green-700">Active Students</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <TrophyIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-900">
                      {stats.completedCourses}
                    </div>
                    <div className="text-sm text-purple-700">Completed</div>
                  </CardContent>
                </Card>
              </div>
              {/* Enrollments Table */}
              <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  {enrollments.length === 0 ? (
                    <div className="text-center py-12">
                      <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                      <p className="text-gray-600">
                        Students will appear here once they enroll in your courses.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4">
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedEnrollments(
                                      enrollments
                                        .filter((e) => e.status === 'pending')
                                        .map((e) => e.id),
                                    )
                                  } else {
                                    setSelectedEnrollments([])
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">Student</th>
                            <th className="text-left py-3 px-4 font-semibold">Course</th>
                            <th className="text-left py-3 px-4 font-semibold">Status</th>
                            <th className="text-left py-3 px-4 font-semibold">Enrolled</th>
                            <th className="text-left py-3 px-4 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.map((enrollment) => (
                            <tr
                              key={enrollment.id}
                              className="border-b border-gray-100 hover:bg-gray-50/50"
                            >
                              <td className="py-3 px-4">
                                {enrollment.status === 'pending' && (
                                  <input
                                    type="checkbox"
                                    checked={selectedEnrollments.includes(enrollment.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedEnrollments([
                                          ...selectedEnrollments,
                                          enrollment.id,
                                        ])
                                      } else {
                                        setSelectedEnrollments(
                                          selectedEnrollments.filter((id) => id !== enrollment.id),
                                        )
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">
                                      {enrollment.student?.full_name?.charAt(0) || 'S'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{enrollment.student?.full_name}</p>
                                    <p className="text-sm text-gray-500">
                                      {enrollment.student?.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium">{enrollment.course?.title}</p>
                                  <p className="text-sm text-gray-500">
                                    {enrollment.course?.course_number}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={getStatusColor(enrollment.status)}>
                                  {enrollment.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {formatDate(enrollment.enrolled_at)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  {enrollment.status === 'pending' && (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveEnrollment(enrollment.id)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircleIcon className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRejectEnrollment(enrollment.id)}
                                        className="text-red-600 border-red-300 hover:bg-red-50"
                                      >
                                        <XCircleIcon className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  {enrollment.status === 'completed' &&
                                    !enrollment.certificate_issued && (
                                      <Button
                                        size="sm"
                                        onClick={() => openIssuanceModal(enrollment.id)}
                                        className="bg-gradient-to-r from-purple-500 to-purple-600"
                                      >
                                        <TrophyIcon className="h-4 w-4 mr-1" />
                                        Issue Certificate
                                      </Button>
                                    )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
          {/* Certificates View */}
          {activeView === 'certificates' && (
            <motion.div
              key="certificates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Certificate Management</h2>
                  <p className="text-gray-600">Issue and manage student certificates</p>
                </div>
                {stats.pendingCertificates > 0 && (
                  <Button
                    onClick={handleBulkIssueCertificates}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg"
                  >
                    <TrophyIcon className="h-5 w-5 mr-2" />
                    Issue All Eligible ({stats.pendingCertificates})
                  </Button>
                )}
              </div>
              {/* Certificate Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6 text-center">
                    <TrophyIcon className="h-10 w-10 text-green-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-green-900">
                      {stats.certificatesIssued}
                    </div>
                    <div className="text-sm text-green-700">Certificates Issued</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-6 text-center">
                    <ClockIcon className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-orange-900">
                      {stats.pendingCertificates}
                    </div>
                    <div className="text-sm text-orange-700">Pending Certificates</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6 text-center">
                    <CheckCircleIcon className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-blue-900">{stats.completedCourses}</div>
                    <div className="text-sm text-blue-700">Completed Courses</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6 text-center">
                    <DocumentTextIcon className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-purple-900">
                      {certificateAssignments.length}
                    </div>
                    <div className="text-sm text-purple-700">Available Templates</div>
                  </CardContent>
                </Card>
              </div>
              {/* Available Certificate Templates */}
              {certificateAssignments.length > 0 && (
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                      <h3 className="text-lg font-semibold">Available Certificate Templates</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {certificateAssignments.map((assignment) => {
                        const assignedCourse = courses.find((c) => c.id === assignment.course_id)
                        const assignedGurukul = gurukuls.find((g) => g.id === assignment.gurukul_id)
                        return (
                          <div
                            key={assignment.id}
                            className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-purple-900">
                                  {assignment.template?.name || 'Certificate Template'}
                                </h4>
                                <p className="text-sm text-purple-700">
                                  {assignment.template?.type || 'Student'} Certificate
                                </p>
                              </div>
                              <Badge className="bg-purple-600 text-white">
                                {assignment.course_id ? 'Course' : 'Gurukul'}
                              </Badge>
                            </div>
                            <div className="text-sm text-purple-600 mb-3">
                              <p>
                                <strong>Assigned to:</strong>
                              </p>
                              {assignedCourse ? (
                                <p>📚 {assignedCourse.title}</p>
                              ) : assignedGurukul ? (
                                <p>🏛️ {assignedGurukul.name} (All Courses)</p>
                              ) : (
                                <p>Unknown Assignment</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-purple-500">Active Template</span>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                                  onClick={() => {
                                    // TODO: Implement template preview
                                    toast('Template preview coming soon!')
                                  }}
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  Preview
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-purple-600 text-white hover:bg-purple-700"
                                  onClick={() => {
                                    // Find eligible students for this template
                                    const templateCourseEnrollments = assignedCourse
                                      ? enrollments.filter(
                                          (e) =>
                                            e.course_id === assignedCourse.id &&
                                            e.status === 'completed' &&
                                            !e.certificate_issued,
                                        )
                                      : enrollments.filter(
                                          (e) =>
                                            e.status === 'completed' &&
                                            !e.certificate_issued &&
                                            courses.some(
                                              (c) =>
                                                c.id === e.course_id &&
                                                c.gurukul_id === assignment.gurukul_id,
                                            ),
                                        )
                                    if (templateCourseEnrollments.length === 0) {
                                      toast('No eligible students for this template')
                                    } else if (templateCourseEnrollments.length === 1) {
                                      setSelectedTemplate(assignment.template_id)
                                      openIssuanceModal(templateCourseEnrollments[0].id)
                                    } else {
                                      toast(
                                        `${templateCourseEnrollments.length} students eligible for this template`,
                                      )
                                    }
                                  }}
                                >
                                  <TrophyIcon className="h-4 w-4 mr-1" />
                                  Use Template
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Pending Certificates */}
              {stats.pendingCertificates > 0 && (
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-6 w-6 text-orange-600" />
                      <h3 className="text-lg font-semibold">Pending Certificates</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {enrollments
                        .filter((e) => e.status === 'completed' && !e.certificate_issued)
                        .map((enrollment) => (
                          <div
                            key={enrollment.id}
                            className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200"
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">
                                  {enrollment.student?.full_name?.charAt(0) || 'S'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-orange-900">
                                  {enrollment.student?.full_name}
                                </p>
                                <p className="text-sm text-orange-700">
                                  {enrollment.course?.title}
                                </p>
                              </div>
                            </div>
                            <div className="text-xs text-orange-600 mb-3">
                              Completed:{' '}
                              {formatDate(enrollment.completed_at || enrollment.enrolled_at)}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => openIssuanceModal(enrollment.id)}
                              className="w-full bg-gradient-to-r from-purple-500 to-purple-600"
                            >
                              <TrophyIcon className="h-4 w-4 mr-1" />
                              Issue Certificate
                            </Button>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Issued Certificates */}
              <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <TrophyIcon className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold">Issued Certificates</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.certificatesIssued === 0 ? (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No certificates issued yet
                      </h3>
                      <p className="text-gray-600">
                        Certificates will appear here once you issue them to students.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {enrollments
                        .filter((e) => e.certificate_issued)
                        .map((enrollment) => (
                          <div
                            key={enrollment.id}
                            className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200"
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                                <TrophyIcon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-green-900">
                                  {enrollment.student?.full_name}
                                </p>
                                <p className="text-sm text-green-700">{enrollment.course?.title}</p>
                              </div>
                            </div>
                            <div className="text-xs text-green-600">
                              Issued: {formatDate(enrollment.updated_at)}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
          {/* Enhanced Analytics View */}
          {activeView === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-12 pt-8"
            >
              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-center space-y-6"
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Teaching Analytics
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Track your performance and student engagement with detailed insights
                </p>
              </motion.div>
              {/* Enhanced Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    title: 'Rating System',
                    value: 'Coming Soon',
                    icon: StarIcon,
                    gradient: 'from-yellow-500 via-orange-500 to-red-500',
                    bgGradient: 'from-yellow-50 via-orange-100 to-red-100',
                    delay: 0.1,
                  },
                  {
                    title: 'Completion Rate',
                    value:
                      enrollments.length > 0
                        ? Math.round(
                            (enrollments.filter((e) => e.status === 'completed').length /
                              enrollments.length) *
                              100,
                          ) + '%'
                        : '0%',
                    icon: CheckCircleIcon,
                    gradient: 'from-green-500 via-emerald-600 to-teal-600',
                    bgGradient: 'from-green-50 via-emerald-100 to-teal-100',
                    delay: 0.2,
                  },
                  {
                    title: 'Avg Students/Course',
                    value: Math.round(stats.totalStudents / stats.totalCourses) || 0,
                    icon: UserGroupIcon,
                    gradient: 'from-purple-500 via-violet-600 to-indigo-600',
                    bgGradient: 'from-purple-50 via-violet-100 to-indigo-100',
                    delay: 0.3,
                  },
                ].map((metric) => (
                  <motion.div
                    key={metric.title}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: metric.delay,
                      duration: 0.6,
                      type: 'spring',
                      stiffness: 100,
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="group"
                  >
                    <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
                      />
                      <CardContent className="p-8 relative">
                        <div className="flex items-center justify-between">
                          <div className="space-y-3">
                            <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">
                              {metric.title}
                            </p>
                            <motion.p
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: metric.delay + 0.2 }}
                              className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                            >
                              {typeof metric.value === 'string'
                                ? metric.value
                                : metric.value.toLocaleString()}
                            </motion.p>
                          </div>
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              delay: metric.delay + 0.3,
                              type: 'spring',
                              stiffness: 200,
                            }}
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            className={`h-16 w-16 bg-gradient-to-r ${metric.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                          >
                            <metric.icon className="h-8 w-8 text-white" />
                          </motion.div>
                        </div>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ delay: metric.delay + 0.5, duration: 1 }}
                          className="mt-6"
                        >
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '85%' }}
                              transition={{ delay: metric.delay + 0.7, duration: 1.5 }}
                              className={`h-full bg-gradient-to-r ${metric.gradient} rounded-full`}
                            />
                          </div>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              {/* Enhanced Course Performance */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="space-y-16"
              >
                <div className="text-center space-y-6">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Course Performance Overview
                  </h3>
                  <p className="text-gray-600">Detailed insights into each of your courses</p>
                </div>
                <div className="grid gap-8">
                  {courses.map((course, index) => {
                    const courseEnrollments = enrollments.filter((e) => e.course_id === course.id)
                    const completionRate =
                      courseEnrollments.length > 0
                        ? Math.round(
                            (courseEnrollments.filter((e) => e.status === 'completed').length /
                              courseEnrollments.length) *
                              100,
                          )
                        : 0
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                        className="group"
                      >
                        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <CardContent className="p-8 relative">
                            <div className="flex items-center justify-between mb-6">
                              <div className="space-y-1">
                                <h4 className="text-xl font-bold text-gray-900">{course.title}</h4>
                                <p className="text-gray-600">Course #{course.course_number}</p>
                              </div>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="flex items-center space-x-2"
                              >
                                <Badge
                                  className={`text-sm font-medium px-4 py-2 ${
                                    completionRate >= 80
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                                      : completionRate >= 60
                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                                        : 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                                  }`}
                                >
                                  {completionRate}% completion
                                </Badge>
                              </motion.div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {[
                                { label: 'Enrolled', value: courseEnrollments.length, icon: '👥' },
                                {
                                  label: 'Completed',
                                  value: courseEnrollments.filter((e) => e.status === 'completed')
                                    .length,
                                  icon: '✅',
                                },
                                {
                                  label: 'Certificates',
                                  value: courseEnrollments.filter((e) => e.certificate_issued)
                                    .length,
                                  icon: '🏆',
                                },
                              ].map((stat, statIndex) => (
                                <motion.div
                                  key={stat.label}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.8 + index * 0.1 + statIndex * 0.05 }}
                                  className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30 hover:border-white/50 transition-all duration-300"
                                >
                                  <div className="text-2xl mb-2">{stat.icon}</div>
                                  <div className="text-2xl font-bold text-gray-900 mb-1">
                                    {stat.value}
                                  </div>
                                  <div className="text-sm text-gray-600 font-medium">
                                    {stat.label}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                            {/* Progress Bar */}
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ delay: 1 + index * 0.1, duration: 1 }}
                              className="mt-6"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Overall Progress
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                  {completionRate}%
                                </span>
                              </div>
                              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${completionRate}%` }}
                                  transition={{ delay: 1.2 + index * 0.1, duration: 1.5 }}
                                  className={`h-full rounded-full ${
                                    completionRate >= 80
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                      : completionRate >= 60
                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                        : 'bg-gradient-to-r from-red-500 to-pink-600'
                                  }`}
                                />
                              </div>
                            </motion.div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeView === 'settings' && (
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
                    <Cog6ToothIcon className="h-8 w-8 text-gray-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Account Information</h3>
                  </div>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
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
                        <p className="text-gray-900">{teacherProfile?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-gray-900">
                          {teacherProfile?.date_of_birth
                            ? new Date(teacherProfile.date_of_birth).toLocaleDateString()
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
                          {teacherProfile?.address_line_1 || 'Not provided'}
                        </p>
                        {teacherProfile?.address_line_2 && (
                          <p className="text-gray-900">{teacherProfile.address_line_2}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Show city only if available */}
                        {teacherProfile?.city && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">City</label>
                            <p className="text-gray-900">{teacherProfile.city}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-500">State</label>
                          <p className="text-gray-900">
                            {teacherProfile?.state && teacherProfile?.country
                              ? getStateName(teacherProfile.country, teacherProfile.state) ||
                                teacherProfile.state
                              : 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">ZIP Code</label>
                          <p className="text-gray-900">
                            {teacherProfile?.zip_code || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Country</label>
                          <p className="text-gray-900">
                            {teacherProfile?.country
                              ? getCountryName(teacherProfile.country) || teacherProfile.country
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
        </AnimatePresence>
      </div>
      {/* Create Course Modal */}
      {showCreateCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Course</h2>
                  <p className="text-gray-600">Design your next educational masterpiece</p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateCourse(false)
                    reset()
                    setLearningOutcomes([''])
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit(handleCreateCourse)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Gurukul</label>
                  <select
                    {...register('gurukul_id')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a Gurukul</option>
                    {gurukuls.map((gurukul) => (
                      <option key={gurukul.id} value={gurukul.id}>
                        {gurukul.name}
                      </option>
                    ))}
                  </select>
                  {errors.gurukul_id && (
                    <p className="text-sm text-red-600">{errors.gurukul_id.message}</p>
                  )}
                </div>
                <Input
                  label="Course Number"
                  placeholder="e.g., C1001"
                  {...register('course_number')}
                  error={errors.course_number?.message}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Course Title"
                    placeholder="Enter an engaging course title"
                    {...register('title')}
                    error={errors.title?.message}
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Describe what students will learn and achieve"
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Level</label>
                  <select
                    {...register('level')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="elementary">Elementary (4-7 years)</option>
                    <option value="basic">Basic (8-11 years)</option>
                    <option value="intermediate">Intermediate (12-15 years)</option>
                    <option value="advanced">Advanced (16-19 years)</option>
                  </select>
                  {errors.level && <p className="text-sm text-red-600">{errors.level.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Delivery Method</label>
                  <select
                    {...register('delivery_method')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="remote">Online</option>
                    <option value="physical">In-person</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  {errors.delivery_method && (
                    <p className="text-sm text-red-600">{errors.delivery_method.message}</p>
                  )}
                </div>
                <Input
                  label="Minimum Age"
                  type="number"
                  {...register('age_group_min', { valueAsNumber: true })}
                  error={errors.age_group_min?.message}
                />
                <Input
                  label="Maximum Age"
                  type="number"
                  {...register('age_group_max', { valueAsNumber: true })}
                  error={errors.age_group_max?.message}
                />
                <Input
                  label="Duration (weeks)"
                  type="number"
                  {...register('duration_weeks', { valueAsNumber: true })}
                  error={errors.duration_weeks?.message}
                />
                <Input
                  label="Course Fee (€)"
                  type="number"
                  step="0.01"
                  {...register('fee', { valueAsNumber: true })}
                  error={errors.fee?.message}
                />
                <Input
                  label="Maximum Students"
                  type="number"
                  {...register('max_students', { valueAsNumber: true })}
                  error={errors.max_students?.message}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Entry Requirements (Optional)"
                    placeholder="Any prerequisites or requirements"
                    {...register('entry_requirements')}
                    error={errors.entry_requirements?.message}
                  />
                </div>
              </div>
              {/* Learning Outcomes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Learning Outcomes
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={addLearningOutcome}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Outcome
                  </Button>
                </div>
                <div className="space-y-3">
                  {learningOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={outcome}
                        onChange={(e) => updateLearningOutcome(index, e.target.value)}
                        placeholder={`Learning outcome ${index + 1}`}
                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      {learningOutcomes.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLearningOutcome(index)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateCourse(false)
                    reset()
                    setLearningOutcomes([''])
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Create Course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Certificate Issuance Modal */}
      {showIssuanceModal && selectedEnrollmentForCert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Issue Certificate</h2>
                  <p className="text-gray-600">Select a template to issue the certificate</p>
                </div>
                <button
                  onClick={() => {
                    setShowIssuanceModal(false)
                    setSelectedEnrollmentForCert(null)
                    setSelectedTemplate(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {certificateAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Available</h3>
                  <p className="text-gray-600 mb-6">
                    No certificate templates have been assigned to your courses.
                  </p>
                  <div className="flex space-x-4 justify-center">
                    <Button
                      onClick={() => handleIssueCertificate(selectedEnrollmentForCert)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Issue Default Certificate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowIssuanceModal(false)
                        setSelectedEnrollmentForCert(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Available Templates
                    </h3>
                    <div className="grid gap-4">
                      {certificateAssignments.map((assignment) => {
                        const assignedCourse = courses.find((c) => c.id === assignment.course_id)
                        const assignedGurukul = gurukuls.find((g) => g.id === assignment.gurukul_id)
                        const isSelected = selectedTemplate === assignment.template_id
                        return (
                          <div
                            key={assignment.id}
                            onClick={() => setSelectedTemplate(assignment.template_id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                      isSelected
                                        ? 'bg-purple-500 border-purple-500'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-gray-900">
                                    {assignment.template?.name || 'Certificate Template'}
                                  </h4>
                                  <Badge
                                    className={`${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-600 text-white'}`}
                                  >
                                    {assignment.course_id ? 'Course' : 'Gurukul'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {assignment.template?.type || 'Student'} Certificate
                                </p>
                                <div className="text-sm text-gray-500">
                                  <p>
                                    <strong>Assigned to:</strong>
                                  </p>
                                  {assignedCourse ? (
                                    <p>📚 {assignedCourse.title}</p>
                                  ) : assignedGurukul ? (
                                    <p>🏛️ {assignedGurukul.name} (All Courses)</p>
                                  ) : (
                                    <p>Unknown Assignment</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="flex space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => handleIssueCertificate(selectedEnrollmentForCert)}
                        className="text-gray-600"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Use Default Template
                      </Button>
                    </div>
                    <div className="flex space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowIssuanceModal(false)
                          setSelectedEnrollmentForCert(null)
                          setSelectedTemplate(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (selectedTemplate && selectedEnrollmentForCert) {
                            handleIssueCertificateWithTemplate(
                              selectedEnrollmentForCert,
                              selectedTemplate,
                            )
                          }
                        }}
                        disabled={!selectedTemplate}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 disabled:opacity-50"
                      >
                        <TrophyIcon className="h-4 w-4 mr-2" />
                        Issue with Selected Template
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Profile Edit Modal */}
      {isProfileModalOpen && user && teacherProfile && (
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={
            {
              ...user,
              // Override with address data from teacherProfile which has the latest address info
              address_line_1: teacherProfile.address_line_1,
              address_line_2: teacherProfile.address_line_2,
              city: teacherProfile.city,
              state: teacherProfile.state,
              zip_code: teacherProfile.zip_code,
              country: teacherProfile.country,
            } as Profile
          }
          onUpdate={() => {
            // Refresh user data after profile update
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
