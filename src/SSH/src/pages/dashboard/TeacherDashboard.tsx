import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Course, Enrollment, Certificate } from '@/types'
import { getTeacherCourses, createCourse } from '@/lib/api/courses'
import { getTeacherEnrollments, updateEnrollmentStatus, bulkUpdateEnrollments } from '@/lib/api/enrollments'
import { issueCertificate, bulkIssueCertificates } from '@/lib/api/certificates'
import { getGurukuls } from '@/lib/api/gurukuls'
import { formatCurrency, formatDate, getStatusColor, getLevelColor } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
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
  CalendarIcon,
  TrophyIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  CurrencyEuroIcon,
  UsersIcon,
  GiftIcon,
  StarIcon,
  FireIcon,
  LightBulbIcon
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
  max_students: z.number().min(1, 'Must allow at least 1 student'),
  delivery_method: z.enum(['physical', 'remote', 'hybrid']),
  entry_requirements: z.string().optional(),
  learning_outcomes: z.array(z.string()).min(1, 'At least one learning outcome is required')
})

type CourseForm = z.infer<typeof courseSchema>

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [gurukuls, setGurukuls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([])
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'courses' | 'students' | 'certificates' | 'analytics'>('overview')
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([''])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      level: 'basic',
      delivery_method: 'remote',
      learning_outcomes: ['']
    }
  })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      const [coursesData, enrollmentsData, gurukulData] = await Promise.all([
        getTeacherCourses(user!.id),
        getTeacherEnrollments(user!.id),
        getGurukuls()
      ])
      setCourses(coursesData)
      setEnrollments(enrollmentsData)
      setGurukuls(gurukulData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (data: CourseForm) => {
    try {
      const courseData = {
        ...data,
        teacher_id: user!.id,
        is_active: true,
        learning_outcomes: learningOutcomes.filter(outcome => outcome.trim() !== '')
      }
      await createCourse(courseData)
      await loadDashboardData()
      setShowCreateCourse(false)
      reset()
      setLearningOutcomes([''])
      toast.success('Course created successfully!')
    } catch (error) {
      toast.error('Failed to create course')
    }
  }

  const handleApproveEnrollment = async (enrollmentId: string) => {
    try {
      await updateEnrollmentStatus(enrollmentId, 'approved')
      await loadDashboardData()
      toast.success('Enrollment approved!')
    } catch (error) {
      toast.error('Failed to approve enrollment')
    }
  }

  const handleRejectEnrollment = async (enrollmentId: string) => {
    try {
      await updateEnrollmentStatus(enrollmentId, 'rejected')
      await loadDashboardData()
      toast.success('Enrollment rejected')
    } catch (error) {
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
    } catch (error) {
      toast.error('Failed to approve enrollments')
    }
  }

  const handleIssueCertificate = async (enrollmentId: string) => {
    try {
      await issueCertificate(enrollmentId)
      await loadDashboardData()
      toast.success('Certificate issued successfully!')
    } catch (error) {
      toast.error('Failed to issue certificate')
    }
  }

  const handleBulkIssueCertificates = async () => {
    const eligibleEnrollments = enrollments.filter(e => 
      e.status === 'completed' && !e.certificate_issued
    )
    
    if (eligibleEnrollments.length === 0) {
      toast.error('No eligible students for certificate issuance')
      return
    }

    try {
      await bulkIssueCertificates(eligibleEnrollments.map(e => e.id))
      await loadDashboardData()
      toast.success(`${eligibleEnrollments.length} certificates issued!`)
    } catch (error) {
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

  // Calculate stats
  const stats = {
    totalCourses: courses.length,
    totalStudents: enrollments.length,
    pendingApprovals: enrollments.filter(e => e.status === 'pending').length,
    completedCourses: enrollments.filter(e => e.status === 'completed').length,
    certificatesIssued: enrollments.filter(e => e.certificate_issued).length,
    pendingCertificates: enrollments.filter(e => e.status === 'completed' && !e.certificate_issued).length,
    totalRevenue: enrollments.filter(e => e.payment_status === 'paid').reduce((sum, e) => sum + (e.course?.fee || 0), 0),
    averageRating: 4.8 // Mock data
  }

  const recentActivity = [
    { type: 'enrollment', message: 'New enrollment in Hindu Philosophy', time: '2 minutes ago', icon: UserGroupIcon },
    { type: 'completion', message: 'Student completed Sanskrit Basics', time: '1 hour ago', icon: CheckCircleIcon },
    { type: 'certificate', message: 'Certificate issued to Sarah Johnson', time: '3 hours ago', icon: DocumentTextIcon },
    { type: 'course', message: 'Course materials updated', time: '1 day ago', icon: BookOpenIcon }
  ]

  const quickActions = [
    {
      title: 'Create New Course',
      description: 'Design and launch a new course',
      icon: PlusIcon,
      action: () => setShowCreateCourse(true),
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      highlight: true
    },
    {
      title: 'Review Enrollments',
      description: `${stats.pendingApprovals} pending approvals`,
      icon: ClockIcon,
      action: () => setActiveView('students'),
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      badge: stats.pendingApprovals
    },
    {
      title: 'Issue Certificates',
      description: `${stats.pendingCertificates} ready to issue`,
      icon: TrophyIcon,
      action: () => setActiveView('certificates'),
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      badge: stats.pendingCertificates
    },
    {
      title: 'View Analytics',
      description: 'Track your teaching performance',
      icon: ChartBarIcon,
      action: () => setActiveView('analytics'),
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center page-with-header">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600 text-lg">Loading your teaching dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 page-with-header">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="container-max py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <AcademicCapIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Welcome back, {user?.full_name?.split(' ')[0] || 'Teacher'}! 👋
                </h1>
                <p className="text-gray-600">Ready to inspire minds today?</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <BellIcon className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                {stats.pendingApprovals > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {stats.pendingApprovals}
                  </span>
                )}
              </div>
              <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300">
                <StarIcon className="h-4 w-4 mr-1" />
                {stats.averageRating} Rating
              </Badge>
            </div>
          </div>

          {/* Navigation Pills */}
          <div className="mt-6 flex space-x-2 bg-gray-100/50 p-1 rounded-xl w-fit">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'courses', name: 'My Courses', icon: BookOpenIcon },
              { id: 'students', name: 'Students', icon: UserGroupIcon },
              { id: 'certificates', name: 'Certificates', icon: DocumentTextIcon },
              { id: 'analytics', name: 'Analytics', icon: ArrowTrendingUpIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeView === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-max py-8">
        {/* Overview */}
        {activeView === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Courses</p>
                      <p className="text-3xl font-bold">{stats.totalCourses}</p>
                    </div>
                    <BookOpenIcon className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Total Students</p>
                      <p className="text-3xl font-bold">{stats.totalStudents}</p>
                    </div>
                    <UserGroupIcon className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Certificates</p>
                      <p className="text-3xl font-bold">{stats.certificatesIssued}</p>
                    </div>
                    <TrophyIcon className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Revenue</p>
                      <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                    </div>
                    <CurrencyEuroIcon className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <SparklesIcon className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold">Quick Actions</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors">
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
                        <span className="font-semibold text-green-800">Excellent Completion Rate</span>
                      </div>
                      <p className="text-sm text-green-700">85% of your students complete courses successfully</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <StarIcon className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">High Student Satisfaction</span>
                      </div>
                      <p className="text-sm text-blue-700">Average rating of {stats.averageRating}/5.0 from students</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrophyIcon className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-800">Certificate Achievement</span>
                      </div>
                      <p className="text-sm text-purple-700">{stats.certificatesIssued} certificates issued this month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Courses View */}
        {activeView === 'courses' && (
          <div className="space-y-6">
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
                  <p className="text-gray-600 mb-6">Create your first course to start teaching!</p>
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
                  const courseEnrollments = enrollments.filter(e => e.course_id === course.id)
                  const pendingCertificates = courseEnrollments.filter(e => e.status === 'completed' && !e.certificate_issued).length
                  
                  return (
                    <Card key={course.id} className="border-0 shadow-xl bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
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
                            <span>{formatCurrency(course.fee)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrophyIcon className="h-4 w-4 text-gray-400" />
                            <span>{courseEnrollments.filter(e => e.certificate_issued).length} certified</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Link to={`/courses/${course.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </Link>
                          {pendingCertificates > 0 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const eligibleEnrollments = courseEnrollments.filter(e => e.status === 'completed' && !e.certificate_issued)
                                if (eligibleEnrollments.length > 0) {
                                  bulkIssueCertificates(eligibleEnrollments.map(e => e.id))
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
          </div>
        )}

        {/* Students View */}
        {activeView === 'students' && (
          <div className="space-y-6">
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
                  <div className="text-2xl font-bold text-orange-900">{stats.pendingApprovals}</div>
                  <div className="text-sm text-orange-700">Pending Approvals</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">{enrollments.filter(e => e.status === 'approved').length}</div>
                  <div className="text-sm text-green-700">Active Students</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 text-center">
                  <TrophyIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900">{stats.completedCourses}</div>
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
                    <p className="text-gray-600">Students will appear here once they enroll in your courses.</p>
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
                                  setSelectedEnrollments(enrollments.filter(e => e.status === 'pending').map(e => e.id))
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
                          <tr key={enrollment.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-3 px-4">
                              {enrollment.status === 'pending' && (
                                <input
                                  type="checkbox"
                                  checked={selectedEnrollments.includes(enrollment.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedEnrollments([...selectedEnrollments, enrollment.id])
                                    } else {
                                      setSelectedEnrollments(selectedEnrollments.filter(id => id !== enrollment.id))
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
                                  <p className="text-sm text-gray-500">{enrollment.student?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{enrollment.course?.title}</p>
                                <p className="text-sm text-gray-500">{enrollment.course?.course_number}</p>
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
                                {enrollment.status === 'completed' && !enrollment.certificate_issued && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleIssueCertificate(enrollment.id)}
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
          </div>
        )}

        {/* Certificates View */}
        {activeView === 'certificates' && (
          <div className="space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6 text-center">
                  <TrophyIcon className="h-10 w-10 text-green-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-green-900">{stats.certificatesIssued}</div>
                  <div className="text-sm text-green-700">Certificates Issued</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-6 text-center">
                  <ClockIcon className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-orange-900">{stats.pendingCertificates}</div>
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
            </div>

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
                      .filter(e => e.status === 'completed' && !e.certificate_issued)
                      .map((enrollment) => (
                        <div key={enrollment.id} className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">
                                {enrollment.student?.full_name?.charAt(0) || 'S'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-orange-900">{enrollment.student?.full_name}</p>
                              <p className="text-sm text-orange-700">{enrollment.course?.title}</p>
                            </div>
                          </div>
                          <div className="text-xs text-orange-600 mb-3">
                            Completed: {formatDate(enrollment.completed_at || enrollment.enrolled_at)}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleIssueCertificate(enrollment.id)}
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates issued yet</h3>
                    <p className="text-gray-600">Certificates will appear here once you issue them to students.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enrollments
                      .filter(e => e.certificate_issued)
                      .map((enrollment) => (
                        <div key={enrollment.id} className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                              <TrophyIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-green-900">{enrollment.student?.full_name}</p>
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
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Teaching Analytics</h2>
              <p className="text-gray-600">Track your performance and student engagement</p>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <StarIcon className="h-10 w-10 mx-auto mb-3 text-blue-200" />
                  <div className="text-3xl font-bold">{stats.averageRating}</div>
                  <div className="text-sm text-blue-100">Average Rating</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <CheckCircleIcon className="h-10 w-10 mx-auto mb-3 text-green-200" />
                  <div className="text-3xl font-bold">85%</div>
                  <div className="text-sm text-green-100">Completion Rate</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <UserGroupIcon className="h-10 w-10 mx-auto mb-3 text-purple-200" />
                  <div className="text-3xl font-bold">{Math.round(stats.totalStudents / stats.totalCourses) || 0}</div>
                  <div className="text-sm text-purple-100">Avg Students/Course</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <CurrencyEuroIcon className="h-10 w-10 mx-auto mb-3 text-orange-200" />
                  <div className="text-3xl font-bold">{formatCurrency(stats.totalRevenue / stats.totalCourses || 0)}</div>
                  <div className="text-sm text-orange-100">Avg Revenue/Course</div>
                </CardContent>
              </Card>
            </div>

            {/* Course Performance */}
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <h3 className="text-lg font-semibold">Course Performance</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.map((course) => {
                    const courseEnrollments = enrollments.filter(e => e.course_id === course.id)
                    const completionRate = courseEnrollments.length > 0 
                      ? Math.round((courseEnrollments.filter(e => e.status === 'completed').length / courseEnrollments.length) * 100)
                      : 0
                    
                    return (
                      <div key={course.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{course.title}</h4>
                          <Badge className={completionRate >= 80 ? 'bg-green-100 text-green-800' : completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                            {completionRate}% completion
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Enrolled:</span>
                            <div className="font-semibold">{courseEnrollments.length}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Completed:</span>
                            <div className="font-semibold">{courseEnrollments.filter(e => e.status === 'completed').length}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Certificates:</span>
                            <div className="font-semibold">{courseEnrollments.filter(e => e.certificate_issued).length}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Revenue:</span>
                            <div className="font-semibold">{formatCurrency(courseEnrollments.filter(e => e.payment_status === 'paid').reduce((sum, e) => sum + (e.course?.fee || 0), 0))}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
                    {gurukuls.map(gurukul => (
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
                  {errors.level && (
                    <p className="text-sm text-red-600">{errors.level.message}</p>
                  )}
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
                  <label className="block text-sm font-medium text-gray-700">Learning Outcomes</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLearningOutcome}
                  >
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
    </div>
  )
}