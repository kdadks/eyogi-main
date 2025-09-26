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
      setTeachers(teachersData.data || [])
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Assign Teacher to Course</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
              {teachers.map((teacher) => {
                // Use teacher_id if available, otherwise use the profile id (will be converted to proper teacher_id later)
                const teacherId = teacher.teacher_id || teacher.id
                // Teacher option prepared
                return (
                  <option key={teacher.id} value={teacherId}>
                    {teacher.full_name} ({teacher.email})
                  </option>
                )
              })}
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
            <Button variant="outline" onClick={onClose} className="flex-1">
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
  const { assignments, loading, assignTeacherToCourse, removeAssignment } = useCourseAssignments()
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
    if (window.confirm('Are you sure you want to remove this assignment?')) {
      await removeAssignment(assignmentId)
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Assignments</h1>
          <p className="text-gray-600">Manage teacher assignments to courses</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>New Assignment</span>
        </Button>
      </div>
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
      </div>
      <div className="grid gap-4">
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
          filteredAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {assignment.course?.title}
                        </h3>
                        <Badge variant="outline">{assignment.course?.course_number}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Teacher: {assignment.teacher?.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                      </p>
                      {assignment.notes && (
                        <p className="text-sm text-gray-600 mt-1">Notes: {assignment.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800" size="sm">
                      Active
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAssignment(assignment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <AssignmentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAssign={handleAssign}
      />
    </div>
  )
}
export default CourseAssignmentManagement
