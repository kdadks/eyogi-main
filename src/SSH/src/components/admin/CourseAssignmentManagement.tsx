import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { supabaseAdmin } from '../../lib/supabase'
import { useCourseAssignments } from '../../hooks/useCourseAssignments'
import { usePermissions } from '../../hooks/usePermissions'
import { Course, User } from '../../types'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { decryptProfileFields } from '../../lib/encryption'
import { useRefresh } from '../../contexts/RefreshContext'
import {
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  BookOpenIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
interface AssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (teacherId: string, courseId: string, notes?: string) => Promise<boolean>
}
const AssignmentModal: React.FC<AssignmentModalProps> = ({ isOpen, onClose, onAssign }) => {
  const [teachers, setTeachers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])
  const loadData = async () => {
    try {
      const [teachersData, coursesData] = await Promise.all([
        supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('role', 'teacher')
          .eq('status', 'active')
          .order('full_name'),
        supabaseAdmin.from('courses').select('*').eq('is_active', true).order('title'),
      ])
      const decryptedTeachers = (teachersData.data || []).map((teacher) =>
        decryptProfileFields(teacher),
      )
      setTeachers(decryptedTeachers)
      setCourses(coursesData.data || [])
    } catch {
      toast.error('Failed to load teachers and courses')
    }
  }
  const handleSubmit = async () => {
    if (!selectedTeacher || !selectedCourse) {
      toast.error('Please select both teacher and course')
      return
    }
    setLoading(true)
    const success = await onAssign(selectedTeacher, selectedCourse, notes)
    if (success) {
      setSelectedTeacher('')
      setSelectedCourse('')
      setNotes('')
      onClose()
    }
    setLoading(false)
  }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-300">
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-600 -m-6 mb-4 p-6 rounded-t-lg">
          <h3 className="text-lg font-semibold text-white">Assign Teacher to Course</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} ({teacher.email})
                  {teacher.teacher_code ? ` - ${teacher.teacher_code}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.course_number})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Assignment notes or comments"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Assigning...' : 'Assign'}
            </Button>
            <Button variant="danger" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
const CourseAssignmentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
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
  const { refreshKey } = useRefresh()
  const { assignments, loading, assignTeacherToCourse, removeAssignment } = useCourseAssignments(
    undefined,
    refreshKey,
  )
  const { currentUser } = usePermissions()
  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.course?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.teacher?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course?.course_number.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  const handleAssign = async (teacherId: string, courseId: string, notes?: string) => {
    if (!currentUser?.id) {
      toast.error('Unable to identify current user')
      return false
    }
    return await assignTeacherToCourse(teacherId, courseId, currentUser.id, notes)
  }
  const handleRemoveAssignment = async (assignmentId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Assignment',
      message: 'Are you sure you want to remove this assignment?',
      onConfirm: async () => {
        await removeAssignment(assignmentId)
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
      },
    })
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>New Assignment</span>
        </Button>
      </div>
      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'No assignments match your search.'
                : 'Start by creating your first course assignment.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course Number
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <BookOpenIcon className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {assignment.course?.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                      {assignment.course?.course_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{assignment.teacher?.full_name}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {assignment.notes || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge className="bg-green-100 text-green-800" size="sm">
                      Active
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAssignment(assignment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-0"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AssignmentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAssign={handleAssign}
      />
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        variant="danger"
      />
    </div>
  )
}
export default CourseAssignmentManagement
