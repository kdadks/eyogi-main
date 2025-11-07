import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { getCourses } from '../../lib/api/courses'
import { getGurukuls } from '../../lib/api/gurukuls'
import { assignCourseToTeacher } from '../../lib/api/courseAssignments'
import type { Course, Gurukul } from '../../types'
import toast from 'react-hot-toast'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'

interface BulkCourseAssignmentModalProps {
  teacherIds: string[]
  teacherNames: string[]
  onClose: () => void
  onSuccess: () => void
}

const BulkCourseAssignmentModal: React.FC<BulkCourseAssignmentModalProps> = ({
  teacherIds,
  teacherNames,
  onClose,
  onSuccess,
}) => {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [selectedGurukuls, setSelectedGurukuls] = useState<Set<string>>(new Set())
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const { profile } = useSupabaseAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Get all active courses and gurukuls
      const [allCourses, allGurukuls] = await Promise.all([getCourses({}), getGurukuls()])
      const activeCourses = allCourses.filter((course) => course.is_active)
      setAvailableCourses(activeCourses)
      setGurukuls(allGurukuls)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load courses and gurukuls')
    } finally {
      setLoading(false)
    }
  }

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    )
  }

  const handleGurukulSelect = (gurukulId: string) => {
    const isSelected = selectedGurukuls.has(gurukulId)
    const gurukulCourses = availableCourses
      .filter((course) => course.gurukul_id === gurukulId)
      .map((course) => course.id)

    if (isSelected) {
      // Deselect gurukul and its courses
      setSelectedGurukuls((prev) => {
        const next = new Set(prev)
        next.delete(gurukulId)
        return next
      })
      setSelectedCourses((prev) => prev.filter((id) => !gurukulCourses.includes(id)))
    } else {
      // Select gurukul and all its courses
      setSelectedGurukuls((prev) => new Set(prev).add(gurukulId))
      setSelectedCourses((prev) => {
        const newSelection = [...prev]
        gurukulCourses.forEach((courseId) => {
          if (!newSelection.includes(courseId)) {
            newSelection.push(courseId)
          }
        })
        return newSelection
      })
    }
  }

  const handleAssignCourses = async () => {
    if (teacherIds.length === 0 || selectedCourses.length === 0 || !profile?.id) return

    setAssigning(true)
    try {
      // Assign each course to each selected teacher
      const assignments = selectedCourses.flatMap((courseId) =>
        teacherIds.map((teacherId) => ({
          courseId,
          teacherId,
          promise: assignCourseToTeacher(courseId, teacherId, profile.id).catch((err) => {
            console.error(`Failed to assign course ${courseId} to teacher ${teacherId}:`, {
              error: err,
              message: err?.message,
              code: err?.code,
              details: err?.details,
            })
            return { error: err, courseId, teacherId }
          }),
        })),
      )

      const results = await Promise.all(assignments.map((a) => a.promise))

      // Count successes and failures
      const failures = results.filter((r) => r && 'error' in r)
      const successes = results.length - failures.length

      if (failures.length > 0) {
        console.error('Assignment failures:', failures)
        toast.error(
          `Assigned ${successes} course(s) successfully, but ${failures.length} failed. Some courses may already be assigned.`,
        )
      } else {
        toast.success(
          `Successfully assigned ${selectedCourses.length} course(s) to ${teacherIds.length} teacher(s)`,
        )
      }

      setSelectedCourses([])
      setSelectedGurukuls(new Set())
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error assigning courses:', {
        error,
        message: (error as Error)?.message,
        stack: (error as Error)?.stack,
      })
      toast.error('Failed to assign courses. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const filteredCourses = availableCourses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      course.course_number.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="animate-pulse flex flex-col gap-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="flex flex-col gap-2">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Assign Courses to Teachers</h2>
            <p className="text-gray-600 text-sm">
              Assigning courses to {teacherIds.length} teacher{teacherIds.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Selected Teachers List */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Teachers:</h3>
            <div className="flex flex-wrap gap-2">
              {teacherNames.map((name, index) => (
                <Badge key={index} className="bg-blue-100 text-blue-800">
                  {name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Search Courses */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses by title, number, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Gurukul Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Select by Gurukul (optional):
            </h3>
            <div className="flex flex-wrap gap-2">
              {gurukuls.map((gurukul) => {
                const gurukulCourseCount = availableCourses.filter(
                  (c) => c.gurukul_id === gurukul.id,
                ).length
                const isSelected = selectedGurukuls.has(gurukul.id)
                return (
                  <button
                    key={gurukul.id}
                    onClick={() => handleGurukulSelect(gurukul.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {gurukul.name} ({gurukulCourseCount})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Course Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Available Courses ({filteredCourses.length}):
            </h3>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredCourses.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No courses found</div>
              ) : (
                filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => handleCourseSelect(course.id)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCourses.includes(course.id) ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course.id)}
                            onChange={() => handleCourseSelect(course.id)}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <h4 className="font-medium text-gray-900">{course.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 ml-6">
                          {course.course_number} • {course.level}
                        </p>
                        {course.description && (
                          <div
                            className="text-sm text-gray-500 ml-6 mt-1 line-clamp-2 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: course.description }}
                          />
                        )}
                        {course.teacher_id && (
                          <p className="text-xs text-amber-600 ml-6 mt-1">
                            ⚠️ Already assigned to another teacher
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Courses Count */}
          {selectedCourses.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedCourses.length}</strong> course
                {selectedCourses.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={assigning}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignCourses}
            disabled={selectedCourses.length === 0 || assigning}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {assigning ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Assigning...
              </>
            ) : (
              `Assign ${selectedCourses.length} Course${selectedCourses.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BulkCourseAssignmentModal
