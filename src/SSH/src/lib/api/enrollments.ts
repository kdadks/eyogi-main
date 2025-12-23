import { supabaseAdmin } from '../supabase'
import { Enrollment } from '../../types'
import { checkCoursePrerequisites } from './prerequisites'
import { queryCache, CACHE_DURATIONS, createCacheKey } from '../cache'
import { decryptProfileFields } from '../encryption'
import { sendEnrollmentSubmissionEmail, sendEnrollmentStatusEmail } from '../enrollment-email'
import {
  sendParentEnrollmentConfirmation,
  sendAdminEnrollmentNotification,
} from '../parent-child-email'
export async function enrollInCourse(courseId: string, studentId: string): Promise<Enrollment> {
  try {
    // Check student status - only active students can enroll
    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('status, parent_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      throw new Error('Failed to fetch student details')
    }

    if (student.status !== 'active') {
      throw new Error(
        'Only active accounts can enroll in courses. Please wait for your account to be verified.',
      )
    }

    // Check prerequisites before enrollment
    const prerequisiteCheck = await checkCoursePrerequisites(courseId, studentId)
    if (!prerequisiteCheck.canEnroll) {
      throw new Error(`Cannot enroll: ${prerequisiteCheck.message}`)
    }
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .insert({
        id: crypto.randomUUID(),
        course_id: courseId,
        student_id: studentId,
        status: 'pending',
        enrolled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      throw new Error('Failed to enroll in course')
    }

    // Use the student data we already fetched above
    if (student.parent_id) {
      // Parent-initiated enrollment: send confirmation to parent
      sendParentEnrollmentConfirmation(data.id, student.parent_id).catch((err) =>
        console.error('Failed to send parent enrollment confirmation:', err),
      )
    } else {
      // Direct student enrollment: send submission email to student
      sendEnrollmentSubmissionEmail(data.id).catch((err) =>
        console.error('Failed to send enrollment submission email:', err),
      )
    }

    // Always send admin notification about new enrollment
    sendAdminEnrollmentNotification(data.id)
      .then((success) => {
        if (success) {
          console.log('✅ Admin enrollment notification sent successfully for enrollment:', data.id)
        } else {
          console.error(
            '❌ Admin enrollment notification failed (returned false) for enrollment:',
            data.id,
          )
        }
      })
      .catch((err) => {
        console.error('❌ Failed to send admin enrollment notification:', {
          enrollmentId: data.id,
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
        })
      })

    // Invalidate enrollment caches
    queryCache.invalidatePattern('enrollments:.*')

    return data
  } catch (error) {
    throw error
  }
}
export async function enrollInCourseWithoutPrerequisites(
  courseId: string,
  studentId: string,
): Promise<Enrollment> {
  try {
    // Check student status - only active students can enroll
    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('status, parent_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      throw new Error('Failed to fetch student details')
    }

    if (student.status !== 'active') {
      throw new Error(
        'Only active accounts can enroll in courses. Please wait for your account to be verified.',
      )
    }

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .insert({
        id: crypto.randomUUID(),
        course_id: courseId,
        student_id: studentId,
        status: 'pending',
        enrolled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      throw new Error('Failed to enroll in course')
    }

    // Use the student data we already fetched above
    if (student.parent_id) {
      // Parent-initiated enrollment: send confirmation to parent
      sendParentEnrollmentConfirmation(data.id, student.parent_id).catch((err) =>
        console.error('Failed to send parent enrollment confirmation:', err),
      )
    } else {
      // Direct student enrollment: send submission email to student
      sendEnrollmentSubmissionEmail(data.id).catch((err) =>
        console.error('Failed to send enrollment submission email:', err),
      )
    }

    // Always send admin notification about new enrollment
    sendAdminEnrollmentNotification(data.id)
      .then((success) => {
        if (success) {
          console.log('✅ Admin enrollment notification sent successfully for enrollment:', data.id)
        } else {
          console.error(
            '❌ Admin enrollment notification failed (returned false) for enrollment:',
            data.id,
          )
        }
      })
      .catch((err) => {
        console.error('❌ Failed to send admin enrollment notification:', {
          enrollmentId: data.id,
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
        })
      })

    // Invalidate enrollment caches
    queryCache.invalidatePattern('enrollments:.*')

    return data
  } catch (error) {
    throw error
  }
}

// Auto-approved enrollment for teacher/admin actions
export async function enrollStudentByTeacher(
  courseId: string,
  studentId: string,
): Promise<Enrollment> {
  try {
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .insert({
        id: crypto.randomUUID(),
        course_id: courseId,
        student_id: studentId,
        status: 'approved', // Auto-approve for teacher/admin enrollments
        enrolled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to enroll student')
    }

    // Invalidate enrollment caches
    queryCache.invalidatePattern('enrollments:.*')

    return data
  } catch (error) {
    console.error('Error in enrollStudentByTeacher:', error)
    throw error
  }
}

export async function getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
  const cacheKey = createCacheKey('enrollments', 'student', studentId)

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('enrollments')
          .select(
            `
        *,
        courses (*)
      `,
          )
          .eq('student_id', studentId)
          .order('enrolled_at', { ascending: false })
        if (error) {
          return []
        }
        // Transform the data to match our interface - move courses to course
        const transformedData =
          data?.map((enrollment) => ({
            ...enrollment,
            course: enrollment.courses || null,
          })) || []
        return transformedData
      } catch {
        return []
      }
    },
    CACHE_DURATIONS.ENROLLMENTS, // 1 hour
  )
}
export async function getTeacherEnrollments(teacherId: string): Promise<Enrollment[]> {
  const cacheKey = createCacheKey('enrollments', 'teacher', teacherId)

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        // First get the teacher's profile to find their teacher_id
        // Get courses assigned to this teacher (using profile UUID)
        const { data: assignments } = await supabaseAdmin
          .from('course_assignments')
          .select('course_id')
          .eq('teacher_id', teacherId)
          .eq('is_active', true)

        if (!assignments || assignments.length === 0) {
          console.log('No course assignments found for teacher')
          return []
        }

        const courseIds = assignments.map((a) => a.course_id)

        // Get enrollments for those courses
        const { data, error } = await supabaseAdmin
          .from('enrollments')
          .select(
            `
        *,
        course:course_id (*),
        student:student_id (*)
      `,
          )
          .in('course_id', courseIds)
          .order('enrolled_at', { ascending: false })

        if (error) {
          console.error('Error fetching enrollments:', error)
          return []
        }

        // Map and transform the data to match the Enrollment interface
        const mappedData = (data || []).map((item: Record<string, unknown>) => ({
          ...item,
          course: item.course || undefined,
          student: item.student ? decryptProfileFields(item.student) : undefined,
        }))

        return mappedData as unknown as Enrollment[]
      } catch (error) {
        console.error('Error in getTeacherEnrollments:', error)
        return []
      }
    },
    CACHE_DURATIONS.ENROLLMENTS, // 1 hour
  )
}
export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: Enrollment['status'],
  additionalData?: Partial<Enrollment>,
): Promise<Enrollment> {
  try {
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .update({
        status,
        ...additionalData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .select()
      .single()
    if (error) {
      throw new Error('Failed to update enrollment status')
    }

    // Send enrollment status email (approved or rejected) - non-blocking
    if (status === 'approved' || status === 'rejected') {
      sendEnrollmentStatusEmail(enrollmentId, status).catch((err) =>
        console.error('Failed to send enrollment status email:', err),
      )
    }

    // Invalidate enrollment caches
    queryCache.invalidatePattern('enrollments:.*')

    return data
  } catch (error) {
    throw error
  }
}
export async function bulkUpdateEnrollments(
  enrollmentIds: string[],
  status: Enrollment['status'],
): Promise<Enrollment[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .in('id', enrollmentIds)
      .select()
    if (error) {
      throw new Error('Failed to bulk update enrollments')
    }

    // Invalidate enrollment caches
    queryCache.invalidatePattern('enrollments:.*')

    return data || []
  } catch (error) {
    throw error
  }
}
export async function getEnrollmentStats(): Promise<{
  total: number
  pending: number
  approved: number
  completed: number
}> {
  const cacheKey = createCacheKey('enrollments', 'stats')

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabaseAdmin.from('enrollments').select('status')
        if (error) {
          return { total: 0, pending: 0, approved: 0, completed: 0 }
        }
        const stats = (data || []).reduce(
          (acc, enrollment) => {
            acc.total++
            acc[enrollment.status as keyof typeof acc]++
            return acc
          },
          { total: 0, pending: 0, approved: 0, completed: 0 },
        )
        return stats
      } catch {
        return { total: 0, pending: 0, approved: 0, completed: 0 }
      }
    },
    CACHE_DURATIONS.ENROLLMENTS, // 1 hour
  )
}
export async function getAllEnrollments(): Promise<Enrollment[]> {
  const cacheKey = createCacheKey('enrollments', 'all')

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('enrollments')
          .select(
            `
        *,
        courses (
          *,
          gurukuls (*)
        ),
        profiles!enrollments_student_id_fkey (*)
      `,
          )
          .order('enrolled_at', { ascending: false })
        if (error) {
          return []
        }
        // Transform the data to match our interface expectations and decrypt student profiles
        const transformedData =
          data?.map((enrollment) => ({
            ...enrollment,
            course: enrollment.courses
              ? {
                  ...enrollment.courses,
                  gurukul: enrollment.courses.gurukuls, // Extract gurukul from gurukuls array
                }
              : null,
            student: enrollment.profiles ? decryptProfileFields(enrollment.profiles) : null,
          })) || []
        return transformedData
      } catch {
        return []
      }
    },
    CACHE_DURATIONS.ENROLLMENTS, // 1 hour
  )
}
/**
 * Get enrollments for all children of a parent
 */
export async function getEnrollmentsByParent(parentId: string): Promise<Enrollment[]> {
  const cacheKey = createCacheKey('enrollments', 'parent', parentId)

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('enrollments')
          .select(
            `
        *,
        courses (
          id,
          title,
          description,
          duration,
          level,
          price,
          thumbnail_url,
          gurukuls (
            id,
            name,
            slug
          )
        ),
        profiles!enrollments_student_id_fkey (
          id,
          full_name,
          email,
          student_id
        )
      `,
          )
          .eq('profiles.parent_id', parentId)
          .order('enrolled_at', { ascending: false })
        if (error) {
          return []
        }
        // Transform the data to match our interface and decrypt student profiles
        const transformedData =
          data?.map((enrollment) => ({
            ...enrollment,
            course: enrollment.courses
              ? {
                  ...enrollment.courses,
                  gurukul: enrollment.courses.gurukuls,
                }
              : null,
            student: enrollment.profiles ? decryptProfileFields(enrollment.profiles) : null,
          })) || []
        return transformedData
      } catch {
        return []
      }
    },
    CACHE_DURATIONS.ENROLLMENTS, // 1 hour
  )
}

// Approve a pending enrollment
export async function approveEnrollment(enrollmentId: string): Promise<void> {
  try {
    // First, fetch the enrollment details to get student and course info
    const { data: enrollmentData, error: fetchError } = await supabaseAdmin
      .from('enrollments')
      .select(
        `
        *,
        student:student_id (email, full_name),
        course:course_id (id, title, description)
      `,
      )
      .eq('id', enrollmentId)
      .single()

    if (fetchError || !enrollmentData) {
      console.error('Error fetching enrollment details:', fetchError)
      throw new Error('Failed to fetch enrollment details')
    }

    // Update enrollment status
    const { error } = await supabaseAdmin
      .from('enrollments')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .eq('status', 'pending') // Only update if currently pending

    if (error) {
      console.error('Database error approving enrollment:', error)
      throw new Error('Failed to approve enrollment')
    }

    // Send enrollment confirmation email (non-blocking)
    try {
      // Decrypt student profile before using it
      const decryptedStudent = enrollmentData.student
        ? decryptProfileFields(enrollmentData.student)
        : null
      if (
        decryptedStudent &&
        typeof decryptedStudent === 'object' &&
        'email' in decryptedStudent &&
        'full_name' in decryptedStudent
      ) {
        const studentEmail = (decryptedStudent as { email: string; full_name: string }).email
        const studentFullName = (decryptedStudent as { email: string; full_name: string }).full_name
        const courseName =
          typeof enrollmentData.course === 'object' &&
          enrollmentData.course &&
          'title' in enrollmentData.course
            ? (enrollmentData.course as { title: string }).title
            : 'Your Course'
        const courseDescription =
          typeof enrollmentData.course === 'object' &&
          enrollmentData.course &&
          'description' in enrollmentData.course
            ? (enrollmentData.course as { description?: string }).description
            : undefined

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/enrollments/confirm`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentEmail,
              studentFullName,
              courseName,
              courseDescription,
            }),
          },
        )

        if (!response.ok) {
          console.warn('Failed to send enrollment confirmation email:', {
            status: response.status,
            statusText: response.statusText,
          })
          // Don't throw - enrollment was successful, just email failed
        }
      }
    } catch (emailError) {
      console.warn('Error sending enrollment confirmation email:', emailError)
      // Don't throw - enrollment was successful, just email failed
    }

    // Invalidate enrollment caches
    queryCache.invalidatePattern('enrollments:.*')
  } catch (error) {
    console.error('Error in approveEnrollment:', error)
    throw error
  }
} // Reject a pending enrollment
export async function rejectEnrollment(enrollmentId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('enrollments')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .eq('status', 'pending') // Only update if currently pending

    if (error) {
      console.error('Database error rejecting enrollment:', error)
      throw new Error('Failed to reject enrollment')
    }

    // Invalidate enrollment caches
    queryCache.invalidatePattern('enrollments:.*')
  } catch (error) {
    console.error('Error in rejectEnrollment:', error)
    throw error
  }
}

// Get pending enrollments for teacher approval
export async function getPendingEnrollments(teacherId: string): Promise<Enrollment[]> {
  const cacheKey = createCacheKey('enrollments', 'pending', teacherId)

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        // First get the teacher's teacher_id from profile
        // Get the course IDs assigned to this teacher (using profile UUID)
        const { data: assignments, error: assignmentError } = await supabaseAdmin
          .from('course_assignments')
          .select('course_id')
          .eq('teacher_id', teacherId)
          .eq('is_active', true)

        if (assignmentError) {
          console.error('Error fetching course assignments:', assignmentError)
          return []
        }

        if (!assignments || assignments.length === 0) {
          console.log('No active course assignments found for teacher_id:', teacherId)
          return []
        }

        const courseIds = assignments.map((a) => a.course_id)

        const { data, error } = await supabaseAdmin
          .from('enrollments')
          .select(
            `
        *,
        course:course_id (*),
        student:student_id (*)
      `,
          )
          .in('course_id', courseIds)
          .eq('status', 'pending')
          .order('enrolled_at', { ascending: false })

        if (error) {
          console.error('Error fetching pending enrollments:', error)
          return []
        }

        // Map and transform the data to match Enrollment interface
        const mappedData = (data || []).map((item: Record<string, unknown>) => ({
          ...item,
          course: item.course || undefined,
          student: item.student ? decryptProfileFields(item.student) : undefined,
        }))

        console.log(`Found ${mappedData.length} pending enrollments for teacher ${teacherId}`)
        console.log('Pending enrollments data:', mappedData)
        return mappedData as unknown as Enrollment[]
      } catch (error) {
        console.error('Error in getPendingEnrollments:', error)
        return []
      }
    },
    CACHE_DURATIONS.ENROLLMENTS, // 1 hour
  )
}

// Get students enrolled in a specific course
export async function getStudentsEnrolledInCourse(
  courseId: string,
): Promise<{ id: string; full_name: string; email: string }[]> {
  const cacheKey = createCacheKey('enrollments', 'course-students', courseId)

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('enrollments')
          .select(
            `
        student_id,
        student:profiles!enrollments_student_id_fkey (
          id,
          full_name,
          email
        )
      `,
          )
          .eq('course_id', courseId)
          .in('status', ['approved', 'completed'])

        if (error) {
          console.error('Database error getting course students:', error)
          throw new Error('Failed to get students for course')
        }

        // Transform data to the expected format and remove duplicates
        const studentsMap = new Map()
        data?.forEach((enrollment: Record<string, unknown>) => {
          if (enrollment.student) {
            const decryptedStudent = decryptProfileFields(
              enrollment.student as { id: string; full_name: string; email: string },
            )
            studentsMap.set(decryptedStudent.id, {
              id: decryptedStudent.id,
              full_name: decryptedStudent.full_name,
              email: decryptedStudent.email,
            })
          }
        })

        return Array.from(studentsMap.values())
      } catch (error) {
        console.error('Error in getStudentsEnrolledInCourse:', error)
        throw error
      }
    },
    CACHE_DURATIONS.ENROLLMENTS, // 1 hour
  )
}

export async function getStudentCourseProgress(
  studentId: string,
): Promise<{ [courseId: string]: number }> {
  const cacheKey = createCacheKey('enrollments', 'progress', studentId)

  return queryCache.get(
    cacheKey,
    async () => {
      // Note: course_progress table does not exist in current schema
      // Progress is tracked at batch level via batch_progress table
      // Returning empty object as there's no course-level progress tracking
      // TODO: Implement course progress tracking if needed by querying batch_progress
      return {}
    },
    CACHE_DURATIONS.ENROLLMENTS, // 1 hour
  )
}
