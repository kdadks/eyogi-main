import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebsiteAuth } from '../../../contexts/WebsiteAuthContext'
import { Badge } from '../../../components/ui/Badge'
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
import AddChildModal from '../../../components/parents/AddChildModal'
import ChatBotTrigger from '../../../components/chat/ChatBotTrigger'
import ProfileEditModal from '../../../components/profile/ProfileEditModal'
import {
  createChild,
  getChildrenByParentId,
  updateChild,
  deleteChild,
} from '../../../lib/api/children'
import { enrollInCourse } from '../../../lib/api/enrollments'
import { getCourses } from '../../../lib/api/courses'
import { getStudentEnrollments } from '../../../lib/api/enrollments'

interface Child {
  student_id: string
  full_name: string
  age: number
  grade: string
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

export default function ParentsDashboard() {
  const { user } = useWebsiteAuth()

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
      // TODO: Replace with real API calls
      // For now, just set empty stats since we're removing mock data
      setStats({
        totalChildren: children.length,
        activeEnrollments: children.reduce((sum, child) => sum + child.enrolled_courses.length, 0),
        completedCourses: children.reduce(
          (sum, child) =>
            sum + child.enrolled_courses.filter((course) => course.progress === 100).length,
          0,
        ),
        certificatesEarned: children.reduce((sum, child) => sum + child.achievements.length, 0),
        weeklyProgress: 85,
        monthlySpending: 2500,
        upcomingEvents: 3,
        totalLearningHours: children.reduce((sum, child) => sum + child.learning_time.monthly, 0),
      })
    } catch (error) {
      console.error('Error loading parent data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [children])

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

          // Transform enrollments to match Course interface expected by Child
          const enrolled_courses = enrollments.map((enrollment) => ({
            id: enrollment.course?.id || enrollment.course_id,
            title: enrollment.course?.title || 'Unknown Course',
            subject: 'General', // Default since database doesn't have subject field
            level: enrollment.course?.level || 'basic',
            progress:
              enrollment.status === 'completed' ? 100 : enrollment.status === 'approved' ? 25 : 0,
            total_lessons: enrollment.course?.duration_weeks || 0, // Use duration as lesson count
            completed_lessons: 0,
            current_grade: profile?.grade ? parseInt(profile.grade) : 0,
            enrollment_date: new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
            estimated_completion_date: '',
            difficulty: 'Beginner' as const,
          }))

          return {
            student_id: profile.id,
            full_name: profile.full_name || 'Unknown',
            age: age,
            grade: profile.grade || 'Not Set', // Use grade from database
            avatar: age < 10 ? '�' : age < 15 ? '🧒' : '👤',
            overall_progress: 0,
            streak_days: 0,
            learning_time: { daily: 0, weekly: 0, monthly: 0 },
            enrolled_courses,
            recent_activity: [],
            achievements: [],
          }
        }),
      )

      setChildren(convertedChildren)
    } catch (error) {
      console.error('Error loading children:', error)
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
    } catch (error) {
      console.error('Error loading courses:', error)
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
    } else {
      setLoading(false)
    }
  }, [user?.id, loadParentData, loadChildren])

  // Load courses once when component mounts
  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const handleAddChild = async (childData: {
    fullName: string
    date_of_birth: string
    grade: string
    phone?: string
    address_line_1?: string
    city?: string
    state?: string
    zip_code?: string
    country?: string
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
        address_line_1: childData.address_line_1,
        city: childData.city,
        state: childData.state,
        zip_code: childData.zip_code,
        country: childData.country,
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
    } catch (error) {
      console.error('Error creating child:', error)
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
    } catch (error) {
      console.error('Error enrolling child:', error)
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
    } catch (error) {
      console.error('Error opening edit modal:', error)
      toast.error('Failed to open edit modal')
    }
  }

  const handleUpdateChild = async (childData: {
    fullName: string
    date_of_birth: string
    grade: string
    phone?: string
    address_line_1?: string
    city?: string
    state?: string
    zip_code?: string
    country?: string
  }) => {
    try {
      if (!childToEdit) return

      await updateChild(childToEdit.student_id, {
        full_name: childData.fullName,
        date_of_birth: childData.date_of_birth,
        grade: childData.grade,
        phone: childData.phone,
        address_line_1: childData.address_line_1,
        city: childData.city,
        state: childData.state,
        zip_code: childData.zip_code,
        country: childData.country,
      })

      // Update local state
      setChildren((prev) =>
        prev.map((child) =>
          child.student_id === childToEdit.student_id
            ? {
                ...child,
                full_name: childData.fullName,
                grade: childData.grade,
              }
            : child,
        ),
      )

      setShowEditChildModal(false)
      setChildToEdit(null)
      toast.success(`${childData.fullName} updated successfully!`)
    } catch (error) {
      console.error('Error updating child:', error)
      toast.error('Failed to update child')
    }
  }

  const handleDeleteChild = async (childId: string) => {
    const childToDelete = children.find((child) => child.student_id === childId)
    if (!childToDelete) return

    if (
      !window.confirm(
        `Are you sure you want to remove ${childToDelete.full_name}? This action cannot be undone.`,
      )
    ) {
      return
    }

    try {
      await deleteChild(childId)

      // Remove from local state
      setChildren((prev) => prev.filter((child) => child.student_id !== childId))

      toast.success(`${childToDelete.full_name} has been removed`)
      loadParentData() // Refresh stats
    } catch (error) {
      console.error('Error deleting child:', error)
      toast.error('Failed to delete child')
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
      description: 'Family Learning Hub',
      gradient: 'from-blue-500 to-purple-600',
      available: true,
    },
    {
      id: 'children',
      name: 'My Children',
      icon: UsersIcon,
      description: 'Manage your children',
      gradient: 'from-green-500 to-teal-600',
      badge: stats.totalChildren > 0 ? stats.totalChildren : undefined,
      available: true,
    },
    {
      id: 'enrollments',
      name: 'Enrollments',
      icon: ClipboardDocumentListIcon,
      description: 'Course enrollments & progress',
      gradient: 'from-blue-500 to-indigo-600',
      badge: stats.activeEnrollments > 0 ? stats.activeEnrollments : undefined,
      available: true,
    },
    {
      id: 'progress',
      name: 'Progress Reports',
      icon: ChartBarIcon,
      description: 'Learning analytics & insights',
      gradient: 'from-purple-500 to-pink-600',
      available: true,
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: TrophyIcon,
      description: 'Detailed performance metrics',
      gradient: 'from-yellow-500 to-orange-600',
      available: true,
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: CogIcon,
      description: 'Account & preferences',
      gradient: 'from-gray-500 to-gray-600',
      available: true,
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
            <p className="text-gray-600">Preparing your family workspace...</p>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16 lg:pt-20">
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
        className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-16 lg:top-20 z-40 shadow-lg"
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          {/* Reduced from py-8 to py-4 */}
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
                onClick={() => setIsProfileModalOpen(true)}
                className="p-3 rounded-xl bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Reduced from py-10 to py-6 */}
        {/* Dynamic Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/20">
            <motion.div layout className="flex flex-wrap gap-2">
              {tabs
                .filter((tab) => tab.available)
                .map((tab, index) => (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
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
                    className={`relative flex items-center space-x-3 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
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
            {activeTab === 'settings' && <SettingsTab user={user} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      {showAddChildModal && (
        <AddChildModal
          isOpen={showAddChildModal}
          onClose={() => setShowAddChildModal(false)}
          onAddChild={handleAddChild}
          existingChildren={children}
          parentInfo={{
            address: {
              street: '',
              city: '',
              state: '',
              country: 'United States',
              postal_code: '',
            },
            phone: user?.phone || undefined,
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
          existingChildren={children.filter((child) => child.student_id !== childToEdit.student_id)}
          parentInfo={{
            address: {
              street: '',
              city: '',
              state: '',
              country: 'United States',
              postal_code: '',
            },
            phone: user?.phone || undefined,
          }}
          editMode={true}
          childToEdit={{
            fullName: childToEdit.full_name,
            grade: childToEdit.grade,
            date_of_birth: new Date(new Date().getFullYear() - childToEdit.age, 0, 1)
              .toISOString()
              .split('T')[0],
          }}
        />
      )}

      {isProfileModalOpen && (
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user!}
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
                className="text-gray-500 hover:text-gray-700"
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
                ₹{selectedCourse.price} • {selectedCourse.duration}
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
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Add Child First
                  </button>
                </div>
              ) : (
                children.map((child) => (
                  <motion.button
                    key={child.student_id}
                    onClick={() => handleChildSelection(child.student_id)}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
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
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Chat Bot */}
      <ChatBotTrigger />
    </div>
  )
}

// Home Tab Component
function HomeTab({
  stats,
  children,
  courses,
  coursesLoading,
  onAddChild,
  onCourseEnrollment,
}: {
  stats: ParentStats
  children: Child[]
  courses: AvailableCourse[]
  coursesLoading: boolean
  onAddChild: () => void
  onCourseEnrollment: (course: AvailableCourse) => void
}) {
  const statCards = [
    {
      title: 'Total Children',
      value: stats.totalChildren,
      icon: UsersIcon,
      gradient: 'from-blue-500 to-purple-600',
      bgGradient: 'from-blue-500/20 to-purple-600/20',
      description: 'Registered children',
      delay: 0.1,
    },
    {
      title: 'Active Enrollments',
      value: stats.activeEnrollments,
      icon: BookOpenIcon,
      gradient: 'from-green-500 to-teal-600',
      bgGradient: 'from-green-500/20 to-teal-600/20',
      description: 'Ongoing courses',
      delay: 0.2,
    },
    {
      title: 'Certificates Earned',
      value: stats.certificatesEarned,
      icon: AcademicCapIcon,
      gradient: 'from-yellow-500 to-orange-600',
      bgGradient: 'from-yellow-500/20 to-orange-600/20',
      description: 'Achievements unlocked',
      delay: 0.3,
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
    },
  ]

  return (
    <div className="space-y-6">
      {/* Reduced from space-y-8 to space-y-6 */}
      {/* Stats Grid */}
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

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
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
                  className="flex items-center space-x-4 p-4 rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-300 border border-white/30"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 + 0.1 * index }}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                    {child.full_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{child.full_name}</p>
                    <p className="text-xs text-gray-600">
                      Progress: {child.overall_progress}% • {child.enrolled_courses.length} courses
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300"
                        style={{ width: `${child.overall_progress}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
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
                className="w-full flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserPlusIcon className="h-6 w-6" />
                <span className="font-semibold">Add New Child</span>
              </motion.button>

              <motion.button
                className="w-full flex items-center space-x-4 p-4 rounded-xl bg-white/60 hover:bg-white/80 border border-white/30 text-gray-700 hover:text-gray-900 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChartBarIcon className="h-6 w-6" />
                <span className="font-semibold">View Reports</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Course Enrollment Section */}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
                      <div className="text-sm font-bold text-gray-900">₹{course.price}</div>
                      <div className="text-xs text-gray-600">{course.duration}</div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-3">{course.description}</p>

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
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Enroll Now
                  </motion.button>
                </motion.div>
              ))}
        </div>
      </motion.div>
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
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
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
                  className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
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
                  className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
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

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white/60 rounded-xl p-4 border border-white/30">
                    <p className="text-xl font-bold text-gray-900">
                      {child.enrolled_courses.length}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">Courses</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4 border border-white/30">
                    <p className="text-xl font-bold text-gray-900">{child.streak_days}</p>
                    <p className="text-xs text-gray-600 font-medium">Day Streak</p>
                  </div>
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
    child.enrolled_courses.map((course: Course) => ({
      ...course,
      childName: child.full_name,
      childId: child.student_id,
    })),
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Course Enrollments</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reduced from gap-6 to gap-4 */}
        {allEnrollments.map((enrollment, index) => (
          <motion.div
            key={`${enrollment.childId}-${enrollment.id}`}
            className="rounded-xl backdrop-blur-md bg-white/90 border border-gray-200 p-6 shadow-sm"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{enrollment.title}</h3>
                <p className="text-sm text-gray-600">Student: {enrollment.childName}</p>
              </div>
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700 border-purple-200"
              >
                {enrollment.progress}%
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-900">{enrollment.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${enrollment.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Enrolled: {enrollment.enrollment_date}</span>
                <span className="text-gray-600">Grade: {enrollment.current_grade || 'N/A'}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
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
          className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">{stats.weeklyProgress}%</div>
            <p className="text-gray-600">Average completion this week</p>
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Time</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">{stats.totalLearningHours}</div>
            <p className="text-gray-600">Hours this month</p>
          </div>
        </motion.div>
      </div>

      <div className="space-y-4">
        {children.map((child, index) => (
          <motion.div
            key={child.student_id}
            className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {child.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{child.full_name}</h3>
                  <p className="text-sm text-gray-600">{child.grade}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{child.overall_progress}%</div>
                <div className="text-sm text-gray-600">Overall</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{child.learning_time.daily}</div>
                <div className="text-xs text-gray-600">Daily (min)</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{child.learning_time.weekly}</div>
                <div className="text-xs text-gray-600">Weekly (min)</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{child.streak_days}</div>
                <div className="text-xs text-gray-600">Streak (days)</div>
              </div>
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
          className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6 text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <TrophyIcon className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">{stats.certificatesEarned}</div>
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
          className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6 text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <FireIcon className="h-8 w-8 text-orange-500 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">{stats.totalLearningHours}</div>
          <div className="text-sm text-gray-600">Hours Learned</div>
        </motion.div>

        <motion.div
          className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6 text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <CalendarDaysIcon className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</div>
          <div className="text-sm text-gray-600">Upcoming Events</div>
        </motion.div>
      </div>

      <motion.div
        className="rounded-xl backdrop-blur-md bg-white/80 border border-white/20 shadow-lg p-6"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="space-y-4">
          {children.map((child, index) => (
            <div
              key={child.student_id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{child.full_name}</span>
                <span className="text-sm text-gray-600">{child.overall_progress}% complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${child.overall_progress}%` }}
                  transition={{ duration: 1, delay: 0.5 + 0.1 * index }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// Settings Tab Component
function SettingsTab({
  user,
}: {
  user: { id: string; email: string; full_name: string; role: string } | null
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>

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
        </div>
      </motion.div>
    </div>
  )
}
