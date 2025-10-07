import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { User, Enrollment, Course, Batch, BatchStudent } from '../../types'
import type { Database } from '../../lib/supabase'
type Profile = Database['public']['Tables']['profiles']['Row']
import { getAllUsers } from '../../lib/api/users'
import { getTeacherEnrollments, updateEnrollmentStatus } from '../../lib/api/enrollments'
import { getTeacherCourses } from '../../lib/api/courses'
import { getBatches } from '../../lib/api/batches'
import { supabaseAdmin } from '../../lib/supabase'
import toast from 'react-hot-toast'
import UserFormModal from '../admin/UserFormModal'
import BulkBatchAssignmentModal from '../admin/BulkBatchAssignmentModal'
import {
  UserIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  BookOpenIcon,
  QueueListIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'

interface EnrichedStudent extends User {
  enrollments: Enrollment[]
  batches: BatchStudent[]
}

export default function TeacherStudentManagement() {
  const { user } = useWebsiteAuth()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<EnrichedStudent[]>([])
  const [filteredStudents, setFilteredStudents] = useState<EnrichedStudent[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [batchFilter, setBatchFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'list' | 'by-batch' | 'pending'>('list')

  // Selection
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())

  // Modals
  const [viewingStudent, setViewingStudent] = useState<EnrichedStudent | null>(null)
  const [editingStudent, setEditingStudent] = useState<EnrichedStudent | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [userModalMode, setUserModalMode] = useState<'view' | 'edit'>('view')
  const [showBulkBatchModal, setShowBulkBatchModal] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) {
      console.log('No user found')
      return
    }

    setLoading(true)
    try {
      console.log('Loading data for teacher:', user.id)

      const [teacherCourses, teacherEnrollments, allUsers, teacherBatches] = await Promise.all([
        getTeacherCourses(user.id),
        getTeacherEnrollments(user.id),
        getAllUsers(),
        getBatches({ teacher_id: user.id }),
      ])

      console.log('Teacher courses:', teacherCourses.length)
      console.log('Teacher enrollments:', teacherEnrollments.length)
      console.log('All users:', allUsers.length)
      console.log('Teacher batches:', teacherBatches.length)

      setCourses(teacherCourses)
      setBatches(teacherBatches)

      // If teacher has no courses, we need to get enrollments based on course_assignments
      let relevantEnrollments = teacherEnrollments

      if (teacherEnrollments.length === 0 && teacherCourses.length > 0) {
        console.log('Fetching enrollments based on course IDs')
        // Get enrollments for teacher's courses
        const courseIds = teacherCourses.map((c) => c.id)
        const { data: courseEnrollments } = await supabaseAdmin
          .from('enrollments')
          .select(
            `
            *,
            courses (*),
            profiles!enrollments_student_id_fkey (*)
          `,
          )
          .in('course_id', courseIds)
          .order('enrolled_at', { ascending: false })

        relevantEnrollments = courseEnrollments || []
        console.log('Course enrollments found:', relevantEnrollments.length)
      }

      // Get unique student IDs from enrollments
      const studentIds = new Set(relevantEnrollments.map((e) => e.student_id))

      // Filter only students who are enrolled in teacher's courses
      const enrolledStudents = allUsers.filter(
        (user) => user.role === 'student' && studentIds.has(user.id),
      )

      console.log('Enrolled students found:', enrolledStudents.length)

      // Enrich students with their enrollments (batches loaded separately)
      const enrichedStudents = enrolledStudents.map((student) => {
        const studentEnrollments = relevantEnrollments.filter((e) => e.student_id === student.id)

        return {
          ...student,
          enrollments: studentEnrollments,
          batches: [], // Initialize as empty, will be loaded when needed
        }
      })

      setStudents(enrichedStudents)

      // Load batch info for all students in the background
      if (enrichedStudents.length > 0) {
        loadStudentBatches(enrichedStudents, teacherBatches)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }, [user])

  const loadStudentBatches = async (
    studentsToUpdate: EnrichedStudent[],
    availableBatches: Batch[],
  ) => {
    try {
      // Get batch students for teacher's batches only
      const batchIds = availableBatches.map((b) => b.id)

      if (batchIds.length === 0) return

      const { data: batchStudents, error } = await supabaseAdmin
        .from('batch_students')
        .select('*')
        .in('batch_id', batchIds)

      if (error) {
        console.error('Error loading batch students:', error)
        return
      }

      // Map batch students to students
      const updatedStudents = studentsToUpdate.map((student) => {
        const studentBatchAssignments = (batchStudents || []).filter(
          (bs) => bs.student_id === student.id,
        )

        return {
          ...student,
          batches: studentBatchAssignments as BatchStudent[],
        }
      })

      setStudents(updatedStudents)
    } catch (error) {
      console.error('Error loading student batches:', error)
    }
  }

  const filterStudents = useCallback(() => {
    let filtered = students

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter((student) =>
        student.enrollments.some((e) => e.course_id === courseFilter),
      )
    }

    // Batch filter
    if (batchFilter !== 'all') {
      filtered = filtered.filter((student) =>
        student.batches.some((b) => b.batch_id === batchFilter),
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((student) =>
        student.enrollments.some((e) => e.status === statusFilter),
      )
    }

    // Tab-specific filtering
    if (activeTab === 'pending') {
      filtered = filtered.filter((student) =>
        student.enrollments.some((e) => e.status === 'pending'),
      )
    }

    setFilteredStudents(filtered)
  }, [students, searchTerm, courseFilter, batchFilter, statusFilter, activeTab])

  useEffect(() => {
    loadData()
  }, [user, loadData])

  useEffect(() => {
    filterStudents()
  }, [students, searchTerm, courseFilter, batchFilter, statusFilter, activeTab, filterStudents])

  const handleApproveEnrollment = async (enrollmentId: string) => {
    try {
      await updateEnrollmentStatus(enrollmentId, 'approved')
      toast.success('Enrollment approved successfully')
      loadData()
    } catch (error) {
      console.error('Error approving enrollment:', error)
      toast.error('Failed to approve enrollment')
    }
  }

  const handleRejectEnrollment = async (enrollmentId: string) => {
    try {
      await updateEnrollmentStatus(enrollmentId, 'rejected')
      toast.success('Enrollment rejected')
      loadData()
    } catch (error) {
      console.error('Error rejecting enrollment:', error)
      toast.error('Failed to reject enrollment')
    }
  }

  const handleViewStudent = (student: EnrichedStudent) => {
    setViewingStudent(student)
    setUserModalMode('view')
    setShowUserModal(true)
  }

  const handleEditStudent = (student: EnrichedStudent) => {
    setEditingStudent(student)
    setUserModalMode('edit')
    setShowUserModal(true)
  }

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSelectAllStudents = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)))
    } else {
      setSelectedStudents(new Set())
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    totalStudents: students.length,
    approvedStudents: students.filter((s) => s.enrollments.some((e) => e.status === 'approved'))
      .length,
    pendingApprovals: students.filter((s) => s.enrollments.some((e) => e.status === 'pending'))
      .length,
    totalBatches: batches.length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-6 lg:pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-6 lg:top-8 z-40 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link
                to="/dashboard/teacher"
                className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="h-16 w-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl"
              >
                <UserGroupIcon className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent"
                >
                  Student Management
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 mt-1"
                >
                  Manage student enrollments and track progress
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="space-y-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <UserGroupIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
                <div className="text-xs text-gray-600">Total Students</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{stats.approvedStudents}</div>
                <div className="text-xs text-gray-600">Approved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <XCircleIcon className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
                <div className="text-xs text-gray-600">Pending Approvals</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <QueueListIcon className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{stats.totalBatches}</div>
                <div className="text-xs text-gray-600">Your Batches</div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-8">
              {[
                { id: 'list', name: 'All Students', icon: UserGroupIcon },
                { id: 'by-batch', name: 'By Batch', icon: QueueListIcon },
                { id: 'pending', name: 'Pending Approvals', icon: XCircleIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'list' | 'by-batch' | 'pending')}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Batches</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {filteredStudents.length} of {students.length} students
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setCourseFilter('all')
                    setBatchFilter('all')
                    setStatusFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          {activeTab === 'list' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">All Students</h2>
                  <div className="flex gap-2">
                    {selectedStudents.size > 0 && (
                      <Button variant="outline" onClick={() => setShowBulkBatchModal(true)}>
                        <QueueListIcon className="h-4 w-4 mr-2" />
                        Assign to Batches ({selectedStudents.size})
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleSelectAllStudents(selectedStudents.size !== filteredStudents.length)
                      }
                    >
                      {selectedStudents.size === filteredStudents.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No students found matching your criteria.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => (
                      <Card key={student.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(student.id)}
                              onChange={() => handleSelectStudent(student.id)}
                              className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{student.full_name}</h3>
                              <p className="text-sm text-gray-600">{student.email}</p>
                              {student.student_id && (
                                <p className="text-xs text-gray-500">ID: {student.student_id}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 text-sm mb-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Enrollments:</span>
                              <span className="font-medium">{student.enrollments.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Batches:</span>
                              <span className="font-medium">{student.batches.length}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => handleViewStudent(student)}>
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStudent(student)}
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* By Batch View */}
          {activeTab === 'by-batch' && (
            <div className="flex flex-col gap-6">
              {batches.map((batch) => {
                const batchStudents = filteredStudents.filter((student) =>
                  student.batches.some((b) => b.batch_id === batch.id),
                )

                if (batchStudents.length === 0) return null

                return (
                  <Card key={batch.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <QueueListIcon className="h-6 w-6 text-orange-600" />
                          <div>
                            <h3 className="text-lg font-semibold">{batch.name}</h3>
                            <p className="text-sm text-gray-600">
                              {batch.gurukul?.name} • {batchStudents.length} students
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(batch.status)}>{batch.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {batchStudents.map((student) => (
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewStudent(student)}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Pending Approvals */}
          {activeTab === 'pending' && (
            <Card>
              <CardContent className="p-6">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No pending enrollment approvals.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {filteredStudents.map((student) => {
                      const pendingEnrollments = student.enrollments.filter(
                        (e) => e.status === 'pending',
                      )

                      return pendingEnrollments.map((enrollment) => {
                        const course = courses.find((c) => c.id === enrollment.course_id)

                        return (
                          <div
                            key={enrollment.id}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-medium">{student.full_name}</h3>
                                  <p className="text-sm text-gray-600">{student.email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <BookOpenIcon className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">{course?.title}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveEnrollment(enrollment.id)}
                                >
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleRejectEnrollment(enrollment.id)}
                                >
                                  <XCircleIcon className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* User Modal (View/Edit) */}
          {showUserModal && (viewingStudent || editingStudent) && (
            <UserFormModal
              isOpen={showUserModal}
              onClose={() => {
                setShowUserModal(false)
                setViewingStudent(null)
                setEditingStudent(null)
              }}
              onSuccess={() => {
                loadData()
              }}
              user={(viewingStudent || editingStudent) as unknown as Profile | undefined}
              mode={userModalMode}
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
        </div>
      </motion.div>
    </div>
  )
}
