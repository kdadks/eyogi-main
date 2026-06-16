import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useRefresh } from '../../contexts/RefreshContext'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { getAllTeachers } from '../../lib/api/users'
import { supabaseAdmin } from '../../lib/supabase'
import type { Database } from '../../types/database'
import type { Course } from '../../types'
import type { ComplianceStats } from '../../types/compliance'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Badge } from '../ui/Badge'
import toast from 'react-hot-toast'
import BulkCourseAssignmentModal from './BulkCourseAssignmentModal'

type Profile = Database['public']['Tables']['profiles']['Row']

interface TeacherWithStats {
  id: string
  email: string
  full_name: string
  teacher_code?: string | null
  role: Profile['role']
  created_at: string
  complianceStats?: ComplianceStats
  assignedCourses?: Course[]
}

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<TeacherWithStats[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'compliant' | 'pending'>('all')
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set())
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const { refreshKey } = useRefresh()

  useEffect(() => {
    loadTeachers()
  }, [refreshKey])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachers, searchTerm, complianceFilter])

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const teacherData = await getAllTeachers()

      if (teacherData.length === 0) {
        setTeachers([])
        return
      }

      // Get all teacher profile IDs
      const userIds = teacherData.map((t) => t.id)

      // Fetch all data in parallel with batch queries

      const [allCourseAssignments, allComplianceItems, allSubmissions] = await Promise.all([
        // Get all course assignments for all teachers at once
        // Note: course_assignments.teacher_id now references profiles.id
        supabaseAdmin
          .from('course_assignments')
          .select('*, courses(*)')
          .in('teacher_id', userIds)
          .eq('is_active', true)
          .then((res: { data: any[] | null }) => res.data || []),

        // Get all compliance items for teachers
        supabaseAdmin
          .from('compliance_items')
          .select('*')
          .eq('target_role', 'teacher')
          .eq('is_active', true)
          .then((res: { data: any[] | null }) => res.data || []),

        // Get all compliance submissions for all teachers
        supabaseAdmin
          .from('compliance_submissions')
          .select('*')
          .in('user_id', userIds)
          .then((res: { data: any[] | null }) => res.data || []),
      ])

      // Create lookup maps
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assignmentsByTeacherId = new Map<string, any[]>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allCourseAssignments.forEach((assignment: any) => {
        const existing = assignmentsByTeacherId.get(assignment.teacher_id) || []
        assignmentsByTeacherId.set(assignment.teacher_id, [...existing, assignment])
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const submissionsByUserId = new Map<string, any[]>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allSubmissions.forEach((submission: any) => {
        const existing = submissionsByUserId.get(submission.user_id) || []
        submissionsByUserId.set(submission.user_id, [...existing, submission])
      })

      // Calculate stats for each teacher
      const teachersWithStats = teacherData.map((teacher) => {
        // Get teacher's assignments by profile ID
        const assignments = assignmentsByTeacherId.get(teacher.id) || []

        const courses = assignments.map((a: any) => a.courses).filter(Boolean) as Course[]

        // Calculate compliance stats
        const totalItems = allComplianceItems.length
        const userSubmissions = submissionsByUserId.get(teacher.id) || []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const completedItems = userSubmissions.filter((s: any) => s.status === 'approved').length

        const pendingItems = userSubmissions.filter(
          (s: any) => s.status === 'pending' || s.status === 'submitted' || s.status === 'rejected',
        ).length
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const overdueItems = allComplianceItems.filter((item: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const submission = userSubmissions.find((s: any) => s.compliance_item_id === item.id)
          return (
            item.due_date &&
            new Date(item.due_date) < new Date() &&
            submission?.status !== 'approved'
          )
        }).length

        const complianceStats = {
          total_items: totalItems,
          completed_items: completedItems,
          pending_items: pendingItems,
          overdue_items: overdueItems,
          completion_percentage:
            totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        }

        return {
          ...teacher,
          complianceStats,
          assignedCourses: courses,
        }
      })

      setTeachers(teachersWithStats)
    } catch (error) {
      console.error('Error loading teachers:', error)
      toast.error('Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...teachers]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (teacher) =>
          teacher.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Compliance filter
    if (complianceFilter !== 'all') {
      filtered = filtered.filter((teacher) => {
        if (!teacher.complianceStats) return complianceFilter === 'pending'
        const isCompliant =
          teacher.complianceStats.completed_items === teacher.complianceStats.total_items
        return complianceFilter === 'compliant' ? isCompliant : !isCompliant
      })
    }

    // Sort alphabetically by full name
    filtered.sort((a, b) => {
      const nameA = (a.full_name || a.email || '').toLowerCase()
      const nameB = (b.full_name || b.email || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })

    setFilteredTeachers(filtered)
  }

  const handleSelectTeacher = (teacherId: string) => {
    const newSelection = new Set(selectedTeachers)
    if (newSelection.has(teacherId)) {
      newSelection.delete(teacherId)
    } else {
      newSelection.add(teacherId)
    }
    setSelectedTeachers(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedTeachers.size === filteredTeachers.length) {
      setSelectedTeachers(new Set())
    } else {
      setSelectedTeachers(new Set(filteredTeachers.map((t) => t.id)))
    }
  }

  const getComplianceStatus = (stats?: ComplianceStats) => {
    if (!stats || stats.total_items === 0) {
      return { label: 'Not Started', color: 'bg-gray-100 text-gray-800', icon: ClockIcon }
    }
    const percentage = (stats.completed_items / stats.total_items) * 100
    if (percentage === 100) {
      return { label: 'Done', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon }
    }
    if (percentage > 0) {
      return {
        label: `${Math.round(percentage)}% Complete`,
        color: 'bg-yellow-100 text-yellow-800',
        icon: ClockIcon,
      }
    }
    return { label: 'Pending', color: 'bg-red-100 text-red-800', icon: XCircleIcon }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Teachers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{teachers.length}</p>
              </div>
              <UserIcon className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliant</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {
                    teachers.filter(
                      (t) =>
                        t.complianceStats &&
                        t.complianceStats.completed_items === t.complianceStats.total_items,
                    ).length
                  }
                </p>
              </div>
              <CheckCircleIcon className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Compliance</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {
                    teachers.filter(
                      (t) =>
                        !t.complianceStats ||
                        t.complianceStats.completed_items < t.complianceStats.total_items,
                    ).length
                  }
                </p>
              </div>
              <ClockIcon className="h-12 w-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Courses</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {teachers.reduce((sum, t) => sum + (t.assignedCourses?.length || 0), 0)}
                </p>
              </div>
              <AcademicCapIcon className="h-12 w-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Compliance Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={complianceFilter}
                onChange={(e) =>
                  setComplianceFilter(e.target.value as 'all' | 'compliant' | 'pending')
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="compliant">Compliant</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Bulk Assignment Button */}
            <Button
              onClick={() => setShowAssignmentModal(true)}
              disabled={selectedTeachers.size === 0}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <UserPlusIcon className="h-5 w-5" />
              Assign Courses ({selectedTeachers.size})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">
              Teachers ({filteredTeachers.length})
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  filteredTeachers.length > 0 &&
                  filteredTeachers.every((t) => selectedTeachers.has(t.id))
                }
                onChange={handleSelectAll}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">Select All</span>
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || complianceFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No teachers have been added yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compliance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTeachers.map((teacher) => {
                    const complianceStatus = getComplianceStatus(teacher.complianceStats)
                    const StatusIcon = complianceStatus.icon

                    return (
                      <tr key={teacher.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={selectedTeachers.has(teacher.id)}
                              onChange={() => handleSelectTeacher(teacher.id)}
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <div>
                              <Link
                                to={`/admin/teachers/${teacher.id}`}
                                className="text-sm font-medium text-gray-900 hover:text-orange-600"
                              >
                                {teacher.full_name || 'Unnamed Teacher'}
                              </Link>
                              <div className="text-sm text-gray-500">{teacher.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={complianceStatus.color}>
                            <StatusIcon className="h-4 w-4 mr-1 inline" />
                            {complianceStatus.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {teacher.assignedCourses?.length || 0} course
                            {teacher.assignedCourses?.length !== 1 ? 's' : ''}
                          </div>
                          {teacher.assignedCourses && teacher.assignedCourses.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {teacher.assignedCourses.map((c) => c.course_number).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <Link
                            to={`/admin/teachers/${teacher.id}`}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Course Assignment Modal */}
      {showAssignmentModal && (
        <BulkCourseAssignmentModal
          teacherIds={teachers
            .filter((t) => selectedTeachers.has(t.id))
            .map((t) => t.id) // Use profile id, not teacher_code
            .filter((id): id is string => id !== null && id !== undefined)}
          teacherNames={teachers
            .filter((t) => selectedTeachers.has(t.id))
            .map((t) => t.full_name || t.email)}
          onClose={() => setShowAssignmentModal(false)}
          onSuccess={() => {
            setSelectedTeachers(new Set())
            loadTeachers()
          }}
        />
      )}
    </div>
  )
}
