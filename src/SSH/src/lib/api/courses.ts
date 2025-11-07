import { supabaseAdmin } from '../supabase'
import { Course } from '../../types'
import { generateCourseSlug, generateSlug } from '../utils'
import { queryCache, CACHE_DURATIONS, createCacheKey } from '../cache'
export async function getCourses(filters?: {
  gurukul_id?: string
  level?: string
  age_group?: number
  search?: string
  teacher_id?: string
}): Promise<Course[]> {
  try {
    // Create cache key based on filters
    const cacheKey = createCacheKey(
      'courses',
      filters?.gurukul_id || 'all',
      filters?.level || 'all',
      filters?.search || 'all',
      filters?.teacher_id || 'all',
    )

    // Use cache for queries without search (search should be fresh)
    if (!filters?.search) {
      return await queryCache.get(
        cacheKey,
        async () => {
          let query = supabaseAdmin.from('courses').select('*')
          if (filters?.gurukul_id) {
            query = query.eq('gurukul_id', filters.gurukul_id)
          }
          if (filters?.level) {
            query = query.eq('level', filters.level)
          }
          if (filters?.teacher_id) {
            query = query.eq('teacher_id', filters.teacher_id)
          }
          const { data, error } = await query.order('created_at', { ascending: false })
          if (error) {
            throw error
          }
          return data || []
        },
        CACHE_DURATIONS.COURSES, // Cache for 1 week
      )
    }

    // For search queries, don't cache (always get fresh results)
    let query = supabaseAdmin.from('courses').select('*')
    if (filters?.gurukul_id) {
      query = query.eq('gurukul_id', filters.gurukul_id)
    }
    if (filters?.level) {
      query = query.eq('level', filters.level)
    }
    if (filters?.teacher_id) {
      query = query.eq('teacher_id', filters.teacher_id)
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
      return []
    }
    return data || []
  } catch {
    return []
  }
}
export async function getCourse(id: string): Promise<Course | null> {
  try {
    // Cache individual course queries
    return await queryCache.get(
      createCacheKey('course', id),
      async () => {
        const { data, error } = await supabaseAdmin
          .from('courses')
          .select('*')
          .eq('id', id)
          .single()
        if (error) {
          throw error
        }
        return data
      },
      CACHE_DURATIONS.COURSES, // Cache for 1 week
    )
  } catch {
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
      // Multiple courses found with same slug
    }
    const matchingCourse = matchingCourses[0] || null
    return matchingCourse || null
  } catch {
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
      return 0
    }
    return count || 0
  } catch {
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
      throw error
    }

    // Invalidate all course list caches (new course added)
    queryCache.invalidatePattern('courses:.*')

    return data
  } catch (error) {
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
      throw new Error('Failed to update course')
    }

    // Invalidate all course-related caches
    queryCache.invalidate(createCacheKey('course', id))
    queryCache.invalidatePattern('courses:.*') // Invalidate all course list caches

    return data
  } catch (error) {
    throw error
  }
}
export async function deleteCourse(id: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('courses').delete().eq('id', id)
    if (error) {
      throw new Error('Failed to delete course')
    }

    // Invalidate all course-related caches
    queryCache.invalidate(createCacheKey('course', id))
    queryCache.invalidatePattern('courses:.*') // Invalidate all course list caches
  } catch (error) {
    throw error
  }
}
export async function getTeacherCourses(teacherId: string): Promise<Course[]> {
  try {
    // Get teacher's profile to find their teacher_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('teacher_id')
      .eq('id', teacherId)
      .single()

    if (!profile?.teacher_id) {
      console.log('No teacher_id found for profile:', teacherId)
      return []
    }

    // Get courses assigned to this teacher via course_assignments
    const { data: assignments, error: assignmentError } = await supabaseAdmin
      .from('course_assignments')
      .select(
        `
        course_id,
        courses!inner(*)
      `,
      )
      .eq('teacher_id', profile.teacher_id)
      .eq('is_active', true)

    if (assignmentError) {
      console.error('Error fetching course assignments:', assignmentError)
      return []
    }

    if (!assignments || assignments.length === 0) {
      console.log('No course assignments found for teacher_id:', profile.teacher_id)
      return []
    }

    const courses = assignments
      .map((assignment) => assignment.courses as unknown as Course)
      .filter(Boolean)

    return courses
  } catch (error) {
    console.error('Error in getTeacherCourses:', error)
    return []
  }
}
