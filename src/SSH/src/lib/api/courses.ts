import { supabaseAdmin } from '../supabase'
import { Course } from '../../types'

export async function getCourses(filters?: {
  gurukul_id?: string
  level?: string
  age_group?: number
  search?: string
}): Promise<Course[]> {
  try {
    let query = supabaseAdmin.from('courses').select('*')

    if (filters?.gurukul_id) {
      query = query.eq('gurukul_id', filters.gurukul_id)
    }

    if (filters?.level) {
      query = query.eq('level', filters.level)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching courses:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching courses:', error)
    return []
  }
}

export async function getCourse(id: string): Promise<Course | null> {
  try {
    const { data, error } = await supabaseAdmin.from('courses').select('*').eq('id', id).single()

    if (error) {
      console.error('Error fetching course:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching course:', error)
    return null
  }
}

export async function getEnrolledCount(courseId: string): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching enrolled count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error fetching enrolled count:', error)
    return 0
  }
}

export async function createCourse(
  course: Omit<Course, 'id' | 'created_at' | 'updated_at'>,
): Promise<Course> {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({
        ...course,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating course:', error)
      throw new Error('Failed to create course')
    }

    return data
  } catch (error) {
    console.error('Error creating course:', error)
    throw error
  }
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating course:', error)
      throw new Error('Failed to update course')
    }

    return data
  } catch (error) {
    console.error('Error updating course:', error)
    throw error
  }
}

export async function deleteCourse(id: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('courses').delete().eq('id', id)

    if (error) {
      console.error('Error deleting course:', error)
      throw new Error('Failed to delete course')
    }
  } catch (error) {
    console.error('Error deleting course:', error)
    throw error
  }
}

export async function getTeacherCourses(teacherId: string): Promise<Course[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching teacher courses:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching teacher courses:', error)
    return []
  }
}
