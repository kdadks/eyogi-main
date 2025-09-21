import { supabaseAdmin } from '../supabase'
import { Course } from '../../types'
import { generateCourseSlug, generateSlug } from '../utils'

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

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    // Handle UUID-only format for backward compatibility
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(slug)) {
      return getCourse(slug)
    }

    // For slug format, we need to find the course by generating slugs for all courses
    // and matching against the provided slug
    const { data: allCourses, error } = await supabaseAdmin.from('courses').select('*')

    if (error) {
      console.error('Error fetching courses:', error)
      return null
    }

    if (!allCourses || allCourses.length === 0) {
      return null
    }

    // Find the course whose generated slug matches the provided slug
    const matchingCourses = allCourses.filter((course) => {
      const generatedSlug = generateCourseSlug(course)
      return generatedSlug === slug
    })

    if (matchingCourses.length > 1) {
      console.warn(
        `Multiple courses found with slug "${slug}":`,
        matchingCourses.map((c) => c.title),
      )
    }

    const matchingCourse = matchingCourses[0] || null

    return matchingCourse || null
  } catch (error) {
    console.error('Error fetching course by slug:', error)
    return null
  }
}

export async function getEnrolledCount(courseIdOrSlug: string): Promise<number> {
  try {
    let actualCourseId = courseIdOrSlug

    // If it's not a UUID, treat it as a slug and resolve to course ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(courseIdOrSlug)) {
      const course = await getCourseBySlug(courseIdOrSlug)
      if (!course) {
        return 0
      }
      actualCourseId = course.id
    }

    const { count, error } = await supabaseAdmin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', actualCourseId)
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
    const courseId = crypto.randomUUID()

    // Generate slug if not provided
    const slug = course.slug || generateSlug(course.title)

    const courseData = {
      ...course,
      id: courseId,
      slug: slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from('courses').insert(courseData).select().single()

    if (error) {
      console.error('Error creating course:', JSON.stringify(error, null, 2))
      console.error('Course data:', JSON.stringify(courseData, null, 2))
      throw error
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
    // First check if we have a teacher_id (website auth user) or profile id (supabase auth user)
    // For backward compatibility, try both approaches

    // Method 1: Try direct teacher_id assignment (legacy)
    const { data: directCourses, error: directError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    // Method 2: Try course assignments table (new approach)
    // First, find the teacher's teacher_id from profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('teacher_id')
      .eq('id', teacherId)
      .single()

    let assignedCourses: Course[] = []
    if (profile?.teacher_id) {
      const { data: assignments, error: assignmentError } = await supabaseAdmin
        .from('course_assignments')
        .select(
          `
          course:courses(*)
        `,
        )
        .eq('teacher_id', profile.teacher_id)
        .eq('is_active', true)

      if (!assignmentError && assignments) {
        assignedCourses = assignments
          .map((assignment) => assignment.course as unknown as Course)
          .filter(Boolean)
      }
    }

    // Combine both methods and remove duplicates
    const allCourses = [...(directCourses || []), ...assignedCourses]
    const uniqueCourses = allCourses.filter(
      (course, index, self) => index === self.findIndex((c) => c.id === course.id),
    )

    if (directError && !profile?.teacher_id) {
      console.error('Error fetching teacher courses:', directError)
      return []
    }

    return uniqueCourses
  } catch (error) {
    console.error('Error fetching teacher courses:', error)
    return []
  }
}
