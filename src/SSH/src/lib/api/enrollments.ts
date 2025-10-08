import { supabaseAdmin } from '../supabase'
import { Enrollment } from '../../types'
import { checkCoursePrerequisites } from './prerequisites'
export async function enrollInCourse(courseId: string, studentId: string): Promise<Enrollment> {
  try {
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
    return data
  } catch (error) {
    console.error('Error in enrollStudentByTeacher:', error)
    throw error
  }
}

export async function getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
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
}
export async function getTeacherEnrollments(teacherId: string): Promise<Enrollment[]> {
  try {
    // First get the teacher's profile to find their teacher_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('teacher_id')
      .eq('id', teacherId)
      .single()

    if (!profile?.teacher_id) {
      console.log('No teacher_id found for profile:', teacherId)
      return []
    }

    // Get courses assigned to this teacher
    const { data: assignments } = await supabaseAdmin
      .from('course_assignments')
      .select('course_id')
      .eq('teacher_id', profile.teacher_id)
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
        courses!inner (*),
        student:profiles!enrollments_student_id_fkey (*)
      `,
      )
      .in('course_id', courseIds)
      .order('enrolled_at', { ascending: false })

    if (error) {
      console.error('Error fetching enrollments:', error)
      return []
    }

    // Map the data to match the Enrollment interface
    return (data || []) as Enrollment[]
  } catch (error) {
    console.error('Error in getTeacherEnrollments:', error)
    return []
  }
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
}
export async function getAllEnrollments(): Promise<Enrollment[]> {
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
    // Transform the data to match our interface expectations
    const transformedData =
      data?.map((enrollment) => ({
        ...enrollment,
        course: enrollment.courses
          ? {
              ...enrollment.courses,
              gurukul: enrollment.courses.gurukuls, // Extract gurukul from gurukuls array
            }
          : null,
        student: enrollment.profiles || null,
      })) || []
    return transformedData
  } catch {
    return []
  }
}
/**
 * Get enrollments for all children of a parent
 */
export async function getEnrollmentsByParent(parentId: string): Promise<Enrollment[]> {
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
    // Transform the data to match our interface
    const transformedData =
      data?.map((enrollment) => ({
        ...enrollment,
        course: enrollment.courses
          ? {
              ...enrollment.courses,
              gurukul: enrollment.courses.gurukuls,
            }
          : null,
        student: enrollment.profiles || null,
      })) || []
    return transformedData
  } catch {
    return []
  }
}

// Approve a pending enrollment
export async function approveEnrollment(enrollmentId: string): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Error in rejectEnrollment:', error)
    throw error
  }
}

// Get pending enrollments for teacher approval
export async function getPendingEnrollments(teacherId: string): Promise<Enrollment[]> {
  try {
    // First get the course IDs assigned to this teacher
    const { data: assignments } = await supabaseAdmin
      .from('course_assignments')
      .select('course_id')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (!assignments || assignments.length === 0) {
      return []
    }

    const courseIds = assignments.map((a) => a.course_id)

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select(
        `
        *,
        courses!inner (*),
        student:profiles!enrollments_student_id_fkey (*)
      `,
      )
      .in('course_id', courseIds)
      .eq('status', 'pending')
      .order('enrolled_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending enrollments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPendingEnrollments:', error)
    return []
  }
}

// Get students enrolled in a specific course
export async function getStudentsEnrolledInCourse(
  courseId: string,
): Promise<{ id: string; full_name: string; email: string }[]> {
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
    data?.forEach((enrollment: any) => {
      if (enrollment.student) {
        studentsMap.set(enrollment.student.id, {
          id: enrollment.student.id,
          full_name: enrollment.student.full_name,
          email: enrollment.student.email,
        })
      }
    })

    return Array.from(studentsMap.values())
  } catch (error) {
    console.error('Error in getStudentsEnrolledInCourse:', error)
    throw error
  }
}
