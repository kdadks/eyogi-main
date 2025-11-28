import React, { useState, useEffect } from 'react'
import { XMarkIcon, UserIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import { Badge } from '../ui/Badge'
import { getStudentEnrollments } from '../../lib/api/enrollments'
import { supabaseAdmin } from '../../lib/supabase'
import { decryptProfileFields } from '../../lib/encryption'

interface StudentTeachersModalProps {
  studentId: string
  studentName: string
  onClose: () => void
}

interface TeacherEnrollment {
  teacher_id: string
  teacher_name: string
  teacher_email: string
  teacher_code: string | null
  courses: {
    course_id: string
    course_title: string
    course_number: string
    enrollment_status: string
  }[]
}

const StudentTeachersModal: React.FC<StudentTeachersModalProps> = ({
  studentId,
  studentName,
  onClose,
}) => {
  const [teacherEnrollments, setTeacherEnrollments] = useState<TeacherEnrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeacherEnrollments = async () => {
      setLoading(true)
      try {
        // Get all enrollments for this student
        const enrollments = await getStudentEnrollments(studentId)

        // Get unique course IDs
        const courseIds = [...new Set(enrollments.map((e) => e.course_id))]

        if (courseIds.length === 0) {
          setTeacherEnrollments([])
          setLoading(false)
          return
        }

        // Get teacher assignments for these courses
        const { data: assignments } = await supabaseAdmin
          .from('course_assignments')
          .select('teacher_id, course_id')
          .in('course_id', courseIds)
          .eq('is_active', true)

        if (!assignments || assignments.length === 0) {
          setTeacherEnrollments([])
          setLoading(false)
          return
        }

        // Get unique teacher IDs
        const teacherIds = [...new Set(assignments.map((a) => a.teacher_id))]

        // Fetch teacher profiles
        const { data: teachers } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email, teacher_code')
          .in('id', teacherIds)
          .eq('role', 'teacher')

        if (!teachers) {
          setTeacherEnrollments([])
          setLoading(false)
          return
        }

        // Decrypt teacher profiles
        const decryptedTeachers = teachers.map((t) => decryptProfileFields(t))

        // Group courses by teacher
        const teacherMap = new Map<string, TeacherEnrollment>()

        assignments.forEach((assignment) => {
          const teacher = decryptedTeachers.find((t) => t.id === assignment.teacher_id)
          if (!teacher) return

          const enrollment = enrollments.find((e) => e.course_id === assignment.course_id)
          if (!enrollment || !enrollment.course) return

          if (!teacherMap.has(teacher.id)) {
            teacherMap.set(teacher.id, {
              teacher_id: teacher.id,
              teacher_name: teacher.full_name || 'Unknown Teacher',
              teacher_email: teacher.email || '',
              teacher_code: teacher.teacher_code || null,
              courses: [],
            })
          }

          const teacherEntry = teacherMap.get(teacher.id)!
          teacherEntry.courses.push({
            course_id: enrollment.course.id,
            course_title: enrollment.course.title || 'Unknown Course',
            course_number: enrollment.course.course_number || '',
            enrollment_status: enrollment.status,
          })
        })

        setTeacherEnrollments(Array.from(teacherMap.values()))
      } catch (error) {
        console.error('Error fetching teacher enrollments:', error)
        setTeacherEnrollments([])
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherEnrollments()
  }, [studentId])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center px-4 py-3 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold">Enrolled Teachers</h2>
            <p className="text-sm text-gray-600">Student: {studentName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : teacherEnrollments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserIcon className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No teachers assigned to this student's courses yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teacherEnrollments.map((teacherEnrollment) => (
                <div
                  key={teacherEnrollment.teacher_id}
                  className="border rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start mb-2">
                    <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {teacherEnrollment.teacher_name}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {teacherEnrollment.teacher_email}
                      </div>
                      {teacherEnrollment.teacher_code && (
                        <div className="text-xs text-gray-500 font-mono">
                          {teacherEnrollment.teacher_code}
                        </div>
                      )}
                    </div>
                    <Badge size="sm" variant="info" className="ml-2 flex-shrink-0">
                      {teacherEnrollment.courses.length}
                    </Badge>
                  </div>

                  <div className="ml-13 space-y-1.5">
                    {teacherEnrollment.courses.map((course) => (
                      <div
                        key={course.course_id}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs"
                      >
                        <div className="flex items-center flex-1 min-w-0 mr-2">
                          <BookOpenIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">
                              {course.course_title}
                            </div>
                            <div className="text-gray-500">{course.course_number}</div>
                          </div>
                        </div>
                        <Badge size="sm" className={getStatusColor(course.enrollment_status)}>
                          {course.enrollment_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end px-4 py-3 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md hover:from-orange-600 hover:to-red-600 transition-all shadow-sm hover:shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentTeachersModal
