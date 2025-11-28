import { supabaseAdmin } from '../supabase'
import { Course } from '../../types'
import { generateCourseSlug, generateSlug } from '../utils'
import { queryCache, CACHE_DURATIONS, createCacheKey } from '../cache'
import { generateCourseNumber } from '../course-number-generator'
import { decryptProfileFields } from '../encryption'
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
          let query = supabaseAdmin.from('courses').select('*, gurukul:gurukuls(*)')
          if (filters?.gurukul_id) {
            query = query.eq('gurukul_id', filters.gurukul_id)
          }
          if (filters?.level) {
            query = query.eq('level', filters.level)
          }
          // Note: courses table no longer has teacher_id field
          // Use course_assignments table to filter by teacher
          const { data, error } = await query.order('created_at', { ascending: false })
          if (error) {
            throw error
          }

          // Courses no longer have direct teacher_id field
          // Teachers are assigned via course_assignments table
          const coursesWithDecryptedTeachers = (data || []).map((course: any) => ({
            ...course,
            teacher: null, // Use course_assignments to get teacher info
          }))
          return coursesWithDecryptedTeachers
        },
        CACHE_DURATIONS.COURSES, // Cache for 1 week
      )
    }

    // For search queries, don't cache (always get fresh results)
    let query = supabaseAdmin.from('courses').select('*, gurukul:gurukuls(*)')
    if (filters?.gurukul_id) {
      query = query.eq('gurukul_id', filters.gurukul_id)
    }
    if (filters?.level) {
      query = query.eq('level', filters.level)
    }
    // Note: courses table no longer has teacher_id field
    // Use course_assignments table to filter by teacher
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
      return []
    }

    // Fetch teachers separately if courses have teacher_id
    const teacherIds = [...new Set((data || []).map((c: any) => c.teacher_id).filter(Boolean))]
    let teachersMap = new Map()

    if (teacherIds.length > 0) {
      const { data: teachers } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('teacher_id', teacherIds)

      if (teachers) {
        teachers.forEach((teacher) => {
          teachersMap.set(teacher.teacher_id, decryptProfileFields(teacher))
        })
      }
    }

    // Attach decrypted teachers to courses
    const coursesWithDecryptedTeachers = (data || []).map((course: any) => ({
      ...course,
      teacher: course.teacher_id ? teachersMap.get(course.teacher_id) || null : null,
    }))
    return coursesWithDecryptedTeachers
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
          .select('*, gurukul:gurukuls(*)')
          .eq('id', id)
          .single()
        if (error) {
          throw error
        }

        // Courses no longer have direct teacher_id field
        if (data) {
          // Use course_assignments to get teacher info if needed
          const teacher = null

          if (teacher) {
            return {
              ...data,
              teacher: decryptProfileFields(teacher),
            }
          }
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
    const { data: allCourses, error } = await supabaseAdmin
      .from('courses')
      .select('*, gurukul:gurukuls(*)')
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

    // Courses no longer have direct teacher_id field
    if (matchingCourse) {
      // Use course_assignments to get teacher info if needed
      const teacher = null

      if (teacher) {
        return {
          ...matchingCourse,
          teacher: decryptProfileFields(teacher),
        }
      }
    }

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
  course: Omit<Course, 'id' | 'created_at' | 'updated_at'> & { part?: string },
): Promise<Course> {
  try {
    const courseId = crypto.randomUUID()

    // Generate slug if not provided
    const slug = course.slug || generateSlug(course.title)

    // Generate course number automatically if not provided
    const courseNumber =
      course.course_number ||
      (await generateCourseNumber(course.gurukul_id, course.title, course.part))

    const { part, ...courseWithoutPart } = course

    const courseData = {
      ...courseWithoutPart,
      id: courseId,
      slug: slug,
      course_number: courseNumber,
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
export async function updateCourse(
  id: string,
  updates: Partial<Course> & { part?: string; regenerateCourseNumber?: boolean },
): Promise<Course> {
  try {
    // Get the current course to check if title or gurukul changed
    const { data: currentCourse, error: fetchError } = await supabaseAdmin
      .from('courses')
      .select('title, gurukul_id, course_number')
      .eq('id', id)
      .single()

    if (fetchError || !currentCourse) {
      throw new Error('Course not found')
    }

    let finalUpdates = { ...updates }

    // Extract the base course number (without part) from current course number
    // e.g., "HIB1A" -> "HIB1", "HIB2" -> "HIB2"
    const currentBaseNumber = currentCourse.course_number.replace(/[A-Z]$/, '')

    // Check if title or gurukul changed - these require regenerating the base number
    const titleChanged = updates.title && updates.title !== currentCourse.title
    const gurukulChanged = updates.gurukul_id && updates.gurukul_id !== currentCourse.gurukul_id

    if (titleChanged || gurukulChanged) {
      // Title or gurukul changed - regenerate the entire course number with new prefix
      const newTitle = updates.title || currentCourse.title
      const newGurukulId = updates.gurukul_id || currentCourse.gurukul_id
      const newCourseNumber = await generateCourseNumber(newGurukulId, newTitle, updates.part)
      finalUpdates.course_number = newCourseNumber
    } else if (updates.part !== undefined) {
      // Only part changed - keep the base number, just append/update the part
      if (updates.part && updates.part.trim()) {
        const normalizedPart = updates.part.trim().toUpperCase().charAt(0)
        finalUpdates.course_number = `${currentBaseNumber}${normalizedPart}`
      } else {
        // Part removed - use just the base number
        finalUpdates.course_number = currentBaseNumber
      }
    }
    // If nothing changed, course_number stays the same (not updated)

    // Remove part and regenerateCourseNumber from updates as they're not DB columns
    const { part, regenerateCourseNumber, ...dbUpdates } = finalUpdates

    const { data, error } = await supabaseAdmin
      .from('courses')
      .update({
        ...dbUpdates,
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
    // Get courses assigned to this teacher via course_assignments
    // Note: course_assignments.teacher_id now references profiles.id directly
    const { data: assignments, error: assignmentError } = await supabaseAdmin
      .from('course_assignments')
      .select(
        `
        course_id,
        courses!inner(*)
      `,
      )
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (assignmentError) {
      console.error('Error fetching course assignments:', assignmentError)
      return []
    }

    if (!assignments || assignments.length === 0) {
      console.log('No course assignments found for teacher profile:', teacherId)
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

/**
 * Check if a slug already exists in the courses table
 * Optionally exclude a specific course ID (for edit mode)
 */
export async function checkSlugExists(slug: string, excludeCourseId?: string): Promise<boolean> {
  try {
    let query = supabaseAdmin
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('slug', slug)

    if (excludeCourseId) {
      query = query.neq('id', excludeCourseId)
    }

    const { count, error } = await query

    if (error) {
      console.error('Error checking slug:', error)
      return false
    }

    return (count || 0) > 0
  } catch (error) {
    console.error('Error checking slug:', error)
    return false
  }
}
