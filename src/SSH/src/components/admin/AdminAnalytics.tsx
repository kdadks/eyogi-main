import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import ConsentReport from './ConsentReport'
import CacheManagement from './CacheManagement'
import { supabaseAdmin } from '@/lib/supabase'
import {
  ChartBarIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ClockIcon,
  MapPinIcon,
  LinkIcon,
  CalendarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  AcademicCapIcon,
  QueueListIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrophyIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  getStudentAnalytics,
  getEnrollmentAnalytics,
  getCourseAnalytics,
  getTeacherAnalytics,
  getBatchAnalytics,
  getAttendanceAnalytics,
  getCertificateAnalytics,
  getGurukulAnalytics,
  getSiteAnalytics,
  getDateRange,
  type StudentAnalytics,
  type EnrollmentAnalytics,
  type CourseAnalytics,
  type TeacherAnalytics,
  type BatchAnalytics,
  type AttendanceAnalytics,
  type CertificateAnalytics,
  type GurukulAnalytics,
  type SiteAnalytics,
} from '@/lib/api/analytics'
import toast from 'react-hot-toast'

type TabType =
  | 'overview'
  | 'students'
  | 'courses'
  | 'teachers'
  | 'batches'
  | 'attendance'
  | 'certificates'
  | 'gurukuls'
  | 'site'
  | 'consent'
  | 'system'

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [dateRange, setDateRange] = useState('30d')
  const [loading, setLoading] = useState(false)

  // Analytics data states
  const [studentData, setStudentData] = useState<StudentAnalytics | null>(null)
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentAnalytics | null>(null)
  const [courseData, setCourseData] = useState<CourseAnalytics | null>(null)
  const [teacherData, setTeacherData] = useState<TeacherAnalytics | null>(null)
  const [batchData, setBatchData] = useState<BatchAnalytics | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceAnalytics | null>(null)
  const [certificateData, setCertificateData] = useState<CertificateAnalytics | null>(null)
  const [gurukulData, setGurukulData] = useState<GurukulAnalytics | null>(null)
  const [siteData, setSiteData] = useState<SiteAnalytics | null>(null)

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const range = getDateRange(dateRange)

      const [
        students,
        enrollments,
        courses,
        teachers,
        batches,
        attendance,
        certificates,
        gurukuls,
        site,
      ] = await Promise.all([
        getStudentAnalytics(range),
        getEnrollmentAnalytics(range),
        getCourseAnalytics(range),
        getTeacherAnalytics(range),
        getBatchAnalytics(range),
        getAttendanceAnalytics(range),
        getCertificateAnalytics(range),
        getGurukulAnalytics(range),
        getSiteAnalytics(range),
      ])

      setStudentData(students)
      setEnrollmentData(enrollments)
      setCourseData(courses)
      setTeacherData(teachers)
      setBatchData(batches)
      setAttendanceData(attendance)
      setCertificateData(certificates)
      setGurukulData(gurukuls)
      setSiteData(site)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  // Set up real-time subscription for attendance records and page analytics
  useEffect(() => {
    let attendanceSubscription: any = null
    let pageAnalyticsSubscription: any = null

    const setupSubscription = async () => {
      try {
        // Subscribe to attendance_records changes
        attendanceSubscription = supabaseAdmin
          .channel('attendance_analytics')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'attendance_records',
            },
            () => {
              // Reload analytics when attendance records change
              setLoading(true)
              setTimeout(() => {
                loadAnalytics()
              }, 100)
            },
          )
          .subscribe()

        // Subscribe to page_analytics changes for Site Analytics real-time updates
        pageAnalyticsSubscription = supabaseAdmin
          .channel('page_analytics_updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'page_analytics',
            },
            () => {
              // Reload analytics when page analytics change
              setLoading(true)
              setTimeout(() => {
                loadAnalytics()
              }, 100)
            },
          )
          .subscribe()
      } catch (error) {
        console.error('Error setting up subscription:', error)
      }
    }

    setupSubscription()

    return () => {
      if (attendanceSubscription) {
        supabaseAdmin.removeChannel(attendanceSubscription)
      }
      if (pageAnalyticsSubscription) {
        supabaseAdmin.removeChannel(pageAnalyticsSubscription)
      }
    }
  }, [loadAnalytics])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getDateRangeLabel = (range: string): string => {
    switch (range) {
      case '7d':
        return 'Last 7 Days'
      case '30d':
        return 'Last 30 Days'
      case '90d':
        return 'Last 90 Days'
      case '1y':
        return 'Last Year'
      default:
        return 'Last 30 Days'
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'students', name: 'Students', icon: UserGroupIcon },
    { id: 'courses', name: 'Courses', icon: BookOpenIcon },
    { id: 'teachers', name: 'Teachers', icon: UsersIcon },
    { id: 'batches', name: 'Batches', icon: QueueListIcon },
    { id: 'attendance', name: 'Attendance', icon: ClipboardDocumentListIcon },
    { id: 'certificates', name: 'Certificates', icon: AcademicCapIcon },
    { id: 'gurukuls', name: 'Gurukuls', icon: BookOpenIcon },
    { id: 'site', name: 'Site Analytics', icon: EyeIcon },
    { id: 'consent', name: 'Consent', icon: DocumentTextIcon },
    { id: 'system', name: 'System', icon: Cog6ToothIcon },
  ]

  if (loading && !studentData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <ArrowPathIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          data={{
            studentData,
            enrollmentData,
            courseData,
            teacherData,
            batchData,
            certificateData,
            attendanceData,
          }}
          formatNumber={formatNumber}
          dateRange={dateRange}
          getDateRangeLabel={getDateRangeLabel}
        />
      )}
      {activeTab === 'students' && (
        <StudentsTab
          data={studentData}
          enrollmentData={enrollmentData}
          formatNumber={formatNumber}
        />
      )}
      {activeTab === 'courses' && <CoursesTab data={courseData} formatNumber={formatNumber} />}
      {activeTab === 'teachers' && <TeachersTab data={teacherData} formatNumber={formatNumber} />}
      {activeTab === 'batches' && <BatchesTab data={batchData} formatNumber={formatNumber} />}
      {activeTab === 'attendance' && (
        <AttendanceTab
          data={attendanceData}
          formatNumber={formatNumber}
          dateRange={dateRange}
          getDateRangeLabel={getDateRangeLabel}
        />
      )}
      {activeTab === 'certificates' && (
        <CertificatesTab
          data={certificateData}
          formatNumber={formatNumber}
          dateRange={dateRange}
          getDateRangeLabel={getDateRangeLabel}
        />
      )}
      {activeTab === 'gurukuls' && <GurukulsTab data={gurukulData} formatNumber={formatNumber} />}
      {activeTab === 'site' && <SiteTab data={siteData} formatNumber={formatNumber} />}
      {activeTab === 'consent' && <ConsentReport />}
      {activeTab === 'system' && <CacheManagement />}
    </div>
  )
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({ data, formatNumber, dateRange, getDateRangeLabel }: any) {
  const {
    studentData,
    enrollmentData,
    courseData,
    teacherData,
    batchData,
    certificateData,
    attendanceData,
  } = data

  const stats = [
    {
      title: 'Total Students',
      value: studentData?.totalStudents || 0,
      change: `${studentData?.newStudents || 0} new`,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      changeColor: 'text-green-600',
    },
    {
      title: 'Active Courses',
      value: courseData?.activeCourses || 0,
      change: `${courseData?.totalCourses || 0} total`,
      icon: BookOpenIcon,
      color: 'bg-green-500',
      changeColor: 'text-gray-600',
    },
    {
      title: 'Total Enrollments',
      value: enrollmentData?.totalEnrollments || 0,
      change: `${enrollmentData?.completionRate || 0}% completion`,
      icon: ClipboardDocumentListIcon,
      color: 'bg-yellow-500',
      changeColor: 'text-orange-600',
    },
    {
      title: 'Certificates Issued',
      value: certificateData?.totalCertificates || 0,
      change: `${certificateData?.certificatesThisMonth || 0} this month`,
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      changeColor: 'text-purple-600',
    },
    {
      title: 'Total Teachers',
      value: teacherData?.totalTeachers || 0,
      change: `${teacherData?.activeTeachers || 0} active`,
      icon: UsersIcon,
      color: 'bg-indigo-500',
      changeColor: 'text-indigo-600',
    },
    {
      title: 'Active Batches',
      value: batchData?.totalBatches || 0,
      change: `${batchData?.averageBatchSize || 0} avg size`,
      icon: QueueListIcon,
      color: 'bg-pink-500',
      changeColor: 'text-pink-600',
    },
    {
      title: 'Attendance Rate',
      value: `${attendanceData?.overallAttendanceRate || 0}%`,
      change: 'Overall average',
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
      changeColor: 'text-emerald-600',
    },
    {
      title: 'Completion Rate',
      value: `${enrollmentData?.completionRate || 0}%`,
      change: 'Course completion',
      icon: TrophyIcon,
      color: 'bg-orange-500',
      changeColor: 'text-orange-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
                  </p>
                  <p className={`text-sm mt-2 ${stat.changeColor}`}>{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enrollment Trends */}
      {enrollmentData && enrollmentData.enrollmentTrends.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Enrollment Trends ({getDateRangeLabel(dateRange)})
            </h3>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-1">
              {enrollmentData.enrollmentTrends.slice(-30).map((day: any, index: number) => {
                const maxCount = Math.max(
                  ...enrollmentData.enrollmentTrends.map((d: any) => d.count),
                )
                const height = maxCount > 0 ? (day.count / maxCount) * 240 : 0
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    <div
                      className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-md transition-all duration-300 hover:from-orange-600 hover:to-orange-400 relative"
                      style={{ height: `${height}px`, minHeight: day.count > 0 ? '4px' : '0' }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.count} enrollments
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {enrollmentData?.averageTimeToComplete || 0}
              </div>
              <div className="text-sm text-gray-600">Days to Complete</div>
              <div className="text-xs text-gray-500 mt-1">Average course duration</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {studentData?.activeStudents || 0}
              </div>
              <div className="text-sm text-gray-600">Active Students</div>
              <div className="text-xs text-gray-500 mt-1">Currently enrolled</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {batchData?.averageBatchSize || 0}
              </div>
              <div className="text-sm text-gray-600">Avg Batch Size</div>
              <div className="text-xs text-gray-500 mt-1">Students per batch</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {certificateData?.certificatesThisWeek || 0}
              </div>
              <div className="text-sm text-gray-600">This Week</div>
              <div className="text-xs text-gray-500 mt-1">Certificates issued</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================
// STUDENTS TAB
// ============================================

function StudentsTab({ data, enrollmentData, formatNumber }: any) {
  if (!data) return <div className="text-center py-12 text-gray-500">No data available</div>

  return (
    <div className="space-y-6">
      {/* Student Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatNumber(data.totalStudents)}
            </div>
            <div className="text-sm text-gray-600 mt-2">Total Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatNumber(data.activeStudents)}
            </div>
            <div className="text-sm text-gray-600 mt-2">Active Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {formatNumber(data.newStudents)}
            </div>
            <div className="text-sm text-gray-600 mt-2">New Students</div>
          </CardContent>
        </Card>
      </div>

      {/* Students by Age Group */}
      {data.studentsByAgeGroup && data.studentsByAgeGroup.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Students by Age Group</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.studentsByAgeGroup.map((group: any, index: number) => {
                const percentage = (group.count / data.totalStudents) * 100
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-sm font-medium text-gray-900 w-16">
                        {group.ageGroup}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 ml-4">{group.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Students */}
      {data.topStudents && data.topStudents.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Top Performing Students</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Courses Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Certificates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topStudents.map((student: any, index: number) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index < 3 ? (
                            <TrophyIcon
                              className={`h-5 w-5 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-600'}`}
                            />
                          ) : (
                            <span className="text-sm text-gray-500">#{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.coursesCompleted}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.certificatesEarned}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={
                            student.attendanceRate >= 90
                              ? 'bg-green-100 text-green-800'
                              : student.attendanceRate >= 75
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }
                        >
                          {student.attendanceRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Locations */}
      {data.studentsByLocation && data.studentsByLocation.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Student Locations
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.studentsByLocation.slice(0, 10).map((location: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <MapPinIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{location.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{location.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enrollment Status */}
      {enrollmentData && enrollmentData.enrollmentsByStatus && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Enrollment Status Distribution</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {enrollmentData.enrollmentsByStatus.map((status: any, index: number) => {
                const colors = {
                  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  approved: 'bg-blue-100 text-blue-800 border-blue-200',
                  completed: 'bg-green-100 text-green-800 border-green-200',
                  cancelled: 'bg-red-100 text-red-800 border-red-200',
                  rejected: 'bg-gray-100 text-gray-800 border-gray-200',
                }
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${colors[status.status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                  >
                    <div className="text-2xl font-bold">{status.count}</div>
                    <div className="text-sm">
                      {status.status
                        .split(' ')
                        .map(
                          (word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                        )
                        .join(' ')}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================
// COURSES TAB
// ============================================

function CoursesTab({ data, formatNumber }: any) {
  if (!data) return <div className="text-center py-12 text-gray-500">No data available</div>

  return (
    <div className="space-y-6">
      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatNumber(data.totalCourses)}
            </div>
            <div className="text-sm text-gray-600 mt-2">Total Courses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatNumber(data.activeCourses)}
            </div>
            <div className="text-sm text-gray-600 mt-2">Active Courses</div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Courses */}
      {data.popularCourses && data.popularCourses.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Most Popular Courses</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Enrollments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Completions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Completion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.popularCourses.map((course: any, index: number) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">#{index + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.enrollments}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.completions}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={
                            course.completionRate >= 70
                              ? 'bg-green-100 text-green-800'
                              : course.completionRate >= 40
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }
                        >
                          {course.completionRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courses by Level */}
      {data.coursesByLevel && data.coursesByLevel.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Courses by Level</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.coursesByLevel.map((level: any, index: number) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500']
                return (
                  <div key={index} className="text-center p-4 bg-white border rounded-lg">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 ${colors[index % colors.length]} rounded-full text-white text-2xl font-bold mb-2`}
                    >
                      {level.count}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {level.level
                        .split(' ')
                        .map(
                          (word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                        )
                        .join(' ')}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capacity Utilization */}
      {data.capacityUtilization && data.capacityUtilization.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Course Capacity Utilization</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.capacityUtilization.map((course: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{course.courseName}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            course.utilizationRate >= 90
                              ? 'bg-red-500'
                              : course.utilizationRate >= 70
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(course.utilizationRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 min-w-[60px]">
                        {course.enrolled}/{course.maxStudents}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={`ml-4 ${
                      course.utilizationRate >= 90
                        ? 'bg-red-100 text-red-800'
                        : course.utilizationRate >= 70
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {course.utilizationRate}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Methods */}
      {data.coursesByDeliveryMethod && data.coursesByDeliveryMethod.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Courses by Delivery Method</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {data.coursesByDeliveryMethod.map((method: any, index: number) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{method.count}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {method.method
                      .split(' ')
                      .map(
                        (word: string) =>
                          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                      )
                      .join(' ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================
// TEACHERS TAB
// ============================================

function TeachersTab({ data, formatNumber }: any) {
  if (!data) return <div className="text-center py-12 text-gray-500">No data available</div>

  return (
    <div className="space-y-6">
      {/* Teacher Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatNumber(data.totalTeachers)}
            </div>
            <div className="text-sm text-gray-600 mt-2">Total Teachers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatNumber(data.activeTeachers)}
            </div>
            <div className="text-sm text-gray-600 mt-2">Active Teachers</div>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Workload */}
      {data.teacherWorkload && data.teacherWorkload.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Teacher Workload Distribution</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Batches
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Certificates
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.teacherWorkload.map((teacher: any) => (
                    <tr key={teacher.teacherId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.teacherName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{teacher.studentCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{teacher.courseCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{teacher.batchCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{teacher.certificatesIssued}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================
// BATCHES TAB
// ============================================

function BatchesTab({ data, formatNumber }: any) {
  if (!data) return <div className="text-center py-12 text-gray-500">No data available</div>

  return (
    <div className="space-y-6">
      {/* Batch Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatNumber(data.totalBatches)}
            </div>
            <div className="text-sm text-gray-600 mt-2">Total Batches</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatNumber(data.averageBatchSize)}
            </div>
            <div className="text-sm text-gray-600 mt-2">Average Batch Size</div>
          </CardContent>
        </Card>
      </div>

      {/* Batches by Status */}
      {data.batchesByStatus && data.batchesByStatus.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Batches by Status</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.batchesByStatus.map((status: any, index: number) => {
                const colors = {
                  not_started: 'bg-gray-100 text-gray-800 border-gray-200',
                  active: 'bg-green-100 text-green-800 border-green-200',
                  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
                  completed: 'bg-purple-100 text-purple-800 border-purple-200',
                  archived: 'bg-orange-100 text-orange-800 border-orange-200',
                }
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${colors[status.status as keyof typeof colors] || 'bg-gray-100'}`}
                  >
                    <div className="text-2xl font-bold">{status.count}</div>
                    <div className="text-sm">
                      {status.status
                        .replace('_', ' ')
                        .split(' ')
                        .map(
                          (word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                        )
                        .join(' ')}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Progress */}
      {data.batchProgress && data.batchProgress.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Batch Progress Tracking</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.batchProgress.map((batch: any, index: number) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{batch.batchName}</span>
                    <Badge
                      className={
                        batch.progressPercentage >= 80
                          ? 'bg-green-100 text-green-800'
                          : batch.progressPercentage >= 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {batch.progressPercentage}%
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${batch.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 min-w-[80px]">
                      {batch.completedWeeks}/{batch.totalWeeks} weeks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batches by Gurukul */}
      {data.batchesByGurukul && data.batchesByGurukul.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Batches by Gurukul</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.batchesByGurukul.map((gurukul: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium text-gray-900">{gurukul.gurukulName}</span>
                  <Badge>{gurukul.count} batches</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================
// ATTENDANCE TAB
// ============================================

function AttendanceTab({ data, formatNumber, dateRange, getDateRangeLabel }: any) {
  if (!data) return <div className="text-center py-12 text-gray-500">No data available</div>

  return (
    <div className="space-y-6">
      {/* Overall Attendance */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-green-600">{data.overallAttendanceRate}%</div>
            <div className="text-sm text-gray-600 mt-2">Overall Attendance Rate</div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance by Status */}
      {data.attendanceByStatus && data.attendanceByStatus.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Attendance Distribution</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.attendanceByStatus.map((status: any, index: number) => {
                const colors = {
                  present: 'bg-green-100 text-green-800 border-green-200',
                  absent: 'bg-red-100 text-red-800 border-red-200',
                  late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  excused: 'bg-blue-100 text-blue-800 border-blue-200',
                }
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${colors[status.status as keyof typeof colors]}`}
                  >
                    <div className="text-2xl font-bold">{status.count}</div>
                    <div className="text-sm">
                      {status.status
                        .split(' ')
                        .map(
                          (word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                        )
                        .join(' ')}
                    </div>
                    <div className="text-xs mt-1">{status.percentage}%</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Trends */}
      {data.attendanceTrends && data.attendanceTrends.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Attendance Trends ({getDateRangeLabel(dateRange)})
            </h3>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-1">
              {data.attendanceTrends.slice(-30).map((day: any, index: number) => {
                const total = day.presentCount + day.absentCount + day.lateCount + day.excusedCount
                const maxTotal = Math.max(
                  ...data.attendanceTrends.map(
                    (d: any) => d.presentCount + d.absentCount + d.lateCount + d.excusedCount,
                  ),
                )
                const height = maxTotal > 0 ? (total / maxTotal) * 240 : 0
                const presentPercentage = total > 0 ? (day.presentCount / total) * 100 : 0

                return (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    <div
                      className="w-full rounded-t-md transition-all duration-300 relative"
                      style={{
                        height: `${height}px`,
                        minHeight: total > 0 ? '4px' : '0',
                        background: `linear-gradient(to top,
                          rgb(34, 197, 94) 0%,
                          rgb(34, 197, 94) ${presentPercentage}%,
                          rgb(239, 68, 68) ${presentPercentage}%,
                          rgb(239, 68, 68) 100%)`,
                      }}
                    >
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        <div>Present: {day.presentCount}</div>
                        <div>Absent: {day.absentCount}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Attendance Students */}
      {data.lowAttendanceStudents && data.lowAttendanceStudents.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <XCircleIcon className="h-5 w-5 mr-2 text-red-500" />
              Students with Low Attendance (&lt;75%)
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.lowAttendanceStudents.map((student: any) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{student.studentName}</p>
                    <p className="text-xs text-gray-600">
                      {student.presentCount}/{student.totalClasses} classes
                    </p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">{student.attendanceRate}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Perfect Attendance */}
      {data.perfectAttendanceStudents && data.perfectAttendanceStudents.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
              Perfect Attendance Students
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.perfectAttendanceStudents.map((student: any) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{student.studentName}</p>
                    <p className="text-xs text-gray-600">{student.totalClasses} classes</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">100%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================
// CERTIFICATES TAB
// ============================================

function CertificatesTab({ data, formatNumber, dateRange, getDateRangeLabel }: any) {
  if (!data) return <div className="text-center py-12 text-gray-500">No data available</div>

  return (
    <div className="space-y-6">
      {/* Certificate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {formatNumber(data.totalCertificates)}
            </div>
            <div className="text-sm text-gray-600 mt-2">Total Certificates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatNumber(data.certificatesThisMonth)}
            </div>
            <div className="text-sm text-gray-600 mt-2">This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatNumber(data.certificatesThisWeek)}
            </div>
            <div className="text-sm text-gray-600 mt-2">This Week</div>
          </CardContent>
        </Card>
      </div>

      {/* Certificate Trends */}
      {data.certificateTrends && data.certificateTrends.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Certificate Issuance Trends ({getDateRangeLabel(dateRange)})
            </h3>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-1">
              {data.certificateTrends.slice(-30).map((day: any, index: number) => {
                const maxCount = Math.max(...data.certificateTrends.map((d: any) => d.count))
                const height = maxCount > 0 ? (day.count / maxCount) * 240 : 0
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    <div
                      className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-md transition-all duration-300 hover:from-purple-600 hover:to-purple-400 relative"
                      style={{ height: `${height}px`, minHeight: day.count > 0 ? '4px' : '0' }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.count} certificates
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificates by Course */}
      {data.certificatesByCourse && data.certificatesByCourse.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Certificates by Course</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.certificatesByCourse.map((course: any, index: number) => {
                const percentage = (course.count / data.totalCertificates) * 100
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-sm font-medium text-gray-900">{course.courseName}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 ml-4">{course.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificates by Teacher */}
      {data.certificatesByTeacher && data.certificatesByTeacher.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Certificates Issued by Teacher</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.certificatesByTeacher.map((teacher: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-gray-900">{teacher.teacherName}</p>
                    <p className="text-xs text-gray-600">Teacher</p>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{teacher.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Average Time to Complete */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{data.averageTimeToComplete}</div>
            <div className="text-sm text-gray-600 mt-2">Average Days to Complete Course</div>
            <div className="text-xs text-gray-500 mt-1">From enrollment to certificate</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// GURUKULS TAB
// ============================================

function GurukulsTab({ data, formatNumber }: any) {
  if (!data || !data.gurukulPerformance)
    return <div className="text-center py-12 text-gray-500">No data available</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Gurukul Performance Comparison</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gurukul
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Enrollments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Certificates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Completion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.gurukulPerformance.map((gurukul: any) => (
                  <tr key={gurukul.gurukulId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{gurukul.gurukulName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{gurukul.courseCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{gurukul.studentCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{gurukul.enrollmentCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{gurukul.certificateCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={
                          gurukul.completionRate >= 70
                            ? 'bg-green-100 text-green-800'
                            : gurukul.completionRate >= 40
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }
                      >
                        {gurukul.completionRate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Gurukul Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.gurukulPerformance.map((gurukul: any) => (
          <Card key={gurukul.gurukulId} className="card-hover">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">{gurukul.gurukulName}</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{gurukul.courseCount}</div>
                  <div className="text-xs text-gray-600">Courses</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{gurukul.studentCount}</div>
                  <div className="text-xs text-gray-600">Students</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {gurukul.enrollmentCount}
                  </div>
                  <div className="text-xs text-gray-600">Enrollments</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {gurukul.certificateCount}
                  </div>
                  <div className="text-xs text-gray-600">Certificates</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-600">Completion Rate</div>
                <div className="text-3xl font-bold text-orange-600 mt-1">
                  {gurukul.completionRate}%
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ============================================
// SITE ANALYTICS TAB
// ============================================

function SiteTab({ data, formatNumber }: any) {
  if (!data)
    return <div className="text-center py-12 text-gray-500">No site analytics data available</div>

  const hasData =
    data.pageViews?.length > 0 || data.userActivity?.length > 0 || data.deviceTypes?.length > 0

  if (!hasData) {
    return (
      <div className="text-center py-12">
        <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No site analytics data available</h3>
        <p className="text-gray-600">
          Site analytics data will appear here once page tracking is enabled and users accept cookie
          consent.
        </p>
      </div>
    )
  }

  // Chart colors
  const CHART_COLORS = [
    '#f97316',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f43f5e',
  ]

  return (
    <div className="space-y-6">
      {/* Traffic Sources with Pie Chart */}
      {data.trafficSources && data.trafficSources.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <LinkIcon className="h-5 w-5 mr-2" />
              Traffic Sources
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.trafficSources}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.source}: ${entry.percentage}%`}
                    >
                      {data.trafficSources.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Source List */}
              <div className="space-y-3">
                {data.trafficSources.map((source: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="font-medium text-gray-900">{source.source}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">{source.percentage}%</span>
                      <Badge>{source.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Activity Timeline */}
      {data.userActivity && data.userActivity.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" />
              User Activity Over Time
            </h3>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#f97316"
                    name="Active Users"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#3b82f6"
                    name="Sessions"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Data with Bar Chart */}
      {data.locationData && data.locationData.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Visitors by Country
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.locationData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Country List */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.locationData.map((location: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-900">{location.country}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">{location.percentage}%</span>
                      <Badge>{location.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device & Browser Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Types with Pie Chart */}
        {data.deviceTypes && data.deviceTypes.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
                Device Distribution
              </h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.deviceTypes}
                      dataKey="count"
                      nameKey="deviceType"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.deviceType}: ${entry.percentage}%`}
                    >
                      {data.deviceTypes.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {data.deviceTypes.map((device: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-900">
                      {device.deviceType.charAt(0).toUpperCase() +
                        device.deviceType.slice(1).toLowerCase()}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{device.percentage}%</span>
                      <Badge variant="outline">{device.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Browser Stats with Bar Chart */}
        {data.browserStats && data.browserStats.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <ComputerDesktopIcon className="h-5 w-5 mr-2" />
                Browser Statistics
              </h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.browserStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="browser" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {data.browserStats.map((browser: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-900">{browser.browser}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{browser.percentage}%</span>
                      <Badge variant="outline">{browser.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Page Views Table */}
      {data.pageViews && data.pageViews.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <EyeIcon className="h-5 w-5 mr-2" />
              Top Pages
            </h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Page
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Unique Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Avg Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.pageViews.slice(0, 10).map((page: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {page.pagePath === '/' ? 'Home' : page.pagePath}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatNumber(page.views)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatNumber(page.uniqueUsers)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{page.averageDuration}s</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Referrers Details */}
      {data.topReferrers && data.topReferrers.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <LinkIcon className="h-5 w-5 mr-2" />
              Top Referrers (Detailed)
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topReferrers.map((referrer: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm text-gray-900 truncate flex-1 font-mono">
                    {referrer.referrer}
                  </span>
                  <Badge>{referrer.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
