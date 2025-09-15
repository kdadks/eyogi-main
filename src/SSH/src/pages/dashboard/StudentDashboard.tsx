import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/input'
import { Enrollment, Certificate, Course } from '@/types'
import { getStudentEnrollments } from '@/lib/api/enrollments'
import { getStudentCertificates } from '@/lib/api/certificates'
import { getCourses } from '@/lib/api/courses'
import { formatCurrency, formatDate, getAgeGroupLabel, getLevelColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  UserIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  TrophyIcon,
  FireIcon,
  StarIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  ArrowRightIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  HeartIcon,
  BoltIcon,
  GiftIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import ChatBotTrigger from '@/components/chat/ChatBotTrigger'

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
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'home' | 'courses' | 'certificates' | 'profile'>('home')
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
    completionRate: 0
  })

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [gurukulFilter, setGurukulFilter] = useState<string>('all')

  useEffect(() => {
    if (user?.id) {
      loadStudentData()
    }
  }, [user?.id])

  const loadStudentData = async () => {
    try {
      const [enrollmentsData, certificatesData, coursesData] = await Promise.all([
        getStudentEnrollments(user!.id),
        getStudentCertificates(user!.id),
        getCourses()
      ])

      setEnrollments(enrollmentsData)
      setCertificates(certificatesData)
      setAvailableCourses(coursesData)

      // Calculate stats
      const completedCount = enrollmentsData.filter(e => e.status === 'completed').length
      const activeCount = enrollmentsData.filter(e => e.status === 'approved').length
      const totalSpent = enrollmentsData.reduce((sum, e) => sum + (e.course?.fee || 0), 0)
      const completionRate = enrollmentsData.length > 0 ? (completedCount / enrollmentsData.length) * 100 : 0

      setStats({
        totalEnrollments: enrollmentsData.length,
        completedCourses: completedCount,
        activeCourses: activeCount,
        certificatesEarned: certificatesData.length,
        totalSpent,
        averageGrade: 85,
        learningStreak: 7,
        xpPoints: 1250 + (completedCount * 100),
        level: completedCount < 3 ? 'Beginner' : completedCount < 8 ? 'Intermediate' : 'Advanced',
        completionRate
      })
    } catch (error) {
      console.error('Error loading student data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { 
      id: 'home', 
      name: 'Home', 
      icon: HomeIcon, 
      description: 'Your Learning Hub',
      gradient: 'from-blue-500 to-purple-600'
    },
    { 
      id: 'courses', 
      name: 'My Courses', 
      icon: BookOpenIcon, 
      description: 'Learning Journey',
      gradient: 'from-green-500 to-teal-600',
      badge: stats.activeCourses > 0 ? stats.activeCourses : undefined
    },
    { 
      id: 'certificates', 
      name: 'Achievements', 
      icon: TrophyIcon, 
      description: 'Your Success Story',
      gradient: 'from-yellow-500 to-orange-600',
      badge: stats.certificatesEarned > 0 ? stats.certificatesEarned : undefined
    },
    { 
      id: 'profile', 
      name: 'Profile', 
      icon: UserIcon, 
      description: 'Personal Settings',
      gradient: 'from-pink-500 to-rose-600'
    }
  ]

  const getXPForNextLevel = () => {
    const currentLevel = stats.level
    const xpThresholds = { Beginner: 1000, Intermediate: 2500, Advanced: 5000 }
    
    if (currentLevel === 'Beginner') return xpThresholds.Intermediate
    if (currentLevel === 'Intermediate') return xpThresholds.Advanced
    return xpThresholds.Advanced
  }

  const getProgressToNextLevel = () => {
    const nextLevelXP = getXPForNextLevel()
    return (stats.xpPoints / nextLevelXP) * 100
  }

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = enrollment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enrollment.course?.course_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter
    const matchesGurukul = gurukulFilter === 'all' || enrollment.course?.gurukul_id === gurukulFilter

    return matchesSearch && matchesStatus && matchesGurukul
  })

  const activeCourses = enrollments.filter(e => e.status === 'approved')
  const completedCourses = enrollments.filter(e => e.status === 'completed')
  const recentCertificates = certificates.slice(0, 3)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center page-with-header">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your learning dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex page-with-header">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-20'} bg-white shadow-xl transition-all duration-300 flex flex-col relative z-30`}>
        {/* Student Profile Header */}
        <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="flex items-center justify-between mb-4">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-bold text-lg">
                    {user?.full_name?.charAt(0) || 'S'}
                  </span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">Welcome back!</h2>
                  <p className="text-orange-100 text-sm">{user?.full_name || 'Student'}</p>
                  <p className="text-orange-200 text-xs">ID: {user?.student_id}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {sidebarOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
          </div>

          {sidebarOpen && (
            <div className="space-y-3">
              {/* Level Progress */}
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Level: {stats.level}</span>
                  <span className="text-sm">{stats.xpPoints} XP</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{ width: `${Math.min(getProgressToNextLevel(), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-orange-100 mt-1">
                  {getXPForNextLevel() - stats.xpPoints} XP to next level
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 rounded-lg p-2 text-center backdrop-blur-sm">
                  <FireIcon className="h-5 w-5 mx-auto mb-1 text-orange-200" />
                  <div className="text-lg font-bold">{stats.learningStreak}</div>
                  <div className="text-xs text-orange-100">Day Streak</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center backdrop-blur-sm">
                  <TrophyIcon className="h-5 w-5 mx-auto mb-1 text-orange-200" />
                  <div className="text-lg font-bold">{stats.certificatesEarned}</div>
                  <div className="text-xs text-orange-100">Certificates</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center backdrop-blur-sm">
                  <ChartBarIcon className="h-5 w-5 mx-auto mb-1 text-orange-200" />
                  <div className="text-lg font-bold">{Math.round(stats.completionRate)}%</div>
                  <div className="text-xs text-orange-100">Complete</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 shadow-md transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:transform hover:scale-102'
              }`}
            >
              <div className="relative">
                <div className={`p-2 rounded-lg ${
                  activeTab === tab.id 
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg` 
                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }`}>
                  <tab.icon className="h-5 w-5" />
                </div>
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <div className="font-semibold">{tab.name}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <SparklesIcon className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-900">Learning Tip</span>
              </div>
              <p className="text-sm text-purple-700">
                Complete courses to earn XP and unlock new achievements! 🌟
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Student Dashboard</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Home Tab */}
            {activeTab === 'home' && (
              <div className="space-y-8">
                {/* Welcome Section */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}!
                    </h1>
                    <HeartIcon className="h-8 w-8 text-red-500 animate-pulse" />
                  </div>
                  <p className="text-xl text-gray-600">
                    Ready to continue your amazing learning journey? ✨
                  </p>
                </div>

                {/* Progress Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white card-hover transform hover:scale-105">
                    <CardContent className="p-6 text-center">
                      <BookOpenIcon className="h-12 w-12 mx-auto mb-3 text-blue-100" />
                      <div className="text-3xl font-bold mb-1">{stats.activeCourses}</div>
                      <div className="text-blue-100">Active Courses</div>
                      <div className="text-sm text-blue-200 mt-2">Keep learning! 📚</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white card-hover transform hover:scale-105">
                    <CardContent className="p-6 text-center">
                      <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-green-100" />
                      <div className="text-3xl font-bold mb-1">{stats.completedCourses}</div>
                      <div className="text-green-100">Completed</div>
                      <div className="text-sm text-green-200 mt-2">Amazing progress! 🎉</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white card-hover transform hover:scale-105">
                    <CardContent className="p-6 text-center">
                      <TrophyIcon className="h-12 w-12 mx-auto mb-3 text-purple-100" />
                      <div className="text-3xl font-bold mb-1">{stats.certificatesEarned}</div>
                      <div className="text-purple-100">Certificates</div>
                      <div className="text-sm text-purple-200 mt-2">You're a star! ⭐</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white card-hover transform hover:scale-105">
                    <CardContent className="p-6 text-center">
                      <FireIcon className="h-12 w-12 mx-auto mb-3 text-orange-100" />
                      <div className="text-3xl font-bold mb-1">{stats.learningStreak}</div>
                      <div className="text-orange-100">Day Streak</div>
                      <div className="text-sm text-orange-200 mt-2">You're on fire! 🔥</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Continue Learning Section */}
                {activeCourses.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <BoltIcon className="h-6 w-6 text-orange-500" />
                      <h2 className="text-2xl font-bold text-gray-900">Continue Learning</h2>
                      <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent"></div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeCourses.slice(0, 3).map((enrollment) => (
                        <Card key={enrollment.id} className="card-hover overflow-hidden border-2 border-transparent hover:border-orange-200">
                          <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500"></div>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <Badge className={getLevelColor(enrollment.course?.level || 'basic')}>
                                {enrollment.course?.level}
                              </Badge>
                              <span className="text-sm text-gray-500">{enrollment.course?.course_number}</span>
                            </div>
                            
                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                              {enrollment.course?.title}
                            </h3>
                            
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {enrollment.course?.description}
                            </p>

                            {/* Progress Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium text-orange-600">65%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <Button size="sm" className="flex-1">
                                <PlayIcon className="h-4 w-4 mr-2" />
                                Continue
                              </Button>
                              <Button size="sm" variant="outline">
                                <CalendarIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Achievements */}
                {recentCertificates.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <GiftIcon className="h-6 w-6 text-purple-500" />
                      <h2 className="text-2xl font-bold text-gray-900">Recent Achievements</h2>
                      <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      {recentCertificates.map((certificate) => (
                        <Card key={certificate.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 card-hover">
                          <CardContent className="p-6 text-center">
                            <TrophyIcon className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                            <h3 className="font-bold text-gray-900 mb-2">
                              {certificate.course?.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              Completed {formatDate(certificate.issued_at)}
                            </p>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="flex-1">
                                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button size="sm" variant="outline">
                                <ShareIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Path */}
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <StarIcon className="h-6 w-6 text-blue-500" />
                    <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableCourses.slice(0, 3).map((course) => (
                      <Card key={course.id} className="card-hover border-2 border-transparent hover:border-blue-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <Badge className={getLevelColor(course.level)}>
                              {course.level}
                            </Badge>
                            <span className="text-sm text-gray-500">{course.course_number}</span>
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                            {course.title}
                          </h3>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {course.description}
                          </p>

                          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                            <span>{course.duration_weeks} weeks</span>
                            <span>{formatCurrency(course.fee)}</span>
                          </div>

                          <Link to={`/courses/${course.id}`}>
                            <Button size="sm" className="w-full">
                              Learn More
                              <ArrowRightIcon className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* My Courses Tab */}
            {activeTab === 'courses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-gray-900">My Learning Journey</h1>
                  <Link to="/courses">
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Explore More Courses
                    </Button>
                  </Link>
                </div>

                {/* Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search courses..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Active</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      <select
                        value={gurukulFilter}
                        onChange={(e) => setGurukulFilter(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                      >
                        <option value="all">All Gurukuls</option>
                        <option value="gurukul-1">Hinduism Gurukul</option>
                        <option value="gurukul-2">Mantra Gurukul</option>
                        <option value="gurukul-3">Philosophy Gurukul</option>
                        <option value="gurukul-4">Sanskrit Gurukul</option>
                        <option value="gurukul-5">Yoga & Wellness</option>
                      </select>

                      <Button variant="outline" onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('all')
                        setGurukulFilter('all')
                      }}>
                        Clear Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Courses Grid */}
                {filteredEnrollments.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
                      <p className="text-gray-600 mb-6">
                        {enrollments.length === 0 
                          ? "You haven't enrolled in any courses yet. Start your learning journey today!"
                          : "No courses match your current filters."
                        }
                      </p>
                      <Link to="/courses">
                        <Button>
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          Discover Courses
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEnrollments.map((enrollment) => (
                      <Card key={enrollment.id} className="card-hover overflow-hidden">
                        <div className={`h-2 ${
                          enrollment.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          enrollment.status === 'approved' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                          enrollment.status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}></div>
                        
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <Badge className={getLevelColor(enrollment.course?.level || 'basic')}>
                              {enrollment.course?.level}
                            </Badge>
                            <Badge className={
                              enrollment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              enrollment.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {enrollment.status}
                            </Badge>
                          </div>

                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                            {enrollment.course?.title}
                          </h3>

                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {enrollment.course?.description}
                          </p>

                          <div className="space-y-2 mb-4 text-sm text-gray-500">
                            <div className="flex items-center justify-between">
                              <span>Gurukul:</span>
                              <span className="font-medium">{enrollment.course?.gurukul?.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Duration:</span>
                              <span className="font-medium">{enrollment.course?.duration_weeks} weeks</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Enrolled:</span>
                              <span className="font-medium">{formatDate(enrollment.enrolled_at)}</span>
                            </div>
                          </div>

                          {enrollment.status === 'approved' && (
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium text-orange-600">65%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                              </div>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            {enrollment.status === 'approved' && (
                              <Button size="sm" className="flex-1">
                                <PlayIcon className="h-4 w-4 mr-1" />
                                Continue
                              </Button>
                            )}
                            <Link to={`/courses/${enrollment.course?.id}`} className="flex-1">
                              <Button size="sm" variant="outline" className="w-full">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Certificates Tab */}
            {activeTab === 'certificates' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Achievements 🏆</h1>
                  <p className="text-xl text-gray-600">
                    Celebrate your learning milestones and share your success!
                  </p>
                </div>

                {certificates.length === 0 ? (
                  <Card className="text-center py-16">
                    <CardContent>
                      <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
                        <TrophyIcon className="h-12 w-12 text-orange-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Your First Certificate Awaits! ✨</h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Complete your first course to earn your certificate and join our community of achievers!
                      </p>
                      <Link to="/courses">
                        <Button size="lg">
                          <SparklesIcon className="h-5 w-5 mr-2" />
                          Start Learning Today
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((certificate) => (
                      <Card key={certificate.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 card-hover overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
                        <CardContent className="p-6 text-center">
                          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                            <TrophyIcon className="h-8 w-8 text-white" />
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {certificate.course?.title}
                          </h3>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            Certificate #{certificate.certificate_number}
                          </p>
                          
                          <p className="text-sm text-gray-500 mb-4">
                            Issued on {formatDate(certificate.issued_at)}
                          </p>

                          <div className="bg-white rounded-lg p-3 mb-4">
                            <p className="text-xs text-gray-500 mb-1">Verification Code</p>
                            <p className="font-mono text-sm font-bold text-gray-900">
                              {certificate.verification_code}
                            </p>
                          </div>

                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button size="sm" variant="outline">
                              <ShareIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Profile Information */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <h2 className="text-xl font-bold">Personal Information</h2>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <Input
                            label="Full Name"
                            value={user?.full_name || ''}
                            readOnly
                          />
                          <Input
                            label="Email Address"
                            value={user?.email || ''}
                            readOnly
                          />
                          <Input
                            label="Student ID"
                            value={user?.student_id || ''}
                            readOnly
                          />
                          <Input
                            label="Age"
                            value={user?.age?.toString() || ''}
                            readOnly
                          />
                          <Input
                            label="Phone"
                            value={user?.phone || ''}
                            readOnly
                          />
                          <Input
                            label="Role"
                            value={user?.role || ''}
                            readOnly
                          />
                        </div>
                        
                        <Button>
                          <Cog6ToothIcon className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Learning Stats */}
                  <div>
                    <Card>
                      <CardHeader>
                        <h2 className="text-xl font-bold">Learning Statistics</h2>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                            <span className="text-white text-2xl font-bold">
                              {stats.level.charAt(0)}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">{stats.level} Learner</h3>
                          <p className="text-sm text-gray-600">{stats.xpPoints} XP Points</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Courses Completed:</span>
                            <span className="font-bold text-green-600">{stats.completedCourses}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Active Courses:</span>
                            <span className="font-bold text-blue-600">{stats.activeCourses}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Certificates:</span>
                            <span className="font-bold text-purple-600">{stats.certificatesEarned}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Learning Streak:</span>
                            <span className="font-bold text-orange-600">{stats.learningStreak} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completion Rate:</span>
                            <span className="font-bold text-green-600">{Math.round(stats.completionRate)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* AI Chat Assistant */}
      <ChatBotTrigger />
    </div>
  )
}