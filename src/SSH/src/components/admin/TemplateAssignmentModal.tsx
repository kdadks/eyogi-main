import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'

import { CertificateTemplate } from '@/types'
import {
  createCertificateAssignment,
  getAvailableGurukuls,
  getAvailableCourses,
  getAvailableTeachers,
  type CreateCertificateAssignmentData,
} from '@/lib/api/certificateAssignments'
import toast from 'react-hot-toast'
import {
  XMarkIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
interface TemplateAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  templates: CertificateTemplate[]
  userId: string
}
interface Gurukul {
  id: string
  name: string
  status: string
}
interface Course {
  id: string
  title: string
  gurukul_id: string
  status: string
}
interface Teacher {
  id: string
  name: string
  email: string
  status: string
}
export default function TemplateAssignmentModal({
  isOpen,
  onClose,
  onSave,
  templates,
  userId,
}: TemplateAssignmentModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [assignmentType, setAssignmentType] = useState<'gurukul' | 'course' | 'teacher'>('course')
  const [selectedGurukul, setSelectedGurukul] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const loadData = async () => {
    setLoading(true)
    try {
      const [gurukulData, courseData, teacherData] = await Promise.all([
        getAvailableGurukuls(),
        getAvailableCourses(),
        getAvailableTeachers(),
      ])
      setGurukuls(gurukulData)
      setCourses(courseData)
      setTeachers(teacherData)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }
  const loadCourses = useCallback(async () => {
    try {
      const courseData = await getAvailableCourses(selectedGurukul)
      setCourses(courseData)
      setSelectedCourse('') // Reset course selection when gurukul changes
    } catch {
      toast.error('Failed to load courses')
    }
  }, [selectedGurukul])
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])
  useEffect(() => {
    if (assignmentType === 'course' && selectedGurukul) {
      loadCourses()
    }
  }, [selectedGurukul, assignmentType, loadCourses])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) {
      toast.error('Please select a template')
      return
    }
    if (assignmentType === 'gurukul' && !selectedGurukul) {
      toast.error('Please select a gurukul')
      return
    }
    if (assignmentType === 'course' && !selectedCourse) {
      toast.error('Please select a course')
      return
    }
    if (assignmentType === 'teacher' && !selectedTeacher) {
      toast.error('Please select a teacher')
      return
    }
    setSaving(true)
    try {
      const assignmentData: CreateCertificateAssignmentData = {
        template_id: selectedTemplate,
        gurukul_id: assignmentType === 'gurukul' ? selectedGurukul : undefined,
        course_id: assignmentType === 'course' ? selectedCourse : undefined,
        teacher_id: assignmentType === 'teacher' ? selectedTeacher : undefined,
      }
      // Ensure we don't send both gurukul_id and course_id
      if (assignmentType === 'gurukul') {
        delete assignmentData.course_id
      } else if (assignmentType === 'course') {
        delete assignmentData.gurukul_id
      }
      // Assignment data prepared for creation
      await createCertificateAssignment(assignmentData, userId)
      toast.success('Template assigned successfully')
      onSave()
      handleClose()
    } catch {
      toast.error('Failed to assign template')
    } finally {
      setSaving(false)
    }
  }
  const handleClose = () => {
    setSelectedTemplate('')
    setAssignmentType('course')
    setSelectedGurukul('')
    setSelectedCourse('')
    setSelectedTeacher('')
    onClose()
  }
  // Reset course when gurukul changes and assignment type is gurukul
  const handleGurukulChange = (gurukulId: string) => {
    setSelectedGurukul(gurukulId)
    if (assignmentType === 'gurukul') {
      setSelectedCourse('') // Clear course for gurukul assignments
    }
  }
  if (!isOpen) return null
  const filteredCourses = courses.filter((course) =>
    assignmentType === 'course' ? course.gurukul_id === selectedGurukul : true,
  )
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Assign Template</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate Template *
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="">Select Template</option>
              {templates
                .filter((t) => t.is_active)
                .map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
            </select>
          </div>
          {/* Assignment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('gurukul')
                  setSelectedCourse('') // Reset course when switching to gurukul
                  setSelectedTeacher('') // Reset teacher when switching
                }}
                className={`flex items-center justify-center gap-2 p-3 border rounded-md ${
                  assignmentType === 'gurukul'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BuildingOfficeIcon className="h-5 w-5" />
                Gurukul
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('course')
                  setSelectedTeacher('') // Reset teacher when switching
                  // Don't reset gurukul when switching to course, as course needs gurukul selection
                }}
                className={`flex items-center justify-center gap-2 p-3 border rounded-md ${
                  assignmentType === 'course'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <AcademicCapIcon className="h-5 w-5" />
                Course
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('teacher')
                  setSelectedGurukul('') // Reset gurukul when switching
                  setSelectedCourse('') // Reset course when switching
                }}
                className={`flex items-center justify-center gap-2 p-3 border rounded-md ${
                  assignmentType === 'teacher'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UserIcon className="h-5 w-5" />
                Teacher
              </button>
            </div>
          </div>
          {/* Gurukul Selection (only for gurukul and course assignments) */}
          {(assignmentType === 'gurukul' || assignmentType === 'course') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gurukul *</label>
              <select
                value={selectedGurukul}
                onChange={(e) => handleGurukulChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                required
                disabled={loading}
              >
                <option value="">Select Gurukul</option>
                {gurukuls.map((gurukul) => (
                  <option key={gurukul.id} value={gurukul.id}>
                    {gurukul.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Course Selection (only for course assignments) */}
          {assignmentType === 'course' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                required
                disabled={loading || !selectedGurukul}
              >
                <option value="">Select Course</option>
                {filteredCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              {selectedGurukul && filteredCourses.length === 0 && !loading && (
                <p className="text-sm text-gray-500 mt-1">No courses available for this gurukul</p>
              )}
            </div>
          )}
          {/* Teacher Selection (only for teacher assignments) */}
          {assignmentType === 'teacher' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teacher *</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                required
                disabled={loading}
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
              {teachers.length === 0 && !loading && (
                <p className="text-sm text-gray-500 mt-1">No teachers available</p>
              )}
            </div>
          )}
          {/* Assignment Scope Info */}
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Assignment Scope</h3>
                <div className="text-sm text-blue-700 mt-1">
                  {assignmentType === 'gurukul' ? (
                    <p>
                      Template will be available to all teachers in the selected gurukul for any
                      course.
                    </p>
                  ) : assignmentType === 'course' ? (
                    <p>
                      Template will be available only to teachers assigned to the selected course.
                    </p>
                  ) : (
                    <p>
                      Template will be directly assigned to the selected teacher for all their
                      courses.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="danger"
              onClick={handleClose}
              className="flex-1"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving || loading}>
              {saving ? 'Assigning...' : 'Assign Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
