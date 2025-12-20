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
  DocumentTextIcon,
  ShieldExclamationIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { sanitizeHtml } from '../../../utils/sanitize'
import { User, MapPin, X } from 'lucide-react'
import AddChildModal from '../../../components/parents/AddChildModal'
import ChatBotTrigger from '../../../components/chat/ChatBotTrigger'
import ProfileEditModal from '../../../components/profile/ProfileEditModal'
import { HelpButton, parentsDashboardHelpTopics } from '../../../components/help'
import AddressForm from '../../../components/forms/AddressForm'
import DashboardComplianceSection from '../../../components/compliance/DashboardComplianceSection'
import StudentAttendanceView from '../../../components/student/StudentAttendanceView'
import DataDeletionRequest from '../../../components/gdpr/DataDeletionRequest'
import ConsentModal from '../../../components/consent/ConsentModal'
import ConsentStatusBadge from '../../../components/consent/ConsentStatusBadge'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card'
import { AddressFormData, getCountryName, getStateName } from '../../../lib/address-utils'
import { enrollInCourse } from '../../../lib/api/enrollments'
import { getCourses } from '../../../lib/api/courses'
import { formatCurrency } from '../../../lib/utils'
import { getStudentEnrollments, getStudentCourseProgress } from '../../../lib/api/enrollments'
import { getStudentBatchProgress } from '../../../lib/api/batches'
import { updateUserProfile, getUserProfile } from '../../../lib/api/users'
import type { ChangedByInfo } from '../../../lib/api/auditTrail'
import {
  createChild,
  getChildrenByParentId,
  updateChild,
  deleteChild,
} from '../../../lib/api/children'
import { getStudentConsent, StudentConsent } from '../../../lib/api/consent'
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
  student_id: string // Database UUID for queries (profile.id)
  display_student_id?: string // ISO format student ID for display (e.g., IRLDU202500001)
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
  date_of_birth?: string
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
    'home' | 'children' | 'enrollments' | 'progress' | 'attendance' | 'profile' | 'analytics'
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
  const [selectedChildForAttendance, setSelectedChildForAttendance] = useState<string | null>(null)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [selectedChildForConsent, setSelectedChildForConsent] = useState<Child | null>(null)
  const [childConsents, setChildConsents] = useState<Map<string, StudentConsent>>(new Map())
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
          date_of_birth: (profile as any).date_of_birth || undefined,
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
            student_id: profile.id, // Use profile.id (UUID) for database queries like attendance
            display_student_id: profile.student_id, // ISO format student ID for display
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

      // Load consent status for all children
      const consents = await Promise.all(
        convertedChildren.map((child) => getStudentConsent(child.student_id)),
      )
      const consentMap = new Map<string, StudentConsent>()
      consents.forEach((consent) => {
        if (consent) {
          consentMap.set(consent.student_id, consent)
        }
      })
      setChildConsents(consentMap)
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
      const { courses: coursesData } = await getCourses()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])
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
      // Build changedBy info for audit trail - the parent is adding a child
      const changedBy: ChangedByInfo = {
        id: user.id,
        email: user.email || '',
        name: user.full_name || user.email || 'Unknown',
        role: user.role || 'parent',
      }

      // Create child in database
      const newChildProfile = await createChild(
        {
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
        },
        changedBy,
      )
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
    if (user?.status !== 'active') {
      toast.error(
        'Your account must be activated by an admin before you can enroll children in courses',
      )
      return
    }
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
    if (user?.status !== 'active') {
      toast.error('Your account must be activated by an admin before you can edit children')
      return
    }
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
      if (!childToEdit || !user?.id) return

      // Build changedBy info for audit trail - the parent is updating a child
      const changedBy: ChangedByInfo = {
        id: user.id,
        email: user.email || '',
        name: user.full_name || user.email || 'Unknown',
        role: user.role || 'parent',
      }

      await updateChild(
        childToEdit.student_id,
        {
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
        },
        changedBy,
      )
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
    if (user?.status !== 'active') {
      toast.error('Your account must be activated by an admin before you can delete children')
      return
    }
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
      id: 'attendance',
      name: 'Attendance',
      icon: CalendarDaysIcon,
      description: "View your children's attendance",
      gradient: 'from-teal-500 to-cyan-600',
      available: canAccess('batches', 'read'),
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
      id: 'profile',
      name: 'Profile',
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
          className="text-center bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/20"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-0">
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
              className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0"
            >
              <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 mb-1"
              >
                <TimeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                <h1 className="text-base sm:text-lg lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-700 bg-clip-text text-transparent truncate">
                  {greeting}, {user?.full_name || 'Parent'}! 👋
                </h1>
                {user?.status === 'active' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-3 py-1 shadow-sm"
                  >
                    <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs font-semibold text-green-700 whitespace-nowrap">
                      Account Active
                    </span>
                  </motion.div>
                )}
              </motion.div>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xs sm:text-sm text-gray-600 font-medium truncate"
              >
                Managing your family's learning journey
              </motion.p>
            </div>
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
              >
                <HelpButton
                  topics={parentsDashboardHelpTopics}
                  title="Parents Dashboard Help"
                  description="Learn how to manage your children's learning journey and track their progress"
                  showKeyboardHint={true}
                />
              </motion.div>
              <motion.button
                onClick={() => {
                  setIsProfileModalOpen(true)
                }}
                className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <CogIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold shadow-lg text-xs sm:text-sm"
              >
                {user?.full_name?.[0] || 'P'}
              </motion.div>
            </div>
          </div>

          {/* Enhanced Navigation Pills - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-3 sm:mt-4 lg:mt-8 w-full relative"
          >
            {/* Scroll indicator for mobile */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none sm:hidden z-10 rounded-r-lg" />
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
              <div className="flex gap-2 sm:gap-3 lg:gap-4 bg-white/50 backdrop-blur-sm p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl border border-white/20 shadow-lg min-w-min">
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
                            | 'attendance'
                            | 'profile'
                            | 'analytics',
                        )
                        // Scroll to top of page
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      title={tab.name}
                      className={`relative flex items-center justify-center gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-lg lg:rounded-xl font-semibold text-xs sm:text-sm lg:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap min-h-[44px] ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-md'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5 flex-shrink-0" />
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
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Account Status Banners */}
      {user?.status !== 'active' && user?.status === 'pending_verification' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="w-full px-3 sm:px-4 lg:px-6 py-3"
        >
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-lg p-4 shadow-md">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                  Account Pending Verification
                </h3>
                <p className="text-sm text-yellow-800">
                  Your parent account is currently under review. Once an admin approves your
                  account, you'll have full access to manage your child's enrollments and view their
                  progress.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10 max-w-7xl mx-auto">
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {activeTab === 'home' && (
              <HomeTab
                stats={stats}
                children={children}
                courses={courses}
                coursesLoading={coursesLoading}
                canAccess={canAccess}
                isAccountActive={user?.status === 'active'}
                onAddChild={() => {
                  if (user?.status !== 'active') {
                    toast.error(
                      'Your account must be activated by an admin before you can add children',
                    )
                    return
                  }
                  setShowAddChildModal(true)
                }}
                onCourseEnrollment={handleCourseEnrollment}
              />
            )}
            {activeTab === 'children' && (
              <ChildrenTab
                children={children}
                isAccountActive={user?.status === 'active'}
                onAddChild={() => {
                  if (user?.status !== 'active') {
                    toast.error(
                      'Your account must be activated by an admin before you can add children',
                    )
                    return
                  }
                  setShowAddChildModal(true)
                }}
                onEditChild={handleEditChild}
                onDeleteChild={handleDeleteChild}
                onManageConsent={(child) => {
                  setSelectedChildForConsent(child)
                  setShowConsentModal(true)
                }}
                childConsents={childConsents}
              />
            )}
            {activeTab === 'enrollments' && <EnrollmentsTab children={children} />}
            {activeTab === 'progress' && <ProgressTab children={children} stats={stats} />}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Child</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select
                      value={selectedChildForAttendance || ''}
                      onChange={(e) => setSelectedChildForAttendance(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a child...</option>
                      {children.map((child) => (
                        <option key={child.student_id} value={child.student_id}>
                          {child.full_name || child.email}
                        </option>
                      ))}
                    </select>
                  </CardContent>
                </Card>
                {selectedChildForAttendance && (
                  <StudentAttendanceView studentId={selectedChildForAttendance} />
                )}
              </div>
            )}
            {activeTab === 'analytics' && <AnalyticsTab children={children} stats={stats} />}
            {activeTab === 'profile' && (
              <ProfileTab user={user} parentProfile={parentProfile} children={children} />
            )}
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
              // Override with data from parentProfile which has the latest info
              phone: parentProfile.phone,
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
      {/* Consent Modal */}
      {showConsentModal && selectedChildForConsent && user && (
        <ConsentModal
          studentId={selectedChildForConsent.student_id}
          studentName={selectedChildForConsent.full_name}
          consentedBy={user.id}
          currentConsent={childConsents.get(selectedChildForConsent.student_id) || null}
          onClose={() => {
            setShowConsentModal(false)
            setSelectedChildForConsent(null)
          }}
          onSuccess={() => {
            setShowConsentModal(false)
            setSelectedChildForConsent(null)
            loadChildren() // Reload to update consent status
          }}
          isParent={true}
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
  isAccountActive,
  onAddChild,
  onCourseEnrollment,
}: {
  stats: ParentStats
  children: Child[]
  courses: AvailableCourse[]
  coursesLoading: boolean
  canAccess: (resource: string, action: string) => boolean
  isAccountActive: boolean
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
    return hasPermission
  })
  return (
    <div className="space-y-6">
      {/* Stats Grid - Only show if there are permitted stats cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
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
              className="group h-full"
            >
              <div className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-8 h-full flex flex-col">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
                />
                {stat.comingSoon && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                )}
                <div className="relative flex-1 flex flex-col">
                  <div className="flex items-start sm:items-center justify-between gap-2 flex-1">
                    <div className="space-y-2 sm:space-y-3 min-w-0">
                      <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                        {stat.title}
                      </p>
                      <motion.p
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: stat.delay + 0.2 }}
                        className={`text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                          stat.comingSoon ? 'opacity-50' : ''
                        }`}
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
                      className={`h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-gradient-to-r ${stat.gradient} rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 flex-shrink-0`}
                    >
                      <stat.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
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
                    className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                            {course.title}
                          </h4>
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
                        <div className="text-right ml-2 flex-shrink-0">
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(course.price)}
                          </div>
                          <div className="text-xs text-gray-600">{course.duration}</div>
                        </div>
                      </div>
                      <div
                        className="text-xs text-gray-600 mb-3 line-clamp-3 flex-1"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }}
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
                        <span className="text-xs text-gray-600 truncate ml-2">
                          {course.instructor}
                        </span>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => onCourseEnrollment(course)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 cursor-pointer mt-auto"
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
  isAccountActive,
  onAddChild,
  onEditChild,
  onDeleteChild,
  onManageConsent,
  childConsents,
}: {
  children: Child[]
  isAccountActive: boolean
  onAddChild: () => void
  onEditChild: (childId: string) => void
  onDeleteChild: (childId: string) => void
  onManageConsent: (child: Child) => void
  childConsents: Map<string, StudentConsent>
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">My Children</h2>
        <motion.button
          onClick={onAddChild}
          disabled={!isAccountActive}
          className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm sm:text-base min-h-[44px] ${
            isAccountActive
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
          }`}
          whileHover={isAccountActive ? { scale: 1.05 } : {}}
          whileTap={isAccountActive ? { scale: 0.95 } : {}}
        >
          <UserPlusIcon className="h-5 w-5" />
          <span>Add Child</span>
        </motion.button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Reduced from gap-6 to gap-4 */}
        {children.map((child, index) => (
          <motion.div
            key={child.student_id}
            className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative rounded-lg sm:rounded-xl p-4 sm:p-6 flex flex-col h-full"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-600/10 opacity-50" />
            <div className="relative flex-1 flex flex-col">
              {/* Edit/Delete buttons - Mobile-friendly touch targets (min 44x44px) */}
              <div className="absolute top-0 right-0 flex gap-2">
                <motion.button
                  onClick={() => onEditChild(child.student_id)}
                  disabled={!isAccountActive}
                  className={`min-w-[44px] min-h-[44px] w-11 h-11 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 ${
                    isAccountActive
                      ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                      : 'bg-gray-400 cursor-not-allowed opacity-50'
                  }`}
                  whileHover={isAccountActive ? { scale: 1.1 } : {}}
                  whileTap={isAccountActive ? { scale: 0.9 } : {}}
                  title={isAccountActive ? 'Edit Child' : 'Account must be activated'}
                  aria-label="Edit Child"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  disabled={!isAccountActive}
                  className={`min-w-[44px] min-h-[44px] w-11 h-11 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 ${
                    isAccountActive
                      ? 'bg-red-500 hover:bg-red-600 cursor-pointer'
                      : 'bg-gray-400 cursor-not-allowed opacity-50'
                  }`}
                  whileHover={isAccountActive ? { scale: 1.1 } : {}}
                  whileTap={isAccountActive ? { scale: 0.9 } : {}}
                  title={isAccountActive ? 'Delete Child' : 'Account must be activated'}
                  aria-label="Delete Child"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </motion.button>
                <motion.button
                  onClick={() => onManageConsent(child)}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Manage Consent"
                  aria-label="Manage Consent"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                </motion.button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center text-white text-sm sm:text-base lg:text-lg font-bold shadow-lg flex-shrink-0">
                  {child.full_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg truncate">
                    {child.full_name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {child.grade} • Age {child.age}
                  </p>
                  {child.display_student_id && (
                    <p className="text-xs sm:text-sm text-purple-600 font-medium mt-0.5">
                      ID: {child.display_student_id}
                    </p>
                  )}
                  <div className="mt-2">
                    <ConsentStatusBadge
                      consentGiven={childConsents.get(child.student_id)?.consent_given || false}
                      withdrawn={childConsents.get(child.student_id)?.withdrawn || false}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {/* Overall Progress */}
                <div>
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span className="text-gray-600 font-medium">Overall Progress</span>
                    <span className="text-gray-900 font-semibold">{child.overall_progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 sm:h-3 rounded-full transition-all duration-300"
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
        <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">
          Course Enrollments
        </h2>
        <div className="text-xs sm:text-sm text-gray-600">
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
      <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">Progress Reports</h2>
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
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {stats.weeklyProgress}%
            </div>
            <p className="text-xs sm:text-sm text-gray-600">Average completion this week</p>
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
// Profile Tab Component
function ProfileTab({
  user,
  parentProfile,
  children,
}: {
  user: { id: string; email: string; full_name: string; role: string } | null
  parentProfile: ParentProfile | null
  children: Child[]
}) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Convert user and parentProfile to Profile type for ProfileEditModal
  const profileForModal: Profile | null =
    user && parentProfile
      ? ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role as any,
          phone: parentProfile.phone,
          date_of_birth: parentProfile.date_of_birth,
          address_line_1: parentProfile.address_line_1,
          address_line_2: parentProfile.address_line_2,
          city: parentProfile.city,
          state: parentProfile.state,
          zip_code: parentProfile.zip_code,
          country: parentProfile.country,
          student_id: null,
          teacher_code: null,
          grade: null,
          emergency_contact: null,
          preferences: {},
          created_at: '',
          updated_at: '',
        } as Profile)
      : null

  const handleProfileUpdate = () => {
    // Refresh page data after profile update
    window.location.reload()
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-6 sm:mb-8 lg:mb-10">
        <h2 className="text-base sm:text-lg lg:text-3xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
          My Profile 👤
        </h2>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-2">
          Manage your account preferences and information
        </p>
      </div>

      {/* Account Profile Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-white/20">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <CogIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-gray-600 flex-shrink-0" />
            <h3 className="text-sm sm:text-base lg:text-xl font-semibold text-gray-900">
              Account Information
            </h3>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap cursor-pointer"
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                <label className="text-sm font-medium text-gray-500">Role</label>
                <p className="text-gray-900 capitalize">{user?.role || 'Parent'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{parentProfile?.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="text-gray-900">
                  {parentProfile?.date_of_birth
                    ? new Date(parentProfile.date_of_birth).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
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
                <p className="text-gray-900">{parentProfile?.address_line_1 || 'Not provided'}</p>
                {parentProfile?.address_line_2 && (
                  <p className="text-gray-900">{parentProfile.address_line_2}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Show city only if available */}
                {parentProfile?.city && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">City</label>
                    <p className="text-gray-900">{parentProfile.city}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">State</label>
                  <p className="text-gray-900">
                    {parentProfile?.state && parentProfile?.country
                      ? getStateName(parentProfile.country, parentProfile.state) ||
                        parentProfile.state
                      : 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ZIP Code</label>
                  <p className="text-gray-900">{parentProfile?.zip_code || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Country</label>
                  <p className="text-gray-900">
                    {parentProfile?.country
                      ? getCountryName(parentProfile.country) || parentProfile.country
                      : 'Not provided'}
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
          userRole="parent"
          compactView={false}
          showNotifications={true}
        />
      </div>

      {/* GDPR Data Deletion Section */}
      <div className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ShieldExclamationIcon className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">GDPR Data Deletion & Privacy</h3>
        </div>

        {/* Consolidated GDPR Information - Show once for all */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Your Right to Data Deletion
              </h4>
              <p className="text-xs text-blue-800 mb-2">
                Under GDPR Article 17, you have the right to request deletion of personal data for
                yourself and your children. This includes personal information, enrollment data,
                attendance records, consent records, and compliance submissions.
              </p>
              <p className="text-xs text-blue-800">
                Note: Certificates may be anonymized rather than deleted for legal compliance.
              </p>
            </div>
          </div>
        </div>

        {/* Critical Warning for Parent Account Deletion */}
        {children.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-red-900 mb-2">
                  ⚠️ CRITICAL WARNING - Parent Account Deletion
                </h4>
                <p className="text-xs text-red-800 font-semibold mb-2">
                  If you request deletion of YOUR ACCOUNT (parent account), ALL {children.length}{' '}
                  {children.length === 1 ? 'child account' : 'children accounts'} linked to you will
                  be PERMANENTLY DELETED automatically.
                </p>
                <p className="text-xs text-red-800">
                  This is irreversible. All children's data, enrollments, certificates, and progress
                  will be lost forever. Please exercise utmost caution before requesting parent
                  account deletion.
                </p>
                <p className="text-xs text-red-700 mt-2 font-medium">
                  To delete only a specific child's account, use the individual deletion option for
                  that child below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Compact Account Deletion Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Parent's Own Account */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-200">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                {(() => {
                  if (!user?.full_name) return 'P'
                  const nameParts = user.full_name.trim().split(/\s+/)
                  return nameParts.length > 1
                    ? (
                        nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
                      ).toUpperCase()
                    : nameParts[0].charAt(0).toUpperCase()
                })()}
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-gray-900">Your Account</h5>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <DataDeletionRequest userId={user?.id || ''} userRole="parent" compactView={true} />
          </div>

          {/* Children Accounts */}
          {children.map((child) => {
            // Get initials from child's name (first letter of first and last name)
            const nameParts = child.full_name.trim().split(/\s+/)
            const childInitials =
              nameParts.length > 1
                ? nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
                : nameParts[0].charAt(0)

            return (
              <div
                key={child.student_id}
                className="border border-gray-200 rounded-lg p-4 bg-white"
              >
                <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-200">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {childInitials.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-gray-900">{child.full_name}</h5>
                    <p className="text-xs text-gray-500">
                      {child.display_student_id || `ID: ${child.student_id.slice(0, 8)}`}
                    </p>
                  </div>
                </div>
                <DataDeletionRequest
                  userId={user?.id || ''}
                  userRole="parent"
                  targetUserId={child.student_id}
                  targetUserName={child.full_name}
                  compactView={true}
                />
              </div>
            )
          })}
        </div>

        {children.length === 0 && (
          <div className="text-center py-4 text-gray-500 mt-4 border-t border-gray-200">
            <p className="text-sm">No children accounts found.</p>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {profileForModal && (
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={profileForModal}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  )
}
