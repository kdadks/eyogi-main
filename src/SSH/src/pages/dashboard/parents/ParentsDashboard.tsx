import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useConfirmDialog } from '../../../hooks/useConfirmDialog'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebsiteAuth } from '../../../contexts/WebsiteAuthContext'

import toast from 'react-hot-toast'
import {
  HomeIcon,
  UsersIcon,
  BookOpenIcon,
  ChartBarIcon,
  UserPlusIcon,
  TrophyIcon,
  FireIcon,
  StarIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  SunIcon,
  MoonIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import { User, MapPin, X } from 'lucide-react'
import AddChildModal from '../../../components/parents/AddChildModal'
import ChatBotTrigger from '../../../components/chat/ChatBotTrigger'
import ProfileEditModal from '../../../components/profile/ProfileEditModal'
import AddressForm from '../../../components/forms/AddressForm'
import DashboardComplianceSection from '../../../components/compliance/DashboardComplianceSection'
import { AddressFormData, getCountryName, getStateName } from '../../../lib/address-utils'
import { enrollInCourse } from '../../../lib/api/enrollments'
import { getCourses } from '../../../lib/api/courses'
import { formatCurrency } from '../../../lib/utils'
import { getStudentEnrollments, getStudentCourseProgress } from '../../../lib/api/enrollments'
import { getStudentBatchProgress } from '../../../lib/api/batches'
import { updateUserProfile, getUserProfile } from '../../../lib/api/users'
import {
  createChild,
  getChildrenByParentId,
  updateChild,
  deleteChild,
} from '../../../lib/api/children'
import type { Database } from '../../../lib/supabase'
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
interface Child {
  student_id: string
  full_name: string
  age: number
  grade: string
  email?: string
  avatar?: string
  overall_progress: number
  streak_days: number
  learning_time: {
    daily: number
    weekly: number
    monthly: number
  }
  enrolled_courses: Course[]
  recent_activity: Activity[]
  achievements: Achievement[]
  upcoming_assignments?: Activity[] // Optional - not yet implemented
  batch_progress?: ChildBatchProgress[] // Batch progress information
  // Address information from database
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  phone?: string
  date_of_birth?: string
}

interface ChildBatchProgress {
  batch_name: string
  batch_id: string
  course_title: string
  progress_percentage: number
  completed_weeks: number
  total_weeks: number
  start_date?: string
  end_date?: string
  status: string
}
interface Course {
  id: string
  title: string
  subject: string
  level: string
  progress: number
  total_lessons: number
  completed_lessons: number
  current_grade: number
  enrollment_date: string
  estimated_completion_date: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  batch_info?: {
    batch_id: string
    batch_name: string
    is_in_batch: boolean
  }
}
interface Activity {
  id: string
  type: string
  description: string
  date: string
  course_id?: string
}
interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earned_date: string
}
interface ParentProfile {
  id: string
  full_name: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
}
interface AvailableCourse {
  id: string
  title: string
  subject: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  price: number
  image?: string
  instructor: string
  rating: number
}
interface ParentStats {
  totalChildren: number
  activeEnrollments: number
  completedCourses: number
  certificatesEarned: number
  weeklyProgress: number
  monthlySpending: number
  upcomingEvents: number
  totalLearningHours: number
}

interface StatCard {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  bgGradient: string
  description: string
  delay: number
  permission: { resource: string; action: string }
  suffix?: string
  comingSoon?: boolean
}
export default function ParentsDashboard() {
  const { show: showConfirmDialog, Dialog: ConfirmDialogModal } = useConfirmDialog()
  const { user, canAccess } = useWebsiteAuth()
  const [activeTab, setActiveTab] = useState<
    'home' | 'children' | 'enrollments' | 'progress' | 'settings' | 'analytics'
  >('home')
  const [children, setChildren] = useState<Child[]>([])
  const [courses, setCourses] = useState<AvailableCourse[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [showEditChildModal, setShowEditChildModal] = useState(false)
  const [childToEdit, setChildToEdit] = useState<Child | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [showChildSelectionModal, setShowChildSelectionModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<AvailableCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null)
  const [stats, setStats] = useState<ParentStats>({
    totalChildren: 0,
    activeEnrollments: 0,
    completedCourses: 0,
    certificatesEarned: 0,
    weeklyProgress: 0,
    monthlySpending: 0,
    upcomingEvents: 0,
    totalLearningHours: 0,
  })
  const loadParentData = useCallback(async () => {
    try {
      // Calculate real stats from actual children data - with safe property access
      setStats({
        totalChildren: children.length,
        activeEnrollments: children.reduce(
          (sum, child) => sum + (child.enrolled_courses?.length || 0),
          0,
        ),
        completedCourses: children.reduce(
          (sum, child) =>
            sum + (child.enrolled_courses?.filter((course) => course.progress === 100).length || 0),
          0,
        ),
        certificatesEarned: children.reduce(
          (sum, child) => sum + (child.achievements?.length || 0),
          0,
        ),
        weeklyProgress:
          children.length > 0
            ? Math.round(
                (children.reduce((sum, child) => sum + (child.learning_time?.weekly || 0) / 7, 0) /
                  children.length) *
                  10,
              )
            : 0,
        monthlySpending: 0, // Will be calculated from actual enrollment fees when payment system is implemented
        upcomingEvents: 0, // upcoming_assignments not implemented yet
        totalLearningHours: children.reduce(
          (sum, child) => sum + (child.learning_time?.monthly || 0),
          0,
        ),
      })
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [children])
  // Load parent profile from database
  const loadParentProfile = useCallback(async () => {
    if (!user?.id) return
    try {
      const profile = await getUserProfile(user.id)
      if (profile) {
        // Cast to ProfileWithAddress since database has flat address fields
        const profileWithAddress = profile as unknown as ProfileWithAddress
        setParentProfile({
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
      // Silent error handling
    }
  }, [user?.id])
  // Load children from database
  const loadChildren = useCallback(async () => {
    if (!user?.id) return
    try {
      const childrenProfiles = await getChildrenByParentId(user.id)
      // Convert database profiles to Child interface and fetch enrollments
      const convertedChildren: Child[] = await Promise.all(
        childrenProfiles.map(async (profile) => {
          // Calculate age properly from date of birth
          let age = 0
          if (profile.age) {
            age = profile.age
          } else if (profile.date_of_birth) {
            const birthDate = new Date(profile.date_of_birth)
            const today = new Date()
            age = today.getFullYear() - birthDate.getFullYear()
            const monthDiff = today.getMonth() - birthDate.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--
            }
          }
          // Fetch enrollments for this child
          const enrollments = await getStudentEnrollments(profile.id)

          // Fetch real progress data from progress table
          const progressData = await getStudentCourseProgress(profile.id)

          // Fetch batch progress for this child to correlate with courses
          const batchProgressData = await getStudentBatchProgress(profile.id)

          // Transform enrollments to match Course interface expected by Child
          const enrolled_courses = enrollments.map((enrollment) => {
            // Get real progress from database or default based on status
            let progress = 0
            let currentGrade = 0

            const courseId = enrollment.course?.id || enrollment.course_id

            // Check if there's batch progress for this course
            const batchForCourse = batchProgressData.find((batch) =>
              batch.courses.some((bc) => bc.courses.id === courseId),
            )

            // First check if we have progress data from the progress table
            if (progressData[courseId] !== undefined) {
              progress = progressData[courseId]
            } else if (batchForCourse) {
              // Use batch progress if no individual progress data
              progress = batchForCourse.progress_percentage
            } else {
              // Fallback to enrollment status if no progress data
              if (enrollment.status === 'completed') {
                progress = 100
              } else if (enrollment.status === 'approved') {
                progress = 0
              } else {
                progress = 0
              }
            }

            // Use progress as grade since separate grade tracking is not yet implemented
            currentGrade = progress

            const totalLessons = enrollment.course?.duration_weeks || 0
            const completedLessons =
              totalLessons > 0 ? Math.floor((progress / 100) * totalLessons) : 0

            const enrolledDate = new Date(enrollment.enrolled_at)
            const estimatedCompletionDate = new Date(
              enrolledDate.getTime() +
                (enrollment.course?.duration_weeks || 4) * 7 * 24 * 60 * 60 * 1000,
            )

            // Prepare batch info if student is in a batch for this course
            const batch_info = batchForCourse
              ? {
                  batch_id: batchForCourse.batch.id,
                  batch_name: batchForCourse.batch.name,
                  is_in_batch: true,
                }
              : undefined

            return {
              id: enrollment.course?.id || enrollment.course_id,
              title: enrollment.course?.title || 'Unknown Course',
              subject: enrollment.course?.gurukul?.name || 'General',
              level: enrollment.course?.level || 'basic',
              progress: progress,
              total_lessons: totalLessons,
              completed_lessons: completedLessons,
              current_grade: currentGrade,
              enrollment_date: enrolledDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }),
              estimated_completion_date: estimatedCompletionDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }),
              difficulty: mapCourseLevel(enrollment.course?.level || 'basic'),
              batch_info: batch_info,
            }
          })

          // Map batch progress data for the child interface
          const batch_progress: ChildBatchProgress[] = batchProgressData.map((batchData) => ({
            batch_name: batchData.batch.name,
            batch_id: batchData.batch.id,
            course_title:
              batchData.courses.length > 0 ? batchData.courses[0].courses.title : 'No Course',
            progress_percentage: batchData.progress_percentage,
            completed_weeks: batchData.completed_weeks,
            total_weeks: batchData.total_weeks,
            start_date: batchData.batch.start_date,
            end_date: batchData.batch.end_date,
            status: batchData.batch.status,
          }))

          // Calculate overall progress based on enrolled courses
          const overallProgress =
            enrolled_courses.length > 0
              ? Math.round(
                  enrolled_courses.reduce((sum, course) => sum + course.progress, 0) /
                    enrolled_courses.length,
                )
              : 0

          // Set to 0 until proper tracking fields are added to database schema
          // TODO: Add these fields to database: streak_days, daily_minutes, weekly_minutes, monthly_minutes
          const streakDays = 0
          const dailyMinutes = 0
          const weeklyMinutes = 0
          const monthlyMinutes = 0

          // Use empty arrays for activities and achievements since they're not implemented in database yet
          // TODO: Implement activities and achievements tables in database
          const recentActivities: Activity[] = []
          const achievements: Achievement[] = []

          return {
            student_id: profile.id,
            full_name: profile.full_name || 'Unknown',
            age: age,
            grade: profile.grade || 'Not Set', // Use grade from database
            email: profile.email || '',
            avatar: age < 10 ? '👶' : age < 15 ? '🧒' : '👤',
            overall_progress: overallProgress,
            streak_days: streakDays,
            learning_time: {
              daily: dailyMinutes,
              weekly: weeklyMinutes,
              monthly: monthlyMinutes,
            },
            enrolled_courses,
            recent_activity: recentActivities,
            achievements: achievements,
            batch_progress: batch_progress,
            // Store address data from database
            address_line_1: profile.address_line_1 || '',
            address_line_2: profile.address_line_2 || '',
            city: profile.city || '',
            state: profile.state || '',
            zip_code: profile.zip_code || '',
            country: profile.country || '',
            phone: profile.phone || '',
            date_of_birth: profile.date_of_birth || '',
          }
        }),
      )
      setChildren(convertedChildren)
    } catch {
      toast.error('Failed to load children')
    }
  }, [user?.id])
  // Helper function to map course level to difficulty
  const mapCourseLevel = (
    level: 'elementary' | 'basic' | 'intermediate' | 'advanced',
  ): 'Beginner' | 'Intermediate' | 'Advanced' => {
    switch (level) {
      case 'elementary':
      case 'basic':
        return 'Beginner'
      case 'intermediate':
        return 'Intermediate'
      case 'advanced':
        return 'Advanced'
      default:
        return 'Beginner'
    }
  }
  // Load courses from database
  const loadCourses = useCallback(async () => {
    try {
      setCoursesLoading(true)
      const coursesData = await getCourses()
      // Transform course data to AvailableCourse format
      const transformedCourses: AvailableCourse[] = coursesData.map((course) => ({
        id: course.id,
        title: course.title,
        subject: course.gurukul?.name || 'General', // Use gurukul name as subject
        description: course.description || '',
        difficulty: mapCourseLevel(course.level),
        duration: `${course.duration_weeks} weeks`,
        price: course.price || 0,
        instructor: course.teacher?.full_name || 'Instructor',
        rating: 4.5, // Default rating since not in database yet
      }))
      setCourses(transformedCourses)
    } catch {
      toast.error('Failed to load courses')
      setCourses([])
    } finally {
      setCoursesLoading(false)
    }
  }, [])
  useEffect(() => {
    if (user?.id) {
      loadParentData()
      loadChildren()
      loadParentProfile()
    } else {
      setLoading(false)
    }
  }, [user?.id, loadParentData, loadChildren, loadParentProfile])
  // Debug: Check what user data is available in ParentsDashboard (one-time log)
  // Load courses once when component mounts
  useEffect(() => {
    loadCourses()
  }, [loadCourses])
  const handleAddChild = async (childData: {
    fullName: string
    date_of_birth: string
    grade: string
    phone?: string
    address: AddressFormData
  }) => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }
    try {
      // Create child in database
      const newChildProfile = await createChild({
        full_name: childData.fullName,
        date_of_birth: childData.date_of_birth,
        grade: childData.grade,
        parent_id: user.id,
        phone: childData.phone,
        address_line_1: childData.address.address_line_1,
        city: childData.address.city,
        state: childData.address.state,
        zip_code: childData.address.zip_code,
        country: childData.address.country,
      })
      // Calculate age from date of birth for local state
      const birthDate = new Date(childData.date_of_birth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      // Convert database profile to Child interface for local state
      const newChild: Child = {
        student_id: newChildProfile.student_id || `temp-${Date.now()}`,
        full_name: newChildProfile.full_name || childData.fullName,
        age: age,
        grade: childData.grade,
        avatar: age < 10 ? '👶' : age < 15 ? '🧒' : '👤',
        overall_progress: 0,
        streak_days: 0,
        learning_time: { daily: 0, weekly: 0, monthly: 0 },
        enrolled_courses: [],
        recent_activity: [],
        achievements: [],
      }
      setChildren((prev) => [...prev, newChild])
      setShowAddChildModal(false)
      toast.success(`${childData.fullName} has been added successfully!`)
      loadParentData() // Refresh stats
    } catch {
      toast.error('Failed to add child. Please try again.')
    }
  }
  const handleCourseEnrollment = (course: AvailableCourse) => {
    if (children.length === 0) {
      toast.error('Please add a child first before enrolling in courses')
      return
    }
    setSelectedCourse(course)
    setShowChildSelectionModal(true)
  }
  const handleChildSelection = async (childId: string) => {
    if (!selectedCourse) return
    const selectedChild = children.find((child) => child.student_id === childId)
    if (!selectedChild) return
    try {
      // Actually enroll child in course using the API
      await enrollInCourse(selectedCourse.id, selectedChild.student_id)
      toast.success(`${selectedChild.full_name} has been enrolled in ${selectedCourse.title}!`)
      // Refresh children data to update enrollments
      loadChildren()
    } catch {
      toast.error('Failed to enroll child in course. Please try again.')
    } finally {
      setShowChildSelectionModal(false)
      setSelectedCourse(null)
    }
  }
  const handleEditChild = async (childId: string) => {
    try {
      const child = children.find((child) => child.student_id === childId)
      if (!child) return
      setChildToEdit(child)
      setShowEditChildModal(true)
    } catch {
      toast.error('Failed to open edit modal')
    }
  }
  const handleUpdateChild = async (childData: {
    fullName: string
    date_of_birth: string
    grade: string
    email?: string
    phone?: string
    address: AddressFormData
  }) => {
    try {
      if (!childToEdit) return
      await updateChild(childToEdit.student_id, {
        full_name: childData.fullName,
        date_of_birth: childData.date_of_birth,
        grade: childData.grade,
        email: childData.email,
        phone: childData.phone,
        address_line_1: childData.address.address_line_1,
        city: childData.address.city,
        state: childData.address.state,
        zip_code: childData.address.zip_code,
        country: childData.address.country,
      })
      // Update local state
      setChildren((prev) =>
        prev.map((child) =>
          child.student_id === childToEdit.student_id
            ? {
                ...child,
                full_name: childData.fullName,
                grade: childData.grade,
                email: childData.email,
              }
            : child,
        ),
      )
      setShowEditChildModal(false)
      setChildToEdit(null)
      toast.success(`${childData.fullName} updated successfully!`)
    } catch {
      toast.error('Failed to update child')
    }
  }
  const handleDeleteChild = async (childId: string) => {
    const childToDelete = children.find((child) => child.student_id === childId)
    if (!childToDelete) return
    showConfirmDialog({
      title: 'Delete Child',
      message: `Are you sure you want to remove ${childToDelete.full_name}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteChild(childId)
          setChildren((prev) => prev.filter((child) => child.student_id !== childId))
          toast.success(`${childToDelete.full_name} has been removed`)
          loadParentData()
        } catch {
          toast.error('Failed to delete child')
        }
      },
    })
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
      description: 'Family Learning Hub',
      gradient: 'from-blue-500 to-purple-600',
      available: canAccess('dashboard', 'read'),
    },
    {
      id: 'children',
      name: 'My Children',
      icon: UsersIcon,
      description: 'Manage your children',
      gradient: 'from-green-500 to-teal-600',
      badge: stats.totalChildren > 0 ? stats.totalChildren : undefined,
      available: canAccess('students', 'read'),
    },
    {
      id: 'enrollments',
      name: 'Enrollments',
      icon: ClipboardDocumentListIcon,
      description: 'Course enrollments & progress',
      gradient: 'from-blue-500 to-indigo-600',
      badge: stats.activeEnrollments > 0 ? stats.activeEnrollments : undefined,
      available: canAccess('enrollments', 'read'),
    },
    {
      id: 'progress',
      name: 'Progress Reports',
      icon: ChartBarIcon,
      description: 'Learning analytics & insights',
      gradient: 'from-purple-500 to-pink-600',
      available: canAccess('certificates', 'read'),
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: TrophyIcon,
      description: 'Detailed performance metrics',
      gradient: 'from-yellow-500 to-orange-600',
      available: canAccess('batches', 'read'),
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: CogIcon,
      description: 'Account & preferences',
      gradient: 'from-gray-500 to-gray-600',
      available: canAccess('settings', 'view'),
    },
  ]
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
            <p className="text-gray-600">Preparing your family workspace...</p>
          </motion.div>
        </motion.div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-6 lg:pt-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
      {/* Enhanced Modern Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-6 lg:top-8 z-40 shadow-lg"
      >
        <div className="container-max py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="h-16 w-16 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl"
              >
                <UsersIcon className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 mb-2"
                >
                  <TimeIcon className="h-6 w-6 text-yellow-500" />
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-700 bg-clip-text text-transparent">
                    {greeting}, {user?.full_name || 'Parent'}!
                  </h1>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 font-medium"
                >
                  Managing your family's learning journey
                </motion.p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => {
                  setIsProfileModalOpen(true)
                }}
                className="p-3 rounded-xl bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <CogIcon className="h-5 w-5" />
              </motion.button>
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg"
                >
                  {user?.full_name?.[0] || 'P'}
                </motion.div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-600">Parent Account</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex gap-4 bg-white/50 backdrop-blur-sm p-3 rounded-2xl w-fit border border-white/20 shadow-lg"
          >
            {tabs
              .filter((tab) => tab.available)
              .map((tab, index) => (
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
                        | 'children'
                        | 'enrollments'
                        | 'progress'
                        | 'settings'
                        | 'analytics',
                    )
                    // Scroll to top of page
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`relative flex items-center space-x-3 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg transform scale-105'
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
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'home' && (
              <HomeTab
                stats={stats}
                children={children}
                courses={courses}
                coursesLoading={coursesLoading}
                canAccess={canAccess}
                onAddChild={() => setShowAddChildModal(true)}
                onCourseEnrollment={handleCourseEnrollment}
              />
            )}
            {activeTab === 'children' && (
              <ChildrenTab
                children={children}
                onAddChild={() => setShowAddChildModal(true)}
                onEditChild={handleEditChild}
                onDeleteChild={handleDeleteChild}
              />
            )}
            {activeTab === 'enrollments' && <EnrollmentsTab children={children} />}
            {activeTab === 'progress' && <ProgressTab children={children} stats={stats} />}
            {activeTab === 'analytics' && <AnalyticsTab children={children} stats={stats} />}
            {activeTab === 'settings' && <SettingsTab user={user} parentProfile={parentProfile} />}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Modals */}
      {showAddChildModal && (
        <AddChildModal
          isOpen={showAddChildModal}
          onClose={() => setShowAddChildModal(false)}
          onAddChild={handleAddChild}
          parentInfo={{
            address: {
              street: parentProfile?.address_line_1 || '',
              city: parentProfile?.city || '',
              state: parentProfile?.state || '',
              country: parentProfile?.country || 'United States',
              postal_code: parentProfile?.zip_code || '',
            },
            phone: parentProfile?.phone || user?.phone || undefined,
          }}
        />
      )}
      {showEditChildModal && childToEdit && (
        <AddChildModal
          isOpen={showEditChildModal}
          onClose={() => {
            setShowEditChildModal(false)
            setChildToEdit(null)
          }}
          onAddChild={handleUpdateChild}
          isEditMode={true}
          initialData={{
            fullName: childToEdit.full_name,
            date_of_birth: childToEdit.date_of_birth || '',
            grade: childToEdit.grade,
            email: childToEdit.email || '',
            phone: childToEdit.phone || '',
            address: {
              address_line_1: childToEdit.address_line_1 || '',
              address_line_2: childToEdit.address_line_2 || '',
              city: childToEdit.city || '',
              state: childToEdit.state || '',
              zip_code: childToEdit.zip_code || '',
              country: childToEdit.country || 'United States',
            },
          }}
          parentInfo={{
            address: {
              street: parentProfile?.address_line_1 || '',
              city: parentProfile?.city || '',
              state: parentProfile?.state || '',
              country: parentProfile?.country || 'United States',
              postal_code: parentProfile?.zip_code || '',
            },
            phone: parentProfile?.phone || user?.phone || undefined,
          }}
        />
      )}
      {isProfileModalOpen && user && parentProfile && (
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={
            {
              ...user,
              // Override with address data from parentProfile which has the latest address info
              address_line_1: parentProfile.address_line_1,
              address_line_2: parentProfile.address_line_2,
              city: parentProfile.city,
              state: parentProfile.state,
              zip_code: parentProfile.zip_code,
              country: parentProfile.country,
            } as Profile
          }
          onUpdate={() => {
            // Refresh user data after profile update
            window.location.reload()
          }}
        />
      )}
      {/* Child Selection Modal for Course Enrollment */}
      {showChildSelectionModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Select Child for Enrollment</h3>
              <button
                onClick={() => setShowChildSelectionModal(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">{selectedCourse.title}</h4>
              <p className="text-sm text-blue-700">
                {selectedCourse.subject} • {selectedCourse.difficulty}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {formatCurrency(selectedCourse.price)} • {selectedCourse.duration}
              </p>
            </div>
            <div className="space-y-3">
              {children.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No children added yet.</p>
                  <button
                    onClick={() => {
                      setShowChildSelectionModal(false)
                      setShowAddChildModal(true)
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Add Child First
                  </button>
                </div>
              ) : (
                children.map((child) => (
                  <motion.button
                    key={child.student_id}
                    onClick={() => handleChildSelection(child.student_id)}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {child.full_name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">{child.full_name}</h5>
                        <p className="text-sm text-gray-600">
                          {child.grade} • Age {child.age}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowChildSelectionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Chat Bot */}
      <ChatBotTrigger />
      {ConfirmDialogModal}
    </div>
  )
}
// Home Tab Component
function HomeTab({
  stats,
  children,
  courses,
  coursesLoading,
  canAccess,
  onAddChild,
  onCourseEnrollment,
}: {
  stats: ParentStats
  children: Child[]
  courses: AvailableCourse[]
  coursesLoading: boolean
  canAccess: (resource: string, action: string) => boolean
  onAddChild: () => void
  onCourseEnrollment: (course: AvailableCourse) => void
}) {
  // Define all possible stats cards
  const allStatCards: StatCard[] = [
    {
      title: 'Total Children',
      value: stats.totalChildren,
      icon: UsersIcon,
      gradient: 'from-blue-500 to-purple-600',
      bgGradient: 'from-blue-500/20 to-purple-600/20',
      description: 'Registered children',
      delay: 0.1,
      permission: { resource: 'students', action: 'read' },
    },
    {
      title: 'Active Enrollments',
      value: stats.activeEnrollments,
      icon: BookOpenIcon,
      gradient: 'from-green-500 to-teal-600',
      bgGradient: 'from-green-500/20 to-teal-600/20',
      description: 'Ongoing courses',
      delay: 0.2,
      permission: { resource: 'enrollments', action: 'read' },
    },
    {
      title: 'Certificates Earned',
      value: stats.certificatesEarned,
      icon: AcademicCapIcon,
      gradient: 'from-yellow-500 to-orange-600',
      bgGradient: 'from-yellow-500/20 to-orange-600/20',
      description: 'Achievements unlocked',
      delay: 0.3,
      permission: { resource: 'certificates', action: 'read' },
      comingSoon: true,
    },
    {
      title: 'Learning Hours',
      value: stats.totalLearningHours,
      icon: FireIcon,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-500/20 to-pink-600/20',
      description: 'This month',
      suffix: 'hrs',
      delay: 0.4,
      permission: { resource: 'certificates', action: 'read' },
      comingSoon: true,
    },
  ]

  // Filter stats cards based on permissions
  const statCards = allStatCards.filter((card) => {
    const hasPermission = canAccess(card.permission.resource, card.permission.action)
    console.log(
      `Stat card "${card.title}" - ${card.permission.resource}.${card.permission.action}: ${hasPermission ? 'ALLOWED' : 'DENIED'}`,
    )
    return hasPermission
  })
  return (
    <div className="space-y-6">
      {/* Stats Grid - Only show if there are permitted stats cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Reduced from gap-6 to gap-4 */}
          {statCards.map((stat) => (
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
              <div className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative rounded-xl p-8">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
                />
                {stat.comingSoon && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                )}
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
                        className={`text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                          stat.comingSoon ? 'opacity-50' : ''
                        }`}
                      >
                        {stat.value}
                        {stat.suffix || ''}
                      </motion.p>
                      <p className="text-sm text-gray-500">{stat.description}</p>
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
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {/* Recent Activity & Quick Actions */}
      {(canAccess('certificates', 'read') || canAccess('students', 'update')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          {canAccess('certificates', 'read') && (
            <motion.div
              className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative rounded-xl p-6"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 opacity-50" />
              <div className="relative">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <ClipboardDocumentListIcon className="h-6 w-6 mr-3 text-blue-600" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {children.slice(0, 3).map((child, index) => (
                    <motion.div
                      key={child.student_id}
                      className="p-4 rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-300 border border-white/30"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.6 + 0.1 * index }}
                      whileHover={{ scale: 1.02, x: 5 }}
                    >
                      {/* Child Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                          {child.full_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{child.full_name}</p>
                          <p className="text-xs text-gray-600">{child.grade}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {child.overall_progress}%
                          </div>
                          <div className="text-xs text-gray-600">Progress</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300"
                            style={{ width: `${child.overall_progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Learning Stats */}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-blue-50 rounded-md p-2">
                          <div className="text-sm font-bold text-blue-600">
                            {child.enrolled_courses?.length || 0}
                          </div>
                          <div className="text-xs text-blue-500">Courses</div>
                        </div>
                        <div className="bg-green-50 rounded-md p-2">
                          <div className="text-sm font-bold text-green-600">
                            {child.learning_time.weekly}
                          </div>
                          <div className="text-xs text-green-500">Min/Week</div>
                        </div>
                        <div className="bg-purple-50 rounded-md p-2">
                          <div className="text-sm font-bold text-purple-600">
                            {child.streak_days}
                          </div>
                          <div className="text-xs text-purple-500">Streak</div>
                        </div>
                        <div className="bg-orange-50 rounded-md p-2">
                          <div className="text-sm font-bold text-orange-600">
                            {child.enrolled_courses
                              ? Math.round(
                                  child.enrolled_courses.reduce(
                                    (acc, course) => acc + course.progress,
                                    0,
                                  ) / child.enrolled_courses.length,
                                ) || 0
                              : 0}
                            %
                          </div>
                          <div className="text-xs text-orange-500">Avg</div>
                        </div>
                      </div>

                      {/* Recent Activity or Top Course */}
                      <div className="mt-3 pt-3 border-t border-gray-200 relative">
                        <span className="absolute top-1 right-0 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                        {child.recent_activity && child.recent_activity.length > 0 ? (
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 truncate">
                                {child.recent_activity[0].description}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(child.recent_activity[0].date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-2 opacity-50">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 truncate">
                                Recent activity tracking coming soon
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          {/* Quick Actions */}
          {canAccess('students', 'update') && (
            <motion.div
              className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative rounded-xl p-6"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-600/10 opacity-50" />
              <div className="relative">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <StarIcon className="h-6 w-6 mr-3 text-yellow-500" />
                  Quick Actions
                </h3>
                <div className="space-y-4">
                  <motion.button
                    onClick={onAddChild}
                    className="w-full flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <UserPlusIcon className="h-6 w-6" />
                    <span className="font-semibold">Add New Child</span>
                  </motion.button>
                  <motion.button
                    className="w-full flex items-center space-x-4 p-4 rounded-xl bg-white/60 hover:bg-white/80 border border-white/30 text-gray-700 hover:text-gray-900 transition-all duration-300 cursor-pointer"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ChartBarIcon className="h-6 w-6" />
                    <span className="font-semibold">View Reports</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
      {/* Course Enrollment Section */}
      {canAccess('courses', 'view') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <AcademicCapIcon className="h-6 w-6 mr-3 text-blue-600" />
              Available Courses
            </h3>
            <motion.button
              onClick={() => {
                window.location.href = '/ssh-app/courses'
              }}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              View All Courses
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coursesLoading
              ? // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-sm"
                  >
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))
              : courses.slice(0, 6).map((course: AvailableCourse, index: number) => (
                  <motion.div
                    key={course.id}
                    className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{course.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{course.subject}</p>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            course.difficulty === 'Beginner'
                              ? 'bg-green-100 text-green-800'
                              : course.difficulty === 'Intermediate'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {course.difficulty}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(course.price)}
                        </div>
                        <div className="text-xs text-gray-600">{course.duration}</div>
                      </div>
                    </div>
                    <div
                      className="text-xs text-gray-600 mb-3"
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-600 ml-1">({course.rating})</span>
                      </div>
                      <span className="text-xs text-gray-600">{course.instructor}</span>
                    </div>
                    <motion.button
                      onClick={() => onCourseEnrollment(course)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Enroll Now
                    </motion.button>
                  </motion.div>
                ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
// Children Tab Component
function ChildrenTab({
  children,
  onAddChild,
  onEditChild,
  onDeleteChild,
}: {
  children: Child[]
  onAddChild: () => void
  onEditChild: (childId: string) => void
  onDeleteChild: (childId: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Children</h2>
        <motion.button
          onClick={onAddChild}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <UserPlusIcon className="h-5 w-5" />
          <span>Add Child</span>
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Reduced from gap-6 to gap-4 */}
        {children.map((child, index) => (
          <motion.div
            key={child.student_id}
            className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative rounded-xl p-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-600/10 opacity-50" />
            <div className="relative">
              {/* Edit/Delete buttons */}
              <div className="absolute top-0 right-0 flex space-x-2">
                <motion.button
                  onClick={() => onEditChild(child.student_id)}
                  className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Edit Child"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </motion.button>
                <motion.button
                  onClick={() => onDeleteChild(child.student_id)}
                  className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Delete Child"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </motion.button>
              </div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  {child.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{child.full_name}</h3>
                  <p className="text-sm text-gray-600">
                    {child.grade} • Age {child.age}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {/* Overall Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Overall Progress</span>
                    <span className="text-gray-900 font-semibold">{child.overall_progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${child.overall_progress}%` }}
                    />
                  </div>
                </div>

                {/* Course Progress Summary */}
                {child.enrolled_courses && child.enrolled_courses.length > 0 && (
                  <div className="bg-white/40 rounded-lg p-3 border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Course Progress</h4>
                      <div className="flex items-center space-x-1">
                        {child.enrolled_courses.some(
                          (course) => course.batch_info?.is_in_batch,
                        ) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <svg
                              className="w-2.5 h-2.5 mr-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                            </svg>
                            In Batches
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 max-h-24 overflow-y-auto">
                      {child.enrolled_courses.slice(0, 3).map((course) => (
                        <div key={course.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center flex-1 mr-2">
                              <span className="text-gray-600 truncate">{course.title}</span>
                              {course.batch_info && (
                                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <svg
                                    className="w-2.5 h-2.5 mr-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                  </svg>
                                  Batch
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-900 font-medium">{course.progress}%</span>
                              <div className="w-8 h-1.5 bg-gray-200 rounded-full">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-300"
                                  style={{ width: `${course.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          {course.batch_info && (
                            <div className="text-xs text-orange-600 pl-1">
                              {course.batch_info.batch_name}
                            </div>
                          )}
                        </div>
                      ))}
                      {child.enrolled_courses.length > 3 && (
                        <div className="text-xs text-gray-500 text-center pt-1">
                          +{child.enrolled_courses.length - 3} more courses
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Learning Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/60 rounded-lg p-3 border border-white/30">
                    <p className="text-lg font-bold text-gray-900">
                      {child.enrolled_courses?.length || 0}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">Courses</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-white/30 relative">
                    <span className="absolute top-1 right-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                      Soon
                    </span>
                    <p className="text-lg font-bold text-gray-900 opacity-50">
                      {child.streak_days}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">Streak</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-white/30 relative">
                    <span className="absolute top-1 right-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                      Soon
                    </span>
                    <p className="text-lg font-bold text-gray-900 opacity-50">
                      {child.learning_time.weekly}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">Mins/Week</p>
                  </div>
                </div>

                {/* Recent Activity Preview */}
                <div className="bg-white/40 rounded-lg p-3 border border-white/20 relative">
                  <div className="absolute top-2 right-2">
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
                  {child.recent_activity && child.recent_activity.length > 0 ? (
                    <div className="space-y-1">
                      {child.recent_activity.slice(0, 2).map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-2 text-xs">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-600 truncate flex-1">
                            {activity.description}
                          </span>
                          <span className="text-gray-500 flex-shrink-0">
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="opacity-50">
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-500">Activity tracking coming soon</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Achievements Preview */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200 relative">
                  <div className="absolute top-2 right-2">
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  {child.achievements && child.achievements.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-yellow-800">Latest Achievement</h4>
                        <div className="text-lg">{child.achievements[0].icon}</div>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">{child.achievements[0].title}</p>
                    </>
                  ) : (
                    <div className="opacity-50">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-yellow-800">Latest Achievement</h4>
                        <div className="text-lg">🏆</div>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Achievement tracking coming soon
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
// Enrollments Tab Component
function EnrollmentsTab({ children }: { children: Child[] }) {
  const allEnrollments = children.flatMap((child) =>
    (child.enrolled_courses || []).map((course: Course) => ({
      ...course,
      childName: child.full_name,
      childId: child.student_id,
    })),
  )
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Course Enrollments</h2>
        <div className="text-sm text-gray-600">
          {allEnrollments.length} enrollment{allEnrollments.length !== 1 ? 's' : ''} total
        </div>
      </div>

      {allEnrollments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {allEnrollments.map((enrollment, index) => (
            <motion.div
              key={`${enrollment.childId}-${enrollment.id}`}
              className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              {/* Course Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">{enrollment.title}</h3>
                  <p className="text-sm text-gray-600">{enrollment.subject}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Student:</span>
                    <span className="font-medium text-gray-900">{enrollment.childName}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Level:</span>
                    <span
                      className={`px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r ${
                        enrollment.level === 'elementary' || enrollment.level === 'basic'
                          ? 'from-green-400 to-blue-500 text-white'
                          : enrollment.level === 'intermediate'
                            ? 'from-yellow-400 to-orange-500 text-white'
                            : 'from-red-400 to-pink-500 text-white'
                      }`}
                    >
                      {enrollment.level.charAt(0).toUpperCase() +
                        enrollment.level.slice(1).toLowerCase()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Enrolled:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(enrollment.enrollment_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Course Enrollments</h3>
          <p className="text-gray-600 mb-4">Your children haven't enrolled in any courses yet.</p>
          <p className="text-sm text-gray-500">
            Visit the course catalog to get started with learning!
          </p>
        </div>
      )}
    </div>
  )
}
// Progress Tab Component
function ProgressTab({ children, stats }: { children: Child[]; stats: ParentStats }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Progress Reports</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reduced from gap-6 to gap-4 */}
        <motion.div
          className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6 relative"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute top-3 right-3">
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Coming Soon
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
          <div className="text-center opacity-50">
            <div className="text-4xl font-bold text-gray-900 mb-2">{stats.weeklyProgress}%</div>
            <p className="text-gray-600">Average completion this week</p>
          </div>
        </motion.div>
        <motion.div
          className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6 relative"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute top-3 right-3">
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Coming Soon
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Time</h3>
          <div className="text-center opacity-50">
            <div className="text-4xl font-bold text-gray-900 mb-2">{stats.totalLearningHours}</div>
            <p className="text-gray-600">Hours this month</p>
          </div>
        </motion.div>
      </div>
      <div className="space-y-6">
        {children.map((child, index) => (
          <motion.div
            key={child.student_id}
            className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
          >
            {/* Child Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {child.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{child.full_name}</h3>
                  <p className="text-sm text-gray-600">{child.grade}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{child.overall_progress}%</div>
                <div className="text-sm text-gray-600">Overall Progress</div>
              </div>
            </div>

            {/* Learning Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center bg-blue-50 rounded-lg p-3">
                <div className="text-lg font-bold text-blue-600">{child.learning_time.daily}</div>
                <div className="text-xs text-blue-500">Daily (min)</div>
              </div>
              <div className="text-center bg-green-50 rounded-lg p-3">
                <div className="text-lg font-bold text-green-600">{child.learning_time.weekly}</div>
                <div className="text-xs text-green-500">Weekly (min)</div>
              </div>
              <div className="text-center bg-purple-50 rounded-lg p-3">
                <div className="text-lg font-bold text-purple-600">{child.streak_days}</div>
                <div className="text-xs text-purple-500">Streak (days)</div>
              </div>
              <div className="text-center bg-orange-50 rounded-lg p-3">
                <div className="text-lg font-bold text-orange-600">
                  {child.enrolled_courses?.length || 0}
                </div>
                <div className="text-xs text-orange-500">Courses</div>
              </div>
            </div>

            {/* Course Progress Breakdown */}
            {child.enrolled_courses && child.enrolled_courses.length > 0 ? (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpenIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Course Progress Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {child.enrolled_courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white/60 rounded-lg p-4 border border-white/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm mb-1">{course.title}</h5>
                          <p className="text-xs text-gray-600">
                            {course.subject} • {course.level}
                          </p>
                          {course.batch_info && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                </svg>
                                Batch: {course.batch_info.batch_name}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-lg font-bold text-gray-900">{course.progress}%</div>
                          <div className="text-xs text-gray-600">Complete</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Progress Bar */}
                        <div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Course Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center bg-gray-50 rounded p-2">
                            <div className="font-medium text-gray-900">
                              {course.completed_lessons}/{course.total_lessons}
                            </div>
                            <div className="text-gray-600">Lessons</div>
                          </div>
                          <div className="text-center bg-gray-50 rounded p-2">
                            <div className="font-medium text-gray-900">{course.current_grade}%</div>
                            <div className="text-gray-600">Grade</div>
                          </div>
                        </div>

                        {/* Enrollment Info */}
                        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                          <span>
                            Started: {new Date(course.enrollment_date).toLocaleDateString()}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              course.difficulty === 'Beginner'
                                ? 'bg-green-100 text-green-700'
                                : course.difficulty === 'Intermediate'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {course.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No courses enrolled yet</p>
                <p className="text-sm text-gray-500">
                  Encourage {child.full_name} to start their learning journey!
                </p>
              </div>
            )}

            {/* Recent Achievements */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <TrophyIcon className="h-5 w-5 mr-2 text-yellow-600" />
                Recent Achievements
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </h4>
              {child.achievements && child.achievements.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {child.achievements.slice(0, 3).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200 flex-1 min-w-0"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{achievement.icon}</span>
                        <div className="min-w-0 flex-1">
                          <h6 className="font-medium text-yellow-800 text-sm truncate">
                            {achievement.title}
                          </h6>
                          <p className="text-xs text-yellow-700 truncate">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 opacity-50">
                  <p className="text-gray-500 text-sm">
                    Achievement tracking will be available soon
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
// Analytics Tab Component
function AnalyticsTab({ children, stats }: { children: Child[]; stats: ParentStats }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reduced from gap-6 to gap-4 */}
        <motion.div
          className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6 text-center relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute top-2 right-2">
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
              Soon
            </span>
          </div>
          <TrophyIcon className="h-8 w-8 text-yellow-500 mx-auto mb-3 opacity-50" />
          <div className="text-2xl font-bold text-gray-900 opacity-50">
            {stats.certificatesEarned}
          </div>
          <div className="text-sm text-gray-600">Certificates</div>
        </motion.div>
        <motion.div
          className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6 text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <BookOpenIcon className="h-8 w-8 text-blue-500 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">{stats.activeEnrollments}</div>
          <div className="text-sm text-gray-600">Active Courses</div>
        </motion.div>
        <motion.div
          className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6 text-center relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="absolute top-2 right-2">
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
              Soon
            </span>
          </div>
          <FireIcon className="h-8 w-8 text-orange-500 mx-auto mb-3 opacity-50" />
          <div className="text-2xl font-bold text-gray-900 opacity-50">
            {stats.totalLearningHours}
          </div>
          <div className="text-sm text-gray-600">Hours Learned</div>
        </motion.div>
        <motion.div
          className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6 text-center relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="absolute top-2 right-2">
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
              Soon
            </span>
          </div>
          <CalendarDaysIcon className="h-8 w-8 text-green-500 mx-auto mb-3 opacity-50" />
          <div className="text-2xl font-bold text-gray-900 opacity-50">{stats.upcomingEvents}</div>
          <div className="text-sm text-gray-600">Upcoming Events</div>
        </motion.div>
      </div>

      {/* Detailed Child Analytics */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Individual Child Analytics</h3>
        {children.map((child, index) => (
          <motion.div
            key={child.student_id}
            className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 + 0.1 * index }}
          >
            {/* Child Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {child.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{child.full_name}</h4>
                  <p className="text-sm text-gray-600">
                    {child.grade} • {child.enrolled_courses?.length || 0} courses enrolled
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{child.overall_progress}%</div>
                <div className="text-sm text-gray-600">Overall Progress</div>
              </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 text-center relative">
                <span className="absolute top-1 right-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
                <div className="text-2xl font-bold text-blue-600 opacity-50">
                  {child.learning_time.daily}
                </div>
                <div className="text-xs text-blue-500 font-medium">Daily Minutes</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center relative">
                <span className="absolute top-1 right-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
                <div className="text-2xl font-bold text-green-600 opacity-50">
                  {child.learning_time.weekly}
                </div>
                <div className="text-xs text-green-500 font-medium">Weekly Minutes</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center relative">
                <span className="absolute top-1 right-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
                <div className="text-2xl font-bold text-purple-600 opacity-50">
                  {child.streak_days}
                </div>
                <div className="text-xs text-purple-500 font-medium">Day Streak</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center relative">
                <span className="absolute top-1 right-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
                <div className="text-2xl font-bold text-orange-600 opacity-50">
                  {child.achievements?.length || 0}
                </div>
                <div className="text-xs text-orange-500 font-medium">Achievements</div>
              </div>
            </div>

            {/* Progress Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Course Performance */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Course Performance
                </h5>
                {child.enrolled_courses && child.enrolled_courses.length > 0 ? (
                  <div className="space-y-3">
                    {child.enrolled_courses.slice(0, 3).map((course) => (
                      <div
                        key={course.id}
                        className="bg-white/60 rounded-lg p-3 border border-white/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                            {course.title}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-900">
                              {course.progress}%
                            </span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-300"
                                style={{ width: `${course.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Grade: {course.current_grade}%</span>
                          <span>
                            {course.completed_lessons}/{course.total_lessons} lessons
                          </span>
                        </div>
                      </div>
                    ))}
                    {child.enrolled_courses.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{child.enrolled_courses.length - 3} more courses
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <BookOpenIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No courses enrolled</p>
                  </div>
                )}
              </div>

              {/* Learning Insights */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <StarIcon className="h-5 w-5 mr-2 text-yellow-600" />
                  Learning Insights
                </h5>
                <div className="space-y-3">
                  {/* Performance Status */}
                  <div className="bg-white/60 rounded-lg p-3 border border-white/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Performance Status</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          child.overall_progress >= 80
                            ? 'bg-green-100 text-green-700'
                            : child.overall_progress >= 60
                              ? 'bg-yellow-100 text-yellow-700'
                              : child.overall_progress >= 40
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {child.overall_progress >= 80
                          ? 'Excellent'
                          : child.overall_progress >= 60
                            ? 'Good'
                            : child.overall_progress >= 40
                              ? 'Average'
                              : 'Needs Support'}
                      </span>
                    </div>
                  </div>

                  {/* Learning Consistency */}
                  <div className="bg-white/60 rounded-lg p-3 border border-white/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Learning Consistency
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          child.streak_days >= 7
                            ? 'bg-green-100 text-green-700'
                            : child.streak_days >= 3
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {child.streak_days >= 7
                          ? 'Excellent'
                          : child.streak_days >= 3
                            ? 'Good'
                            : 'Can Improve'}
                      </span>
                    </div>
                  </div>

                  {/* Recent Achievements */}
                  {child.achievements && child.achievements.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{child.achievements[0].icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-yellow-800 truncate">
                            {child.achievements[0].title}
                          </p>
                          <p className="text-xs text-yellow-700">Latest Achievement</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Study Time Analysis */}
                  <div className="bg-white/60 rounded-lg p-3 border border-white/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Weekly Study Goal</span>
                      <span className="text-xs text-gray-600">
                        {Math.round((child.learning_time.weekly / 300) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (child.learning_time.weekly / 300) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Target: 300 minutes/week</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {children.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Added</h3>
            <p className="text-gray-600">
              Add your first child to see detailed analytics and insights.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
// Settings Tab Component
function SettingsTab({
  user,
  parentProfile,
}: {
  user: { id: string; email: string; full_name: string; role: string } | null
  parentProfile: ParentProfile | null
}) {
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [addressData, setAddressData] = useState<AddressFormData>({
    country: '',
    state: '',
    city: '',
    address_line_1: '',
    address_line_2: '',
    zip_code: '',
  })
  const [personalInfo, setPersonalInfo] = useState({
    full_name: user?.full_name || '',
    phone: '',
  })
  // Load existing user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        full_name: user.full_name || '',
        phone: parentProfile?.phone || '', // Load from parentProfile
      })
    }
  }, [user, parentProfile])
  // Load address data from parentProfile - prevent infinite loops with ref
  const addressLoadedRef = useRef(false)
  useEffect(() => {
    if (parentProfile && !addressLoadedRef.current) {
      setAddressData({
        country: parentProfile.country || '',
        state: parentProfile.state || '',
        city: parentProfile.city || '',
        address_line_1: parentProfile.address_line_1 || '',
        address_line_2: parentProfile.address_line_2 || '',
        zip_code: parentProfile.zip_code || '',
      })
      addressLoadedRef.current = true
    }
  }, [parentProfile])
  const handleSaveProfile = async () => {
    try {
      if (!user?.id) {
        toast.error('User not authenticated')
        return
      }
      // Update user profile with personal info and address data
      const updateData = {
        full_name: personalInfo.full_name,
        phone: personalInfo.phone,
        address_line_1: addressData.address_line_1,
        address_line_2: addressData.address_line_2,
        city: addressData.city,
        state: addressData.state,
        zip_code: addressData.zip_code,
        country: addressData.country,
      }
      await updateUserProfile(user.id, updateData as Parameters<typeof updateUserProfile>[1])
      toast.success('Profile updated successfully!')
      setShowEditProfile(false)
    } catch {
      toast.error('Failed to update profile')
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <motion.button
          onClick={() => setShowEditProfile(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <User className="h-4 w-4" />
          <span>Edit Profile</span>
        </motion.button>
      </div>
      <motion.div
        className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Full Name</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
              {user?.full_name || 'Not provided'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
              {user?.email || 'Not provided'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Role</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 capitalize">
              {user?.role || 'Parent'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
              {personalInfo.phone || 'Not provided'}
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
        <div className="px-3 py-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
          {addressData.address_line_1 ? (
            <div className="space-y-1">
              <div className="font-medium text-gray-900">
                {addressData.address_line_1}
                {addressData.address_line_2 && `, ${addressData.address_line_2}`}
              </div>
              <div>
                {addressData.city}
                {addressData.state &&
                  `, ${getStateName(addressData.country, addressData.state)}`}{' '}
                {addressData.zip_code}
              </div>
              <div>{getCountryName(addressData.country)}</div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No address provided</p>
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                >
                  Add address
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
      <motion.div
        className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded" defaultChecked />
            <span className="text-gray-900">Email notifications for progress updates</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded" defaultChecked />
            <span className="text-gray-900">SMS alerts for important events</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded" />
            <span className="text-gray-900">Weekly progress reports</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded" />
            <span className="text-gray-900">Course completion certificates</span>
          </label>
        </div>
      </motion.div>

      {/* Compliance Section */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <DashboardComplianceSection
          userId={user?.id || ''}
          userRole="parent"
          compactView={false}
          showNotifications={true}
        />
      </motion.div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                {/* Horizontal Layout with Two Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Personal Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Personal Information
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={personalInfo.full_name}
                          onChange={(e) =>
                            setPersonalInfo((prev) => ({ ...prev, full_name: e.target.value }))
                          }
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={personalInfo.phone}
                          onChange={(e) =>
                            setPersonalInfo((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Right Column - Address Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                      🏠 Address Information
                    </h4>
                    <AddressForm
                      data={addressData}
                      onChange={setAddressData}
                      showOptionalFields={true}
                      required={true}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleSaveProfile}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
