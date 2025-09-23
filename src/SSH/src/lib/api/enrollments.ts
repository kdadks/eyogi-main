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
      console.error('Error enrolling in course:', error)
      throw new Error('Failed to enroll in course')
    }

    return data
  } catch (error) {
    console.error('Error enrolling in course:', error)
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
      console.error('Error enrolling in course:', error)
      throw new Error('Failed to enroll in course')
    }

    return data
  } catch (error) {
    console.error('Error enrolling in course:', error)
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
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select(
        `
        *,
        courses!inner (*),
        profiles!enrollments_student_id_fkey (*)
      `,
      )
      .eq('courses.teacher_id', teacherId)
      .order('enrolled_at', { ascending: false })

    if (error) {
      console.error('Error fetching teacher enrollments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching teacher enrollments:', error)
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
      console.error('Error updating enrollment status:', error)
      throw new Error('Failed to update enrollment status')
    }

    return data
  } catch (error) {
    console.error('Error updating enrollment status:', error)
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
      console.error('Error bulk updating enrollments:', error)
      throw new Error('Failed to bulk update enrollments')
    }

    return data || []
  } catch (error) {
    console.error('Error bulk updating enrollments:', error)
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
      console.error('Error fetching enrollment stats:', error)
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
  } catch (error) {
    console.error('Error fetching enrollment stats:', error)
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
      console.error('Error fetching all enrollments:', error)
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
  } catch (error) {
    console.error('Error fetching all enrollments:', error)
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
      console.error('Error fetching parent enrollments:', error)
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
  } catch (error) {
    console.error('Error fetching parent enrollments:', error)
    return []
  }
}
