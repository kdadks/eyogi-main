import { supabaseAdmin } from '../supabase'
import { Enrollment } from '../../types'

export async function enrollInCourse(courseId: string, studentId: string): Promise<Enrollment> {
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
      console.error('Error fetching student enrollments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching student enrollments:', error)
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
        courses (*),
        profiles!enrollments_student_id_fkey (*)
      `,
      )
      .order('enrolled_at', { ascending: false })

    if (error) {
      console.error('Error fetching all enrollments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching all enrollments:', error)
    return []
  }
}
