import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CertificateTemplate } from '@/types'
import {
  createCertificateAssignment,
  getAvailableGurukuls,
  getAvailableCourses,
  type CreateCertificateAssignmentData
} from '@/lib/api/certificateAssignments'
import toast from 'react-hot-toast'
import {
  XMarkIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'
interface TemplateAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  templates: CertificateTemplate[]
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
export default function TemplateAssignmentModal({
  isOpen,
  onClose,
  onSave,
  templates
}: TemplateAssignmentModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [assignmentType, setAssignmentType] = useState<'gurukul' | 'course'>('course')
  const [selectedGurukul, setSelectedGurukul] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])
  useEffect(() => {
    if (assignmentType === 'course' && selectedGurukul) {
      loadCourses()
    }
  }, [selectedGurukul, assignmentType])
  const loadData = async () => {
    setLoading(true)
    try {
      const [gurukulData, courseData] = await Promise.all([
        getAvailableGurukuls(),
        getAvailableCourses()
      ])
      setGurukuls(gurukulData)
      setCourses(courseData)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }
  const loadCourses = async () => {
    try {
      const courseData = await getAvailableCourses(selectedGurukul)
      setCourses(courseData)
      setSelectedCourse('') // Reset course selection when gurukul changes
    } catch (error) {
      toast.error('Failed to load courses')
    }
  }
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
    setSaving(true)
    try {
      const assignmentData: CreateCertificateAssignmentData = {
        template_id: selectedTemplate,
        gurukul_id: assignmentType === 'gurukul' ? selectedGurukul : undefined,
        course_id: assignmentType === 'course' ? selectedCourse : undefined,
      }
      // Ensure we don't send both gurukul_id and course_id
      if (assignmentType === 'gurukul') {
        delete assignmentData.course_id
      } else if (assignmentType === 'course') {
        delete assignmentData.gurukul_id
      }
      console.log('Assignment Modal - Sending data:', {
        assignmentType,
        selectedTemplate,
        selectedGurukul,
        selectedCourse,
        assignmentData,
        debug: {
          isGurukulType: assignmentType === 'gurukul',
          isCourseType: assignmentType === 'course',
          hasGurukul: !!selectedGurukul,
          hasCourse: !!selectedCourse
        }
      })
      await createCertificateAssignment(assignmentData)
      toast.success('Template assigned successfully')
      onSave()
      handleClose()
    } catch (error) {
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
  const filteredCourses = courses.filter(course =>
    assignmentType === 'course' ? course.gurukul_id === selectedGurukul : true
  )
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Assign Template</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
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
              {templates.filter(t => t.is_active).map((template) => (
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
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('gurukul')
                  setSelectedCourse('') // Reset course when switching to gurukul
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
            </div>
          </div>
          {/* Gurukul Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gurukul *
            </label>
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
          {/* Course Selection (only for course assignments) */}
          {assignmentType === 'course' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course *
              </label>
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
                <p className="text-sm text-gray-500 mt-1">
                  No courses available for this gurukul
                </p>
              )}
            </div>
          )}
          {/* Assignment Scope Info */}
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Assignment Scope
                </h3>
                <div className="text-sm text-blue-700 mt-1">
                  {assignmentType === 'gurukul' ? (
                    <p>Template will be available to all teachers in the selected gurukul for any course.</p>
                  ) : (
                    <p>Template will be available only to teachers assigned to the selected course.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || loading}
            >
              {saving ? 'Assigning...' : 'Assign Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
