import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { User, Course, Enrollment, Gurukul, Certificate, StudentAttendanceSummary } from '@/types'
import { getAllUsers } from '@/lib/api/users'
import { getCourses } from '@/lib/api/courses'
import { getAllEnrollments, getStudentCourseProgress } from '@/lib/api/enrollments'
import { getGurukuls } from '@/lib/api/gurukuls'
import { getCertificatesFromTable } from '@/lib/api/certificates'
import { formatDate, toSentenceCase } from '@/lib/utils'
import { getRoleColor } from '@/lib/auth/authUtils'
import toast from 'react-hot-toast'
import ConsentStatusBadge from '../consent/ConsentStatusBadge'
import ConsentAuditModal from '../consent/ConsentAuditModal'
import { getStudentsConsent, getStudentConsent, StudentConsent } from '@/lib/api/consent'
import { getStudentAttendanceSummary } from '@/lib/api/attendance'
import { sendBulkEmail, sendBulkSMS } from '@/lib/api/communication'
import { getCountryName, getStateName } from '@/lib/address-utils'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import StudentBatchAssignmentModal from './StudentBatchAssignmentModal'
import BulkBatchAssignmentModal from './BulkBatchAssignmentModal'
import {
  UserIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BookOpenIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  QueueListIcon,
  ShieldCheckIcon,
  ClockIcon,
  MapPinIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
interface StudentWithEnrollments extends User {
  enrollments: Array<Enrollment & { course?: Course & { gurukul?: Gurukul } }>
  total_enrollments: number
  completed_courses: number
  pending_enrollments: number
  total_spent: number
  age?: number
  attendance_summaries?: StudentAttendanceSummary[]
  overall_attendance_percentage?: number
  course_progress?: { [courseId: string]: number }
  average_course_progress?: number
}
export default function StudentManagement() {
  const [students, setStudents] = useState<StudentWithEnrollments[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentWithEnrollments[]>([])
  const [studentConsents, setStudentConsents] = useState<Map<string, StudentConsent>>(new Map())
  const [showConsentAudit, setShowConsentAudit] = useState(false)
  const [selectedConsentForAudit, setSelectedConsentForAudit] = useState<StudentConsent | null>(
    null,
  )
  const [selectedStudentNameForAudit, setSelectedStudentNameForAudit] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Helper function to check if student has certificate for course
  const hasCertificate = (studentId: string, courseId: string): boolean => {
    return certificates.some((cert) => cert.student_id === studentId && cert.course_id === courseId)
  }
  const [activeTab, setActiveTab] = useState<'overview' | 'by-course' | 'communication'>('overview')
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all')
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('all')
  const [gurukulFilter, setGurukulFilter] = useState<string>('all')
  const [consentFilter, setConsentFilter] = useState<string>('all')
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)
  // Student Details
  const [viewingStudent, setViewingStudent] = useState<StudentWithEnrollments | null>(null)
  const [parentData, setParentData] = useState<User | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [selectedStudentForBatch, setSelectedStudentForBatch] =
    useState<StudentWithEnrollments | null>(null)
  const [showBulkBatchModal, setShowBulkBatchModal] = useState(false)
  // Communication
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [showCommunicationPanel, setShowCommunicationPanel] = useState(false)
  const [communicationData, setCommunicationData] = useState({
    subject: '',
    message: '',
    type: 'email' as 'email' | 'sms',
  })
  const [isSendingCommunication, setIsSendingCommunication] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })
  useEffect(() => {
    loadData()
  }, [])
  useEffect(() => {
    const filterStudents = () => {
      let filtered = students
      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(
          (student) =>
            student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      }
      // Course filter
      if (courseFilter !== 'all') {
        filtered = filtered.filter((student) =>
          student.enrollments.some((e) => e.course_id === courseFilter),
        )
      }
      // Status filter (enrollment status)
      if (statusFilter !== 'all') {
        filtered = filtered.filter((student) =>
          student.enrollments.some((e) => e.status === statusFilter),
        )
      }
      // User status filter (active/inactive/suspended/pending_verification)
      if (userStatusFilter !== 'all') {
        filtered = filtered.filter((student) => student.status === userStatusFilter)
      }
      // Age group filter
      if (ageGroupFilter !== 'all') {
        const [minAge, maxAge] = ageGroupFilter.split('-').map(Number)
        filtered = filtered.filter(
          (student) => student.age && student.age >= minAge && student.age <= maxAge,
        )
      }
      // Gurukul filter
      if (gurukulFilter !== 'all') {
        filtered = filtered.filter((student) =>
          student.enrollments.some((e) => e.course?.gurukul_id === gurukulFilter),
        )
      }
      // Consent filter
      if (consentFilter !== 'all') {
        filtered = filtered.filter((student) => {
          const consent = studentConsents.get(student.id)
          if (consentFilter === 'given') {
            return consent?.consent_given && !consent?.withdrawn
          } else if (consentFilter === 'not_given') {
            return !consent?.consent_given
          } else if (consentFilter === 'withdrawn') {
            return consent?.withdrawn
          }
          return true
        })
      }
      // Sort alphabetically by full name
      filtered.sort((a, b) => {
        const nameA = (a.full_name || a.email || '').toLowerCase()
        const nameB = (b.full_name || b.email || '').toLowerCase()
        return nameA.localeCompare(nameB)
      })
      setFilteredStudents(filtered)
      setCurrentPage(1) // Reset to first page when filters change
    }
    filterStudents()
  }, [
    students,
    searchTerm,
    courseFilter,
    statusFilter,
    userStatusFilter,
    ageGroupFilter,
    gurukulFilter,
    consentFilter,
    studentConsents,
  ])

  // Pagination helpers
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSelectAllOnPage = () => {
    const currentPageIds = paginatedStudents.map((s) => s.id)
    const newSelected = new Set(selectedStudents)
    const allCurrentPageSelected = currentPageIds.every((id) => selectedStudents.has(id))

    if (allCurrentPageSelected) {
      currentPageIds.forEach((id) => newSelected.delete(id))
    } else {
      currentPageIds.forEach((id) => newSelected.add(id))
    }
    setSelectedStudents(newSelected)
  }
  // Removed duplicate filterStudents function
  const loadData = async () => {
    try {
      const [usersData, coursesResult, enrollmentsData, gurukulsResult, certificatesData] =
        await Promise.all([
          getAllUsers(),
          getCourses(),
          getAllEnrollments(),
          getGurukuls(),
          getCertificatesFromTable(),
        ])
      setCourses(coursesResult.courses)
      setGurukuls(gurukulsResult.gurukuls)
      setCertificates(certificatesData)
      // Filter only students and enrich with enrollment data
      const studentsOnly = usersData.filter((user) => user.role === 'student')
      const enrichedStudents = await Promise.all(
        studentsOnly.map(async (student) => {
          const studentEnrollments = enrollmentsData.filter((e) => e.student_id === student.id)
          const completedCourses = studentEnrollments.filter((e) => e.status === 'completed').length
          const pendingEnrollments = studentEnrollments.filter((e) => e.status === 'pending').length
          const totalSpent = studentEnrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0)

          // Get attendance data for the student
          const attendanceSummaries = await getStudentAttendanceSummary(student.id)
          const overallAttendancePercentage =
            attendanceSummaries.length > 0
              ? attendanceSummaries.reduce((sum, s) => sum + s.stats.attendance_percentage, 0) /
                attendanceSummaries.length
              : 0

          // Get course progress data for the student
          const courseProgress = await getStudentCourseProgress(student.id)
          const progressValues = Object.values(courseProgress)
          const averageCourseProgress =
            progressValues.length > 0
              ? progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length
              : 0

          return {
            ...student,
            enrollments: studentEnrollments,
            total_enrollments: studentEnrollments.length,
            completed_courses: completedCourses,
            pending_enrollments: pendingEnrollments,
            total_spent: totalSpent,
            attendance_summaries: attendanceSummaries,
            overall_attendance_percentage: overallAttendancePercentage,
            course_progress: courseProgress,
            average_course_progress: averageCourseProgress,
          }
        }),
      )
      setStudents(enrichedStudents as StudentWithEnrollments[])

      // Load consent status for all students
      if (studentsOnly.length > 0) {
        const studentIds = studentsOnly.map((s) => s.id)
        const consents = await getStudentsConsent(studentIds)
        const consentMap = new Map<string, StudentConsent>()
        consents.forEach((consent) => {
          if (consent) {
            consentMap.set(consent.student_id, consent)
          }
        })
        setStudentConsents(consentMap)
      }
    } catch {
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }
  const handleViewStudent = async (student: StudentWithEnrollments) => {
    setViewingStudent(student)
    // Fetch parent data if parent_id exists
    if (student.parent_id) {
      try {
        const { getUserProfile } = await import('@/lib/api/users')
        const parent = await getUserProfile(student.parent_id)
        setParentData(parent)
      } catch (error) {
        console.error('Failed to load parent data:', error)
        setParentData(null)
      }
    } else {
      setParentData(null)
    }
  }
  const handleAssignBatch = (student: StudentWithEnrollments) => {
    setSelectedStudentForBatch(student)
    setShowBatchModal(true)
  }
  const handleBulkCommunication = () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select students to communicate with')
      return
    }
    setShowCommunicationPanel(true)
  }
  const handleSendCommunication = async () => {
    if (!communicationData.message.trim()) {
      toast.error('Please enter a message')
      return
    }

    if (communicationData.type === 'email' && !communicationData.subject.trim()) {
      toast.error('Please enter an email subject')
      return
    }

    setIsSendingCommunication(true)

    try {
      const selectedStudentsList = filteredStudents.filter((s) => selectedStudents.has(s.id))

      if (communicationData.type === 'email') {
        const studentEmails = selectedStudentsList.map((s) => s.email).filter(Boolean)

        if (studentEmails.length === 0) {
          toast.error('No valid email addresses found for selected students')
          setIsSendingCommunication(false)
          return
        }

        const result = await sendBulkEmail({
          studentEmails,
          subject: communicationData.subject,
          message: communicationData.message,
        })

        if (result.success) {
          toast.success(`Email sent successfully to ${result.sent} student(s)`)
          setShowCommunicationPanel(false)
          setSelectedStudents(new Set())
          setCommunicationData({ subject: '', message: '', type: 'email' })
        } else {
          // Show detailed error message
          console.error('Email sending errors:', result.errors)

          if (result.errors.some((err) => err.includes('Cannot connect to email service'))) {
            toast.error(
              '⚠️ Email service unavailable. Please ensure the main Next.js app is running on port 3000.',
              { duration: 6000 },
            )
          } else if (result.sent > 0) {
            toast.error(
              `Partially sent: ${result.sent} succeeded, ${result.failed} failed. Check console for details.`,
              { duration: 5000 },
            )
          } else {
            toast.error(
              `Failed to send emails. ${result.errors[0] || 'Please check console for details.'}`,
              { duration: 5000 },
            )
          }
        }
      } else if (communicationData.type === 'sms') {
        const phoneNumbers = selectedStudentsList.map((s) => s.phone).filter(Boolean) as string[]

        if (phoneNumbers.length === 0) {
          toast.error('No valid phone numbers found for selected students')
          setIsSendingCommunication(false)
          return
        }

        const result = await sendBulkSMS({
          phoneNumbers,
          message: communicationData.message,
        })

        if (result.success) {
          toast.success(`SMS sent successfully to ${result.sent} student(s)`)
          setShowCommunicationPanel(false)
          setSelectedStudents(new Set())
          setCommunicationData({ subject: '', message: '', type: 'email' })
        } else {
          toast.error(
            `SMS sending failed: ${result.errors[0] || 'SMS functionality not yet implemented'}`,
          )
        }
      }
    } catch (error) {
      console.error('Communication error:', error)
      toast.error(
        `Failed to send ${communicationData.type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    } finally {
      setIsSendingCommunication(false)
    }
  }
  const exportStudentData = () => {
    // Create CSV data
    filteredStudents.map((student) => ({
      'Student ID': student.student_id,
      'Full Name': student.full_name,
      Email: student.email,
      Age: student.age,
      Phone: student.phone,
      'Total Enrollments': student.total_enrollments,
      'Completed Courses': student.completed_courses,
      'Pending Enrollments': student.pending_enrollments,
      'Total Spent': `€${student.total_spent}`,
      'Joined Date': formatDate(student.created_at),
    }))
    // In a real app, this would generate and download a CSV file
    toast.success('Student data exported successfully')
  }
  // Removed unused getStudentsByGurukul function
  const getStudentsByCourse = () => {
    const courseGroups: Record<
      string,
      { course: Course & { gurukul?: Gurukul }; students: StudentWithEnrollments[] }
    > = {}
    filteredStudents.forEach((student) => {
      student.enrollments.forEach((enrollment) => {
        if (enrollment.course) {
          const courseKey = enrollment.course.id
          if (!courseGroups[courseKey]) {
            courseGroups[courseKey] = {
              course: enrollment.course,
              students: [],
            }
          }
          if (!courseGroups[courseKey].students.find((s) => s.id === student.id)) {
            courseGroups[courseKey].students.push(student)
          }
        }
      })
    })
    return courseGroups
  }
  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter((s) => s.status === 'active').length,
    newStudents: students.filter((s) => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(s.created_at) > weekAgo
    }).length,
    studentsWithCertificates: students.filter((s) =>
      s.enrollments.some((e) => hasCertificate(s.id, e.course_id)),
    ).length,
    averageAge:
      students.length > 0 && students.some((s) => s.age)
        ? Math.round(
            students.reduce((sum, s) => sum + (s.age || 0), 0) /
              students.filter((s) => s.age).length,
          )
        : 0,
    completionRate:
      students.length > 0 && students.reduce((sum, s) => sum + s.total_enrollments, 0) > 0
        ? Math.round(
            (students.reduce((sum, s) => sum + s.completed_courses, 0) /
              students.reduce((sum, s) => sum + s.total_enrollments, 0)) *
              100,
          )
        : 0,
  }
  const ageGroups = [
    { value: '4-7', label: 'Elementary (4-7)' },
    { value: '8-11', label: 'Basic (8-11)' },
    { value: '12-15', label: 'Intermediate (12-15)' },
    { value: '16-19', label: 'Advanced (16-19)' },
    { value: '20-100', label: 'Adult (20+)' },
  ]
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      {/* Student Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4 text-center">
            <UserGroupIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
            <div className="text-xs text-gray-600">Total Students</div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4 text-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{stats.activeStudents}</div>
            <div className="text-xs text-gray-600">Active Students</div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4 text-center">
            <UserIcon className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{stats.newStudents}</div>
            <div className="text-xs text-gray-600">New (7 days)</div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4 text-center">
            <DocumentTextIcon className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">
              {stats.studentsWithCertificates}
            </div>
            <div className="text-xs text-gray-600">With Certificates</div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4 text-center">
            <CalendarIcon className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-indigo-600">{stats.averageAge}</div>
            <div className="text-xs text-gray-600">Average Age</div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4 text-center">
            <ChartBarIcon className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-600">{stats.completionRate}%</div>
            <div className="text-xs text-gray-600">Completion Rate</div>
          </CardContent>
        </Card>
      </div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-8">
          {[
            { id: 'overview', name: 'Student Overview', icon: UserGroupIcon },
            { id: 'by-course', name: 'Students by Course', icon: BookOpenIcon },
            { id: 'communication', name: 'Communication', icon: EnvelopeIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'by-course' | 'communication')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
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
      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                />
              </div>
            </div>
            <select
              value={gurukulFilter}
              onChange={(e) => setGurukulFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
            >
              <option value="all">All Gurukuls</option>
              {gurukuls.map((gurukul) => (
                <option key={gurukul.id} value={gurukul.id}>
                  {gurukul.name}
                </option>
              ))}
            </select>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_number} - {course.title}
                </option>
              ))}
            </select>
            <select
              value={ageGroupFilter}
              onChange={(e) => setAgeGroupFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
            >
              <option value="all">All Ages</option>
              {ageGroups.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
            >
              <option value="all">All Enrollment Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
            >
              <option value="all">All Student Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending_verification">Pending Verification</option>
            </select>
            <select
              value={consentFilter}
              onChange={(e) => setConsentFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
            >
              <option value="all">All Consent Status</option>
              <option value="given">Consent Given</option>
              <option value="not_given">No Consent</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredStudents.length} of {students.length} students
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportStudentData}>
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setCourseFilter('all')
                  setStatusFilter('all')
                  setUserStatusFilter('all')
                  setAgeGroupFilter('all')
                  setGurukulFilter('all')
                  setConsentFilter('all')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Student Details Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-orange-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-lg font-bold text-white">
                      {viewingStudent.full_name
                        ? viewingStudent.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2)
                        : viewingStudent.email?.[0]?.toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Student Details</h2>
                    <p className="text-sm text-white text-opacity-90">
                      {viewingStudent.full_name || viewingStudent.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setViewingStudent(null)
                    setParentData(null)
                  }}
                  className="text-white hover:bg-black hover:bg-opacity-20 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Account Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Account Information</h3>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="font-bold text-gray-700">Student ID:</span>
                    <span className="ml-2 text-gray-600">
                      {viewingStudent.student_id || 'Not assigned'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Status:</span>
                    <span className="ml-2">
                      {viewingStudent.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          <CheckCircleIcon className="h-3 w-3" />
                          Active
                        </span>
                      ) : viewingStudent.status === 'pending_verification' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          <ClockIcon className="h-3 w-3" />
                          Pending Verification
                        </span>
                      ) : (
                        <span className="text-gray-600">
                          {toSentenceCase(viewingStudent.status || 'Active')}
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Grade:</span>
                    <span className="ml-2 text-gray-600">
                      {viewingStudent.grade || 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-600">
                      {formatDate(viewingStudent.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Updated:</span>
                    <span className="ml-2 text-gray-600">
                      {formatDate(viewingStudent.updated_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Personal Information</h3>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                  <div className="col-span-2">
                    <span className="font-bold text-gray-700">Full Name:</span>
                    <span className="ml-2 text-gray-600">
                      {viewingStudent.full_name || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Age:</span>
                    <span className="ml-2 text-gray-600">{viewingStudent.age || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold text-gray-700">Date of Birth:</span>
                    <span className="ml-2 text-gray-600">
                      {viewingStudent.date_of_birth
                        ? formatDate(viewingStudent.date_of_birth)
                        : 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="font-bold text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-600">{viewingStudent.email}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Phone:</span>
                    <span className="ml-2 text-gray-600">
                      {viewingStudent.phone || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Address Information {parentData && '(Parent/Guardian Address)'}
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="font-bold text-gray-700">Address Line 1:</span>
                    <span className="ml-2 text-gray-600">
                      {parentData?.address_line_1 ||
                        viewingStudent.address_line_1 ||
                        'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Address Line 2:</span>
                    <span className="ml-2 text-gray-600">
                      {parentData?.address_line_2 || viewingStudent.address_line_2 || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">City:</span>
                    <span className="ml-2 text-gray-600">
                      {parentData?.city || viewingStudent.city || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">State/Province:</span>
                    <span className="ml-2 text-gray-600">
                      {(() => {
                        const stateCode = parentData?.state || viewingStudent.state
                        const countryCode = parentData?.country || viewingStudent.country
                        if (!stateCode) return 'Not provided'
                        const stateName = countryCode ? getStateName(countryCode, stateCode) : ''
                        return stateName || stateCode
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Postal Code:</span>
                    <span className="ml-2 text-gray-600">
                      {parentData?.zip_code || viewingStudent.zip_code || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Country:</span>
                    <span className="ml-2 text-gray-600">
                      {(() => {
                        const countryCode = parentData?.country || viewingStudent.country
                        if (!countryCode) return 'Not provided'
                        const countryName = getCountryName(countryCode)
                        return countryName || countryCode
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parent/Guardian Information */}
              {(viewingStudent.parent_guardian_name ||
                viewingStudent.parent_guardian_email ||
                viewingStudent.parent_guardian_phone) && (
                <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">
                    Parent/Guardian Information
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {viewingStudent.parent_guardian_name && (
                      <div>
                        <span className="font-bold text-gray-700">Name:</span>
                        <span className="ml-2 text-gray-600">
                          {viewingStudent.parent_guardian_name}
                        </span>
                      </div>
                    )}
                    {viewingStudent.parent_guardian_email && (
                      <div>
                        <span className="font-bold text-gray-700">Email:</span>
                        <span className="ml-2 text-gray-600">
                          {viewingStudent.parent_guardian_email}
                        </span>
                      </div>
                    )}
                    {viewingStudent.parent_guardian_phone && (
                      <div>
                        <span className="font-bold text-gray-700">Phone:</span>
                        <span className="ml-2 text-gray-600">
                          {viewingStudent.parent_guardian_phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {(viewingStudent.emergency_contact || viewingStudent.emergency_phone) && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {viewingStudent.emergency_contact &&
                      typeof viewingStudent.emergency_contact === 'object' && (
                        <>
                          {viewingStudent.emergency_contact.name && (
                            <div>
                              <span className="font-bold text-gray-700">Name:</span>
                              <span className="ml-2 text-gray-600">
                                {viewingStudent.emergency_contact.name}
                              </span>
                            </div>
                          )}
                          {viewingStudent.emergency_contact.phone && (
                            <div>
                              <span className="font-bold text-gray-700">Phone:</span>
                              <span className="ml-2 text-gray-600">
                                {viewingStudent.emergency_contact.phone}
                              </span>
                            </div>
                          )}
                          {viewingStudent.emergency_contact.email && (
                            <div>
                              <span className="font-bold text-gray-700">Email:</span>
                              <span className="ml-2 text-gray-600">
                                {viewingStudent.emergency_contact.email}
                              </span>
                            </div>
                          )}
                          {viewingStudent.emergency_contact.relationship && (
                            <div>
                              <span className="font-bold text-gray-700">Relationship:</span>
                              <span className="ml-2 text-gray-600">
                                {viewingStudent.emergency_contact.relationship}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    {viewingStudent.emergency_phone && (
                      <div>
                        <span className="font-bold text-gray-700">Emergency Phone:</span>
                        <span className="ml-2 text-gray-600">{viewingStudent.emergency_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enrollment Summary */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Enrollment Summary</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Total Enrollments</p>
                    <p className="text-xl font-bold text-gray-900">
                      {viewingStudent.total_enrollments}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Completed</p>
                    <p className="text-xl font-bold text-gray-900">
                      {viewingStudent.completed_courses}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Total Spent</p>
                    <p className="text-xl font-bold text-gray-900">€{viewingStudent.total_spent}</p>
                  </div>
                </div>
              </div>

              {/* Attendance Summary */}
              {viewingStudent.attendance_summaries &&
                viewingStudent.attendance_summaries.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-lime-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Attendance Summary</h3>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-gray-700">Overall Attendance:</span>
                        <span className="text-sm text-gray-900">
                          {Math.round(viewingStudent.overall_attendance_percentage || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (viewingStudent.overall_attendance_percentage || 0) >= 75
                              ? 'bg-green-500'
                              : (viewingStudent.overall_attendance_percentage || 0) >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{
                            width: `${viewingStudent.overall_attendance_percentage || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      {viewingStudent.attendance_summaries.map((summary: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{summary.course_title || 'Course'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">
                              {summary.present_count}/{summary.total_classes}
                            </span>
                            <span className="font-medium text-gray-900">
                              {!isNaN(summary.attendance_percentage) &&
                              summary.attendance_percentage !== null
                                ? Math.round(summary.attendance_percentage)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Consent Status */}
              <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Consent Status</h3>
                <div className="flex items-center justify-between">
                  <ConsentStatusBadge
                    consentGiven={studentConsents.get(viewingStudent.id)?.consent_given || false}
                    withdrawn={studentConsents.get(viewingStudent.id)?.withdrawn || false}
                    size="sm"
                    showLabel={true}
                  />
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white"
                    onClick={async () => {
                      const consent = await getStudentConsent(viewingStudent.id)
                      if (consent) {
                        setSelectedConsentForAudit(consent)
                        setSelectedStudentNameForAudit(viewingStudent.full_name || 'Unknown')
                        setShowConsentAudit(true)
                      } else {
                        toast.error('No consent record found for this student')
                      }
                    }}
                  >
                    View Audit Trail
                  </Button>
                </div>
              </div>

              {/* Course Enrollments */}
              {viewingStudent.enrollments && viewingStudent.enrollments.length > 0 && (
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Course Enrollments</h3>
                  <div className="space-y-2">
                    {viewingStudent.enrollments.map((enrollment: any) => (
                      <div key={enrollment.id} className="bg-white rounded p-2 text-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-bold text-gray-900">
                              {enrollment.course?.title || 'Unknown Course'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {enrollment.course?.course_number || 'No course number'} •{' '}
                              {enrollment.course?.gurukul?.name || 'No gurukul'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Enrolled: {formatDate(enrollment.enrolled_at)}
                              {enrollment.completed_at && (
                                <span className="text-green-600 ml-2">
                                  • Completed: {formatDate(enrollment.completed_at)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge
                            className={
                              enrollment.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : enrollment.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {toSentenceCase(enrollment.status)}
                          </Badge>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Progress:</span>
                            <span className="text-xs font-medium">{enrollment.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-gray-700 h-1.5 rounded-full"
                              style={{ width: `${enrollment.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Communication Panel */}
      {showCommunicationPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <EnvelopeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Send Communication</h2>
                    <p className="text-sm text-white text-opacity-90">
                      Compose message to selected students
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCommunicationPanel(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Recipients Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStudents.size} Student{selectedStudents.size !== 1 ? 's' : ''}{' '}
                      Selected
                    </p>
                    <p className="text-xs text-gray-600">
                      {communicationData.type === 'email'
                        ? 'Messages will be sent to their registered email addresses'
                        : 'Messages will be sent to their registered phone numbers'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Communication Type */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Communication Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCommunicationData((prev) => ({ ...prev, type: 'email' }))}
                    className={`relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      communicationData.type === 'email'
                        ? 'border-orange-500 bg-orange-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        communicationData.type === 'email'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <EnvelopeIcon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-xs text-gray-500">Send via email</p>
                    </div>
                    {communicationData.type === 'email' && (
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 absolute top-3 right-3" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommunicationData((prev) => ({ ...prev, type: 'sms' }))}
                    className={`relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      communicationData.type === 'sms'
                        ? 'border-orange-500 bg-orange-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        communicationData.type === 'sms'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <PhoneIcon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">SMS</p>
                      <p className="text-xs text-gray-500">Send via text</p>
                    </div>
                    {communicationData.type === 'sms' && (
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 absolute top-3 right-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Subject (Email only) */}
              {communicationData.type === 'email' && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email Subject <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={communicationData.subject}
                    onChange={(e) =>
                      setCommunicationData((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    placeholder="Enter email subject..."
                    className="text-base"
                  />
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={communicationData.message}
                  onChange={(e) =>
                    setCommunicationData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  rows={8}
                  placeholder={`Write your ${communicationData.type === 'email' ? 'email' : 'SMS'} message here...`}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3 resize-none"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <span>💡</span>
                  <span>
                    {communicationData.type === 'email'
                      ? 'Your message will be formatted as HTML email with eYogi branding'
                      : 'Keep SMS messages concise for better delivery'}
                  </span>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-between border-t">
              <Button
                variant="outline"
                onClick={() => setShowCommunicationPanel(false)}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendCommunication}
                disabled={isSendingCommunication}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingCommunication ? (
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                )}
                {isSendingCommunication
                  ? 'Sending...'
                  : `Send ${communicationData.type === 'email' ? 'Email' : 'SMS'} to ${selectedStudents.size} Student${selectedStudents.size !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Card>
          <CardContent className="p-6">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">No students match your current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            paginatedStudents.length > 0 &&
                            paginatedStudents.every((s) => selectedStudents.has(s.id))
                          }
                          onChange={handleSelectAllOnPage}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrollments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <UserIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.full_name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                              <div className="text-xs text-gray-400">ID: {student.student_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium">{student.total_enrollments} total</div>
                            <div className="text-green-600">
                              {student.completed_courses} completed
                            </div>
                            {student.pending_enrollments > 0 && (
                              <div className="text-yellow-600">
                                {student.pending_enrollments} pending
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{
                                    width: `${student.total_enrollments > 0 ? (student.completed_courses / student.total_enrollments) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">
                                {student.total_enrollments > 0
                                  ? Math.round(
                                      (student.completed_courses / student.total_enrollments) * 100,
                                    )
                                  : 0}
                                %
                              </span>
                            </div>
                            {student.course_progress &&
                              Object.keys(student.course_progress).length > 0 && (
                                <div className="flex items-center">
                                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      className="bg-green-500 h-2 rounded-full"
                                      style={{
                                        width: `${student.average_course_progress || 0}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    {Math.round(student.average_course_progress || 0)}% avg
                                  </span>
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {student.attendance_summaries &&
                          student.attendance_summaries.length > 0 ? (
                            <div className="flex items-center">
                              <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    (student.overall_attendance_percentage || 0) >= 75
                                      ? 'bg-green-500'
                                      : (student.overall_attendance_percentage || 0) >= 50
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{
                                    width: `${student.overall_attendance_percentage || 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">
                                {Math.round(student.overall_attendance_percentage || 0)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No data</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <ConsentStatusBadge
                            consentGiven={studentConsents.get(student.id)?.consent_given || false}
                            withdrawn={studentConsents.get(student.id)?.withdrawn || false}
                            size="sm"
                            showLabel={false}
                            onClick={async () => {
                              const consent = await getStudentConsent(student.id)
                              if (consent) {
                                setSelectedConsentForAudit(consent)
                                setSelectedStudentNameForAudit(student.full_name || 'Unknown')
                                setShowConsentAudit(true)
                              } else {
                                toast.error('No consent record found for this student')
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewStudent(student)}
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAssignBatch(student)}
                              title="Manage Batches"
                            >
                              <QueueListIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination Controls */}
            {filteredStudents.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of{' '}
                  {filteredStudents.length} students
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        )
                      })
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {activeTab === 'by-course' && (
        <div className="flex flex-col gap-6">
          {Object.entries(getStudentsByCourse()).map(([courseId, { course, students }]) => (
            <Card key={courseId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpenIcon className="h-6 w-6 text-orange-600" />
                    <div>
                      <h3 className="text-lg font-semibold">{course.title}</h3>
                      <p className="text-sm text-gray-600">
                        {course.course_number} • {course.gurukul?.name} • {students.length} students
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      course.level === 'elementary'
                        ? 'bg-green-100 text-green-800'
                        : course.level === 'basic'
                          ? 'bg-blue-100 text-blue-800'
                          : course.level === 'intermediate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                    size="sm"
                  >
                    {toSentenceCase(course.level)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => {
                    const enrollment = student.enrollments.find((e) => e.course_id === courseId)
                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{student.full_name}</p>
                            <p className="text-xs text-gray-600">{student.student_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${
                              enrollment?.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : enrollment?.status === 'approved'
                                  ? 'bg-blue-100 text-blue-800'
                                  : enrollment?.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                            }`}
                            size="sm"
                          >
                            {toSentenceCase(enrollment?.status || '')}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewStudent(student)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'communication' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Student Communication</h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedStudents(new Set(filteredStudents.map((s) => s.id)))}
                >
                  Select All Visible
                </Button>
                <Button onClick={() => setSelectedStudents(new Set())}>Clear Selection</Button>
              </div>
            </div>
            {selectedStudents.size > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
                  </span>
                  <Button onClick={handleBulkCommunication}>
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {paginatedStudents.length === 0 ? (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">No students match your current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            paginatedStudents.length > 0 &&
                            paginatedStudents.every((s) => selectedStudents.has(s.id))
                          }
                          onChange={handleSelectAllOnPage}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrollments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consent Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <UserIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.full_name || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-400">ID: {student.student_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="flex items-center text-gray-900 mb-1">
                              <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                              {student.email}
                            </div>
                            {student.phone && (
                              <div className="flex items-center text-gray-600">
                                <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                                {student.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium">{student.total_enrollments} total</div>
                            <div className="text-green-600">
                              {student.completed_courses} completed
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <ConsentStatusBadge
                            consentGiven={studentConsents.get(student.id)?.consent_given || false}
                            withdrawn={studentConsents.get(student.id)?.withdrawn || false}
                            size="sm"
                            showLabel={true}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination Controls */}
            {filteredStudents.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of{' '}
                  {filteredStudents.length} students
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        )
                      })
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Batch Assignment Modal */}
      {showBatchModal && selectedStudentForBatch && (
        <StudentBatchAssignmentModal
          student={selectedStudentForBatch}
          onClose={() => {
            setShowBatchModal(false)
            setSelectedStudentForBatch(null)
          }}
          onSuccess={() => {
            loadData()
          }}
        />
      )}

      {/* Bulk Batch Assignment Modal */}
      {showBulkBatchModal && selectedStudents.size > 0 && (
        <BulkBatchAssignmentModal
          students={filteredStudents.filter((s) => selectedStudents.has(s.id))}
          onClose={() => {
            setShowBulkBatchModal(false)
          }}
          onSuccess={() => {
            setSelectedStudents(new Set())
            loadData()
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        variant="danger"
      />

      {/* Consent Audit Modal */}
      {showConsentAudit && selectedConsentForAudit && (
        <ConsentAuditModal
          consent={selectedConsentForAudit}
          studentName={selectedStudentNameForAudit}
          onClose={() => {
            setShowConsentAudit(false)
            setSelectedConsentForAudit(null)
            setSelectedStudentNameForAudit('')
          }}
        />
      )}
    </div>
  )
}
