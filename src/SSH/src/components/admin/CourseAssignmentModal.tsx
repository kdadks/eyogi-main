import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { XMarkIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { getBatchCourses, assignCourseToBatch, removeCourseFromBatch } from '../../lib/api/batches'
import { getCourses } from '../../lib/api/courses'
import { Batch, BatchCourse, Course } from '../../types'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'
import { useCourseAssignments } from '../../hooks/useCourseAssignments'
import { sanitizeHtml } from '../../utils/sanitize'
import { getLevelColor } from '../../lib/utils'

interface CourseAssignmentModalProps {
  batch: Batch
  onClose: () => void
  onSuccess: () => void
}

const CourseAssignmentModal: React.FC<CourseAssignmentModalProps> = ({
  batch,
  onClose,
  onSuccess,
}) => {
  const [assignedCourses, setAssignedCourses] = useState<BatchCourse[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  const { profile } = useSupabaseAuth()
  const courseAssignments = useCourseAssignments()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const batchCourses = await getBatchCourses(batch.id)
      setAssignedCourses(batchCourses)

      // If batch has a teacher assigned, only show courses assigned to that teacher
      let allCourses: Course[]
      if (batch.teacher_id) {
        allCourses = await courseAssignments.getTeacherCourses(batch.teacher_id)
      } else {
        const { courses } = await getCourses({ gurukul_id: batch.gurukul_id })
        allCourses = courses
      }

      // Filter out already assigned courses
      const assignedCourseIds = new Set(batchCourses.map((bc) => bc.course_id))
      const courses = allCourses.filter(
        (course) => course.is_active && !assignedCourseIds.has(course.id),
      )
      setAvailableCourses(courses)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch.id, batch.gurukul_id, batch.teacher_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    )
  }

  const handleAssignCourses = async () => {
    if (!profile || selectedCourses.length === 0) return

    setAssigning(true)
    try {
      // Assign each selected course
      await Promise.all(
        selectedCourses.map((courseId) => assignCourseToBatch(batch.id, courseId, profile.id)),
      )

      // Refresh data and clear selection
      await fetchData()
      setSelectedCourses([])
      onSuccess()
    } catch (error) {
      console.error('Error assigning courses:', error)
      alert('Failed to assign courses. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveCourse = async (courseId: string) => {
    if (!profile) return

    if (window.confirm('Are you sure you want to remove this course from the batch?')) {
      try {
        await removeCourseFromBatch(batch.id, courseId)
        await fetchData()
        onSuccess()
      } catch (error) {
        console.error('Error removing course:', error)
        alert('Failed to remove course. Please try again.')
      }
    }
  }

  const filteredAvailableCourses = availableCourses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_number.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-300">
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600">
          <div>
            <h2 className="text-xl font-semibold text-white">Manage Courses</h2>
            <p className="text-white/90">Batch: {batch.name}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Currently Assigned Courses */}
            <div>
              <h3 className="text-lg font-medium mb-4">
                Assigned Courses ({assignedCourses.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {assignedCourses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No courses assigned to this batch yet.
                  </div>
                ) : (
                  assignedCourses.map((batchCourse) => (
                    <div
                      key={batchCourse.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {batchCourse.course?.title || 'Unknown Course'}
                        </div>
                        <div
                          className="text-sm text-gray-600"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(batchCourse.course?.description || ''),
                          }}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            size="sm"
                            className={getLevelColor(batchCourse.course?.level || '')}
                          >
                            {batchCourse.course?.level}
                          </Badge>
                          <Badge size="sm" variant="outline">
                            {batchCourse.course?.duration_weeks} weeks
                          </Badge>
                          <Badge size="sm" variant="outline">
                            €{batchCourse.course?.price}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Assigned: {new Date(batchCourse.assigned_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCourse(batchCourse.course_id)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Available Courses */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  Available Courses ({filteredAvailableCourses.length})
                </h3>
                {selectedCourses.length > 0 && (
                  <Button
                    onClick={handleAssignCourses}
                    disabled={assigning}
                    className="flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>{assigning ? 'Assigning...' : `Assign ${selectedCourses.length}`}</span>
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAvailableCourses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm
                      ? 'No courses found matching your search.'
                      : 'No available courses to assign.'}
                  </div>
                ) : (
                  filteredAvailableCourses.map((course) => (
                    <div
                      key={course.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedCourses.includes(course.id)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCourseSelect(course.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.id)}
                        onChange={() => handleCourseSelect(course.id)}
                        className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{course.title}</div>
                        <div
                          className="text-sm text-gray-600 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }}
                        />
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          <Badge size="sm" className={getLevelColor(course.level)}>
                            {course.level}
                          </Badge>
                          <Badge size="sm" variant="outline">
                            {course.course_number}
                          </Badge>
                          <Badge size="sm" variant="outline">
                            {course.duration_weeks} weeks
                          </Badge>
                          <Badge size="sm" variant="outline">
                            €{course.price}
                          </Badge>
                          <Badge size="sm" variant="info">
                            Max: {course.max_students}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseAssignmentModal
