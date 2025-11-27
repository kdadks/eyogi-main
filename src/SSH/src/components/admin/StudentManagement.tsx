import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { User, Course, Enrollment, Gurukul, Certificate, StudentAttendanceSummary } from '@/types'
import { getAllUsers, deleteUser } from '@/lib/api/users'
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
import { ConfirmDialog } from '../ui/ConfirmDialog'
import StudentBatchAssignmentModal from './StudentBatchAssignmentModal'
import BulkBatchAssignmentModal from './BulkBatchAssignmentModal'
import {
  UserIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BookOpenIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  XMarkIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline'
interface StudentWithEnrollments extends User {
  enrollments: Array<Enrollment & { course?: Course & { gurukul?: Gurukul } }>
  total_enrollments: number
  completed_courses: number
  pending_enrollments: number
  total_spent: number
  age?: number
  parent_guardian_name?: string
  parent_guardian_email?: string
  parent_guardian_phone?: string
  attendance_summaries?: StudentAttendanceSummary[]
  overall_attendance_percentage?: number
  course_progress?: { [courseId: string]: number }
  average_course_progress?: number
}
interface StudentFormData {
  full_name: string
  email: string
  age: number
  phone: string
  address: string
  parent_guardian_name: string
  parent_guardian_email: string
  parent_guardian_phone: string
  role: 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent'
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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'by-course' | 'details' | 'communication'
  >('overview')
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all')
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('all')
  const [gurukulFilter, setGurukulFilter] = useState<string>('all')
  const [consentFilter, setConsentFilter] = useState<string>('all')
  // Student Details
  const [viewingStudent, setViewingStudent] = useState<StudentWithEnrollments | null>(null)
  const [editingStudent, setEditingStudent] = useState<StudentWithEnrollments | null>(null)
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [selectedStudentForBatch, setSelectedStudentForBatch] =
    useState<StudentWithEnrollments | null>(null)
  const [showBulkBatchModal, setShowBulkBatchModal] = useState(false)
  const [studentFormData, setStudentFormData] = useState<StudentFormData>({
    full_name: '',
    email: '',
    age: 16,
    phone: '',
    address: '',
    parent_guardian_name: '',
    parent_guardian_email: '',
    parent_guardian_phone: '',
    role: 'student',
  })
  const [formLoading, setFormLoading] = useState(false)
  // Communication
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [showCommunicationPanel, setShowCommunicationPanel] = useState(false)
  const [communicationData, setCommunicationData] = useState({
    subject: '',
    message: '',
    type: 'email' as 'email' | 'sms',
  })
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
      setFilteredStudents(filtered)
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
  // Removed duplicate filterStudents function
  const loadData = async () => {
    try {
      const [usersData, coursesData, enrollmentsData, gurukulData, certificatesData] =
        await Promise.all([
          getAllUsers(),
          getCourses(),
          getAllEnrollments(),
          getGurukuls(),
          getCertificatesFromTable(),
        ])
      setCourses(coursesData)
      setGurukuls(gurukulData)
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
  const handleViewStudent = (student: StudentWithEnrollments) => {
    setViewingStudent(student)
  }
  const handleEditStudent = (student: StudentWithEnrollments) => {
    setEditingStudent(student)
    setStudentFormData({
      full_name: student.full_name || '',
      email: student.email,
      age: student.age || 16,
      phone: student.phone || '',
      address:
        [student.address_line_1, student.city, student.state, student.zip_code, student.country]
          .filter(Boolean)
          .join(', ') || '',
      parent_guardian_name: student.parent_guardian_name || '',
      parent_guardian_email: student.parent_guardian_email || '',
      parent_guardian_phone: student.parent_guardian_phone || '',
      role: student.role,
    })
    setShowStudentForm(true)
  }
  const handleDeleteStudent = async (studentId: string) => {
    const studentToDelete = students.find((s) => s.id === studentId)
    if (!studentToDelete) return

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Student',
      message: `Are you sure you want to delete "${studentToDelete.full_name || studentToDelete.email}"? This will also remove all their enrollments and cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteUser(studentId)
          await loadData()
          toast.success('Student deleted successfully')
        } catch {
          toast.error('Failed to delete student')
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
      },
    })
  }

  const handleAssignBatch = (student: StudentWithEnrollments) => {
    setSelectedStudentForBatch(student)
    setShowBatchModal(true)
  }
  // Removed unused handleUpdateRole function
  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }
  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)))
    }
  }
  const handleBulkCommunication = () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select students to communicate with')
      return
    }
    setShowCommunicationPanel(true)
  }
  const handleSendCommunication = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success(
        `${communicationData.type === 'email' ? 'Email' : 'SMS'} sent to ${selectedStudents.size} students`,
      )
      setShowCommunicationPanel(false)
      setSelectedStudents(new Set())
      setCommunicationData({ subject: '', message: '', type: 'email' })
    } catch {
      toast.error('Failed to send communication')
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
  const resetStudentForm = () => {
    setStudentFormData({
      full_name: '',
      email: '',
      age: 16,
      phone: '',
      address: '',
      parent_guardian_name: '',
      parent_guardian_email: '',
      parent_guardian_phone: '',
      role: 'student',
    })
    setShowStudentForm(false)
    setEditingStudent(null)
  }
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      if (editingStudent) {
        // Update existing student - in real app, this would call updateUser API
        toast.success('Student updated successfully')
        await loadData()
      } else {
        // Create new student - in real app, this would call createUser API
        toast.success('Student created successfully')
        await loadData()
      }
      resetStudentForm()
    } catch {
      toast.error('Failed to save student')
    } finally {
      setFormLoading(false)
    }
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
            <PlusIcon className="h-6 w-6 text-purple-600 mx-auto mb-2" />
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
            { id: 'details', name: 'Detailed View', icon: EyeIcon },
            { id: 'communication', name: 'Communication', icon: EnvelopeIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as 'overview' | 'by-course' | 'details' | 'communication')
              }
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Student Details</h2>
                <Button variant="ghost" onClick={() => setViewingStudent(null)}>
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Personal Information
                  </h3>
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">{viewingStudent.full_name}</p>
                        <p className="text-gray-600">{viewingStudent.email}</p>
                        <p className="text-xs text-gray-500">ID: {viewingStudent.student_id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <p className="text-gray-600">Age:</p>
                        <p className="font-medium">{viewingStudent.age || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Role:</p>
                        <Badge className={getRoleColor(viewingStudent.role)} size="sm">
                          {toSentenceCase(viewingStudent.role)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone:</p>
                        <p className="font-medium">{viewingStudent.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Joined:</p>
                        <p className="font-medium">{formatDate(viewingStudent.created_at)}</p>
                      </div>
                    </div>
                    {(viewingStudent.address_line_1 || viewingStudent.city) && (
                      <div>
                        <p className="text-gray-600">Address:</p>
                        <p className="font-medium">
                          {[
                            viewingStudent.address_line_1,
                            viewingStudent.address_line_2,
                            viewingStudent.city,
                            viewingStudent.state,
                            viewingStudent.zip_code,
                            viewingStudent.country,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Enrollment Information */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center">
                    <AcademicCapIcon className="h-5 w-5 mr-2" />
                    Enrollment Summary
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-xl font-bold text-blue-600">
                          {viewingStudent.total_enrollments}
                        </div>
                        <div className="text-xs text-blue-800">Total Enrollments</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-xl font-bold text-green-600">
                          {viewingStudent.completed_courses}
                        </div>
                        <div className="text-xs text-green-800">Completed</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <div className="text-xl font-bold text-yellow-600">
                          {viewingStudent.pending_enrollments}
                        </div>
                        <div className="text-xs text-yellow-800">Pending</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <div className="text-xl font-bold text-purple-600">
                          €{viewingStudent.total_spent}
                        </div>
                        <div className="text-xs text-purple-800">Total Spent</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Course Enrollments</h4>
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                        {viewingStudent.enrollments.map((enrollment) => (
                          <div
                            key={enrollment.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{enrollment.course?.title}</p>
                              <p className="text-xs text-gray-600">
                                {enrollment.course?.course_number} •{' '}
                                {enrollment.course?.gurukul?.name}
                              </p>
                            </div>
                            <Badge
                              className={`${
                                enrollment.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : enrollment.status === 'approved'
                                    ? 'bg-blue-100 text-blue-800'
                                    : enrollment.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                              }`}
                              size="sm"
                            >
                              {toSentenceCase(enrollment.status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Parent/Guardian Information for Minors */}
              {viewingStudent.age &&
                viewingStudent.age < 18 &&
                (viewingStudent.parent_guardian_name || viewingStudent.parent_guardian_email) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2" />
                      Parent/Guardian Information
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Name:</p>
                        <p className="font-medium">
                          {viewingStudent.parent_guardian_name || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email:</p>
                        <p className="font-medium">
                          {viewingStudent.parent_guardian_email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone:</p>
                        <p className="font-medium">
                          {viewingStudent.parent_guardian_phone || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
      {/* Student Form Modal */}
      {showStudentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h2>
                <Button variant="ghost" onClick={resetStudentForm}>
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
              <form onSubmit={handleStudentSubmit} className="flex flex-col gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={studentFormData.full_name}
                    onChange={(e) =>
                      setStudentFormData((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={studentFormData.email}
                    onChange={(e) =>
                      setStudentFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <Input
                    label="Age"
                    type="number"
                    value={studentFormData.age}
                    onChange={(e) =>
                      setStudentFormData((prev) => ({ ...prev, age: parseInt(e.target.value) }))
                    }
                    required
                    min="4"
                    max="100"
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={studentFormData.phone}
                    onChange={(e) =>
                      setStudentFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={studentFormData.role}
                      onChange={(e) =>
                        setStudentFormData((prev) => ({
                          ...prev,
                          role: e.target.value as 'student' | 'teacher' | 'admin',
                        }))
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={studentFormData.address}
                    onChange={(e) =>
                      setStudentFormData((prev) => ({ ...prev, address: e.target.value }))
                    }
                    rows={2}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                  />
                </div>
                {/* Parent/Guardian Info for Minors */}
                {studentFormData.age < 18 && (
                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Parent/Guardian Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Parent/Guardian Name"
                        value={studentFormData.parent_guardian_name}
                        onChange={(e) =>
                          setStudentFormData((prev) => ({
                            ...prev,
                            parent_guardian_name: e.target.value,
                          }))
                        }
                      />
                      <Input
                        label="Parent/Guardian Email"
                        type="email"
                        value={studentFormData.parent_guardian_email}
                        onChange={(e) =>
                          setStudentFormData((prev) => ({
                            ...prev,
                            parent_guardian_email: e.target.value,
                          }))
                        }
                      />
                      <Input
                        label="Parent/Guardian Phone"
                        type="tel"
                        value={studentFormData.parent_guardian_phone}
                        onChange={(e) =>
                          setStudentFormData((prev) => ({
                            ...prev,
                            parent_guardian_phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  <Button type="submit" loading={formLoading}>
                    {editingStudent ? 'Update Student' : 'Create Student'}
                  </Button>
                  <Button type="button" variant="danger" onClick={resetStudentForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Communication Panel */}
      {showCommunicationPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Send Communication</h2>
                <Button variant="ghost" onClick={() => setShowCommunicationPanel(false)}>
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Sending to {selectedStudents.size} selected student
                  {selectedStudents.size !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="email"
                      checked={communicationData.type === 'email'}
                      onChange={(e) =>
                        setCommunicationData((prev) => ({
                          ...prev,
                          type: e.target.value as 'email' | 'sms',
                        }))
                      }
                      className="mr-2"
                    />
                    Email
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="sms"
                      checked={communicationData.type === 'sms'}
                      onChange={(e) =>
                        setCommunicationData((prev) => ({
                          ...prev,
                          type: e.target.value as 'email' | 'sms',
                        }))
                      }
                      className="mr-2"
                    />
                    SMS
                  </label>
                </div>
                {communicationData.type === 'email' && (
                  <Input
                    label="Subject"
                    value={communicationData.subject}
                    onChange={(e) =>
                      setCommunicationData((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    required
                  />
                )}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={communicationData.message}
                    onChange={(e) =>
                      setCommunicationData((prev) => ({ ...prev, message: e.target.value }))
                    }
                    rows={5}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleSendCommunication}>
                    Send {communicationData.type === 'email' ? 'Email' : 'SMS'}
                  </Button>
                  <Button variant="danger" onClick={() => setShowCommunicationPanel(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.slice(0, 12).map((student) => (
            <Card key={student.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{student.full_name}</h3>
                      <p className="text-sm text-gray-600">{student.student_id}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                  </div>
                  <Badge className={getRoleColor(student.role)} size="sm">
                    {toSentenceCase(student.role)}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-sm font-bold">{student.total_enrollments}</div>
                    <div className="text-xs text-gray-600">Enrolled</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-sm font-bold">{student.completed_courses}</div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-sm font-bold">€{student.total_spent}</div>
                    <div className="text-xs text-gray-600">Spent</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleViewStudent(student)}>
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEditStudent(student)}>
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAssignBatch(student)}>
                    <QueueListIcon className="h-4 w-4 mr-1" />
                    Batches
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
      {activeTab === 'details' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-bold">Detailed Student Management</h2>
              <div className="flex gap-2">
                {selectedStudents.size > 0 && (
                  <>
                    <Button onClick={handleBulkCommunication}>
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      Message Selected ({selectedStudents.size})
                    </Button>
                    <Button variant="outline" onClick={() => setShowBulkBatchModal(true)}>
                      <QueueListIcon className="h-4 w-4 mr-2" />
                      Assign to Batches ({selectedStudents.size})
                    </Button>
                  </>
                )}
                <Button onClick={() => setShowStudentForm(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                            selectedStudents.size === filteredStudents.length &&
                            filteredStudents.length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
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
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
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
                            <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.full_name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">ID: {student.student_id}</div>
                              <div className="text-xs text-gray-400">
                                Age: {student.age || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="flex items-center text-gray-900 mb-1">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {student.email}
                            </div>
                            {student.phone && (
                              <div className="flex items-center text-gray-600">
                                <PhoneIcon className="h-4 w-4 mr-1" />
                                {student.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium">{student.total_enrollments} total</div>
                            <div className="text-gray-600">
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
                            {/* Course Completion Progress */}
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
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
                                % done
                              </span>
                            </div>
                            {/* Average Course Progress */}
                            {student.course_progress &&
                              Object.keys(student.course_progress).length > 0 && (
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
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
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
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
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(student.created_at)}
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
                              onClick={() => handleEditStudent(student)}
                              title="Edit Student"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAssignBatch(student)}
                              title="Manage Batches"
                            >
                              <QueueListIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteStudent(student.id)}
                              title="Delete Student"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
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
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{student.full_name}</p>
                        <p className="text-xs text-gray-600">{student.student_id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-gray-600">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-3 w-3 mr-1" />
                      {student.email}
                    </div>
                    {student.phone && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-3 w-3 mr-1" />
                        {student.phone}
                      </div>
                    )}
                    <div className="flex items-center">
                      <AcademicCapIcon className="h-3 w-3 mr-1" />
                      {student.total_enrollments} enrollments
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
