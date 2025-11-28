import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createBatch, updateBatch, assignCourseToBatch } from '../../lib/api/batches'
import { getAllUsers } from '../../lib/api/users'
import { getCourses, getTeacherCourses } from '../../lib/api/courses'
import { Batch, Gurukul, User, Course } from '../../types'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'

interface BatchModalProps {
  batch?: Batch | null
  gurukuls: Gurukul[]
  onClose: () => void
  onSuccess: () => void
}

const BatchModal: React.FC<BatchModalProps> = ({ batch, gurukuls, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<{
    name: string
    description: string
    gurukul_id: string
    teacher_id: string // References profiles.id (UUID)
    start_date: string
    end_date: string
    max_students: string
    status: 'not_started' | 'active' | 'in_progress' | 'completed' | 'archived'
  }>({
    name: '',
    description: '',
    gurukul_id: '',
    teacher_id: '',
    start_date: '',
    end_date: '',
    max_students: '',
    status: 'not_started',
  })
  const [assignmentType, setAssignmentType] = useState<'gurukul' | 'course'>('gurukul')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [teachers, setTeachers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { profile } = useSupabaseAuth()

  useEffect(() => {
    fetchTeachers()
    fetchCourses()
    if (batch) {
      setFormData({
        name: batch.name,
        description: batch.description || '',
        gurukul_id: batch.gurukul_id,
        teacher_id: batch.teacher_id || '',
        start_date: batch.start_date ? batch.start_date.split('T')[0] : '',
        end_date: batch.end_date ? batch.end_date.split('T')[0] : '',
        max_students: batch.max_students?.toString() || '',
        status: batch.status || 'not_started',
      })
    } else if (profile?.role === 'teacher' && profile?.id) {
      // Auto-set teacher_id to current user if they are a teacher
      setFormData((prev) => ({ ...prev, teacher_id: profile.id }))
    }
  }, [batch, profile])

  const fetchTeachers = async () => {
    try {
      const users = await getAllUsers()
      const teacherList = users.filter((user) => user.role === 'teacher')
      setTeachers(teacherList)
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const fetchCourses = async () => {
    try {
      // If current user is a teacher, only show courses assigned to them
      if (profile?.role === 'teacher' && profile?.id) {
        const courseList = await getTeacherCourses(profile.id)
        setCourses(courseList)
      } else {
        // Admins can see all courses
        const courseList = await getCourses()
        setCourses(courseList)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Batch name is required'
    }

    if (assignmentType === 'gurukul' && !formData.gurukul_id) {
      newErrors.gurukul_id = 'Gurukul is required'
    }

    if (assignmentType === 'course' && !selectedCourseId) {
      newErrors.course_id = 'Course is required'
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date'
      }
    }

    if (formData.max_students && parseInt(formData.max_students) <= 0) {
      newErrors.max_students = 'Max students must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !profile) return

    setLoading(true)
    try {
      // For course-based batches, we need the gurukul_id from the selected course
      let gurukulId = formData.gurukul_id
      if (assignmentType === 'course' && selectedCourseId) {
        const selectedCourse = courses.find((course) => course.id === selectedCourseId)
        gurukulId = selectedCourse?.gurukul_id || ''
      }

      const batchData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        gurukul_id: gurukulId,
        teacher_id: formData.teacher_id || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        max_students: formData.max_students ? parseInt(formData.max_students) : null,
        status: formData.status,
        created_by: profile.id,
        is_active: true,
      }

      let savedBatch
      if (batch) {
        savedBatch = await updateBatch(batch.id, batchData)
      } else {
        savedBatch = await createBatch(batchData)
      }

      // If this is a course-based batch, automatically assign the course
      if (assignmentType === 'course' && selectedCourseId && savedBatch) {
        await assignCourseToBatch(savedBatch.id, selectedCourseId, profile.id)
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving batch:', error)
      alert('Failed to save batch. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">{batch ? 'Edit Batch' : 'Create New Batch'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Assignment Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Batch Assignment Type *
            </label>
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="gurukul"
                  checked={assignmentType === 'gurukul'}
                  onChange={(e) => setAssignmentType(e.target.value as 'gurukul' | 'course')}
                  className="mr-2"
                />
                <span>Gurukul-based (Traditional)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="course"
                  checked={assignmentType === 'course'}
                  onChange={(e) => setAssignmentType(e.target.value as 'gurukul' | 'course')}
                  className="mr-2"
                />
                <span>Course-based (Specific Course)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-2.5 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter batch name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {assignmentType === 'gurukul' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gurukul *</label>
                <select
                  name="gurukul_id"
                  value={formData.gurukul_id}
                  onChange={handleInputChange}
                  className={`w-full px-2.5 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.gurukul_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a gurukul</option>
                  {gurukuls.map((gurukul) => (
                    <option key={gurukul.id} value={gurukul.id}>
                      {gurukul.name}
                    </option>
                  ))}
                </select>
                {errors.gurukul_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.gurukul_id}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.course_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.gurukul?.name})
                    </option>
                  ))}
                </select>
                {errors.course_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.course_id}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
              <select
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleInputChange}
                disabled={profile?.role === 'teacher'}
                className={`w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  profile?.role === 'teacher' ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select a teacher (optional)</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className={`w-full px-2.5 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.end_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
              <input
                type="number"
                name="max_students"
                value={formData.max_students}
                onChange={handleInputChange}
                className={`w-full px-2.5 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.max_students ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter maximum number of students"
                min="1"
              />
              {errors.max_students && (
                <p className="text-red-500 text-sm mt-1">{errors.max_students}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter batch description (optional)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[100px]">
              {loading ? 'Saving...' : batch ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BatchModal
