import { supabaseAdmin } from '../supabase'
import type { CourseAssignment } from '../../types'
import { queryCache, CACHE_DURATIONS, createCacheKey } from '../cache'

/**
 * Get course assignments for a teacher
 */
export async function getTeacherCourseAssignments(teacherId: string): Promise<CourseAssignment[]> {
  const cacheKey = createCacheKey('course-assignments', 'teacher', teacherId)

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('course_assignments')
          .select(
            `
            *,
            courses:course_id(*)
          `,
          )
          .eq('teacher_id', teacherId)
          .eq('is_active', true)
          .order('assigned_at', { ascending: false })

        if (error) throw error
        return data || []
      } catch (error) {
        console.error('Error fetching teacher course assignments:', error)
        return []
      }
    },
    CACHE_DURATIONS.COURSES,
  )
}

/**
 * Assign a course to a teacher
 */
export async function assignCourseToTeacher(
  courseId: string,
  teacherId: string,
  assignedBy: string,
  notes?: string,
): Promise<CourseAssignment> {
  try {
    const insertData: Record<string, unknown> = {
      course_id: courseId,
      teacher_id: teacherId,
      assigned_by: assignedBy,
      assigned_at: new Date().toISOString(),
      is_active: true,
    }

    // Only add notes if provided
    if (notes) {
      insertData.notes = notes
    }

    console.log('Inserting course assignment:', {
      courseId,
      teacherId,
      assignedBy,
      courseIdLength: courseId.length,
      teacherIdLength: teacherId.length,
      assignedByLength: assignedBy.length,
    })

    const { data, error } = await supabaseAdmin
      .from('course_assignments')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Database error assigning course:', {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        courseId,
        teacherId,
        assignedBy,
      })
      throw new Error(error.message || 'Failed to assign course')
    }

    // Invalidate caches
    queryCache.invalidatePattern('course-assignments:.*')
    queryCache.invalidatePattern('courses:.*')

    return data
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error assigning course to teacher:', {
        message: error.message,
        stack: error.stack,
        courseId,
        teacherId,
      })
    } else {
      console.error('Error assigning course to teacher:', error)
    }
    throw error
  }
}

/**
 * Unassign a course from a teacher
 */
export async function unassignCourseFromTeacher(assignmentId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('course_assignments')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)

    if (error) throw error

    // Invalidate caches
    queryCache.invalidatePattern('course-assignments:.*')
    queryCache.invalidatePattern('courses:.*')
  } catch (error) {
    console.error('Error unassigning course from teacher:', error)
    throw error
  }
}

/**
 * Get all course assignments with filters
 */
export async function getCourseAssignments(filters?: {
  teacherId?: string
  courseId?: string
  isActive?: boolean
}): Promise<CourseAssignment[]> {
  try {
    let query = supabaseAdmin.from('course_assignments').select(
      `
        *,
        courses:course_id(*),
        teacher:teacher_id(*)
      `,
    )

    if (filters?.teacherId) {
      query = query.eq('teacher_id', filters.teacherId)
    }

    if (filters?.courseId) {
      query = query.eq('course_id', filters.courseId)
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    const { data, error } = await query.order('assigned_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching course assignments:', error)
    return []
  }
}
