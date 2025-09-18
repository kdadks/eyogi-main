import { supabaseAdmin } from '../supabase'
import { PrerequisiteCheckResult, Course, Enrollment, User } from '../../types'
import { getCourse } from './courses'
import { getStudentEnrollments } from './enrollments'

/**
 * Check if a student meets the prerequisites for a course
 */
export async function checkCoursePrerequisites(
  courseId: string,
  studentId: string,
): Promise<PrerequisiteCheckResult> {
  try {
    // Get the course details
    const course = await getCourse(courseId)
    if (!course) {
      return {
        canEnroll: false,
        missingPrerequisites: {
          courses: [],
          skills: [],
          level: null,
        },
        message: 'Course not found',
      }
    }

    // Get student's profile and enrollments
    const [studentProfile, studentEnrollments] = await Promise.all([
      getStudentProfile(studentId),
      getStudentEnrollments(studentId),
    ])

    if (!studentProfile) {
      return {
        canEnroll: false,
        missingPrerequisites: {
          courses: [],
          skills: [],
          level: null,
        },
        message: 'Student profile not found',
      }
    }

    const result: PrerequisiteCheckResult = {
      canEnroll: true,
      missingPrerequisites: {
        courses: [],
        skills: [],
        level: null,
      },
      message: 'All prerequisites met',
    }

    // Check if student is already enrolled in this course
    const existingEnrollment = studentEnrollments.find(
      (enrollment) => enrollment.course_id === courseId,
    )
    if (existingEnrollment) {
      return {
        canEnroll: false,
        missingPrerequisites: {
          courses: [],
          skills: [],
          level: null,
        },
        message: `Already enrolled in this course (Status: ${existingEnrollment.status})`,
      }
    }

    // Check prerequisite courses
    if (course.prerequisite_courses && course.prerequisite_courses.length > 0) {
      const missingCourses = await checkPrerequisiteCourses(
        course.prerequisite_courses,
        studentEnrollments,
      )
      if (missingCourses.length > 0) {
        result.canEnroll = false
        result.missingPrerequisites.courses = missingCourses
      }
    }

    // Check prerequisite level
    if (course.prerequisite_level) {
      const levelCheck = checkPrerequisiteLevel(course.prerequisite_level, studentProfile)
      if (!levelCheck.meets) {
        result.canEnroll = false
        result.missingPrerequisites.level = {
          required: course.prerequisite_level,
          current: levelCheck.current,
        }
      }
    }

    // Check prerequisite skills (this would need to be expanded based on how skills are tracked)
    if (course.prerequisite_skills && course.prerequisite_skills.length > 0) {
      const missingSkills = checkPrerequisiteSkills(course.prerequisite_skills, studentProfile)
      if (missingSkills.length > 0) {
        result.canEnroll = false
        result.missingPrerequisites.skills = missingSkills
      }
    }

    // Generate appropriate message
    if (!result.canEnroll) {
      result.message = generatePrerequisiteMessage(result.missingPrerequisites)
    }

    return result
  } catch (error) {
    console.error('Error checking course prerequisites:', error)
    return {
      canEnroll: false,
      missingPrerequisites: {
        courses: [],
        skills: [],
        level: null,
      },
      message: 'Error checking prerequisites',
    }
  }
}

/**
 * Check which prerequisite courses are missing or not completed
 */
async function checkPrerequisiteCourses(
  prerequisiteCourseIds: string[],
  studentEnrollments: Enrollment[],
): Promise<
  Array<{
    id: string
    title: string
    completion_status: 'not_enrolled' | 'pending' | 'in_progress' | 'not_completed'
  }>
> {
  const missingCourses = []

  for (const courseId of prerequisiteCourseIds) {
    const enrollment = studentEnrollments.find((e) => e.course_id === courseId)
    const course = await getCourse(courseId)

    if (!course) continue

    if (!enrollment) {
      missingCourses.push({
        id: courseId,
        title: course.title,
        completion_status: 'not_enrolled' as const,
      })
    } else if (enrollment.status !== 'completed') {
      let completionStatus: 'pending' | 'in_progress' | 'not_completed'

      if (enrollment.status === 'pending') {
        completionStatus = 'pending'
      } else if (enrollment.status === 'approved') {
        completionStatus = 'in_progress'
      } else {
        completionStatus = 'not_completed'
      }

      missingCourses.push({
        id: courseId,
        title: course.title,
        completion_status: completionStatus,
      })
    }
  }

  return missingCourses
}

/**
 * Check if student meets the prerequisite level requirement
 */
function checkPrerequisiteLevel(
  requiredLevel: string,
  studentProfile: User,
): { meets: boolean; current: string } {
  // This is a simplified level checking system
  // In a real implementation, you might track student progress/achievements

  const levelHierarchy = ['elementary', 'basic', 'intermediate', 'advanced']
  const requiredIndex = levelHierarchy.indexOf(requiredLevel)

  // For now, we'll assume students start at elementary level
  // In a real system, you'd track their current level based on completed courses
  const currentLevel = determineStudentLevel(studentProfile)
  const currentIndex = levelHierarchy.indexOf(currentLevel)

  return {
    meets: currentIndex >= requiredIndex,
    current: currentLevel,
  }
}

/**
 * Determine student's current level based on their profile and achievements
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function determineStudentLevel(_studentProfile: User): string {
  // This is a placeholder implementation
  // In a real system, you'd determine level based on:
  // - Completed courses and their levels
  // - Certificates earned
  // - Years of experience
  // - Assessment scores

  // For now, return elementary as default
  return 'elementary'
}

/**
 * Check which prerequisite skills are missing
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function checkPrerequisiteSkills(requiredSkills: string[], _studentProfile: User): string[] {
  // This is a placeholder implementation
  // In a real system, you'd track student skills based on:
  // - Completed courses
  // - Certificates
  // - Self-reported skills
  // - Assessment results

  // For now, assume no skills are verified
  return requiredSkills
}

/**
 * Generate a user-friendly message about missing prerequisites
 */
function generatePrerequisiteMessage(
  missingPrerequisites: PrerequisiteCheckResult['missingPrerequisites'],
): string {
  const messages: string[] = []

  if (missingPrerequisites.courses.length > 0) {
    const courseMessages = missingPrerequisites.courses.map((course) => {
      switch (course.completion_status) {
        case 'not_enrolled':
          return `Complete "${course.title}"`
        case 'pending':
          return `"${course.title}" enrollment pending approval`
        case 'in_progress':
          return `Complete "${course.title}" (currently in progress)`
        case 'not_completed':
          return `Complete "${course.title}"`
        default:
          return `Complete "${course.title}"`
      }
    })
    messages.push(`Required courses: ${courseMessages.join(', ')}`)
  }

  if (missingPrerequisites.skills.length > 0) {
    messages.push(`Required skills: ${missingPrerequisites.skills.join(', ')}`)
  }

  if (missingPrerequisites.level) {
    messages.push(
      `Minimum level required: ${missingPrerequisites.level.required} (current: ${missingPrerequisites.level.current})`,
    )
  }

  return messages.length > 0
    ? `Prerequisites not met. ${messages.join('. ')}.`
    : 'Prerequisites not met'
}

/**
 * Get student profile by ID
 */
async function getStudentProfile(studentId: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single()

    if (error) {
      console.error('Error fetching student profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching student profile:', error)
    return null
  }
}

/**
 * Get all courses that have the specified course as a prerequisite
 */
export async function getCoursesRequiringPrerequisite(courseId: string): Promise<Course[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .contains('prerequisite_courses', [courseId])

    if (error) {
      console.error('Error fetching courses requiring prerequisite:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching courses requiring prerequisite:', error)
    return []
  }
}

/**
 * Get prerequisite courses for a given course
 */
export async function getPrerequisiteCourses(courseId: string): Promise<Course[]> {
  try {
    const course = await getCourse(courseId)
    if (!course || !course.prerequisite_courses || course.prerequisite_courses.length === 0) {
      return []
    }

    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .in('id', course.prerequisite_courses)

    if (error) {
      console.error('Error fetching prerequisite courses:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching prerequisite courses:', error)
    return []
  }
}
