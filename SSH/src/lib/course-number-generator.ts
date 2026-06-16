import { supabaseAdmin } from './supabase'

/**
 * Generates a unique course number based on gurukul name and course title
 * Format: First 2 letters of gurukul + first letter of course + incremental number + optional part (A, B, C, etc.)
 * Example: "Hindisum Gurukul" + "Basic Course" = "HIB1" or "HIB1A" (with part)
 *
 * @param gurukulId - The ID of the gurukul
 * @param courseTitle - The title of the course
 * @param part - Optional part identifier (A, B, C, D, etc.)
 * @returns The generated course number
 */
export async function generateCourseNumber(
  gurukulId: string,
  courseTitle: string,
  part?: string,
): Promise<string> {
  try {
    // Get gurukul name
    const { data: gurukul, error: gurukulError } = await supabaseAdmin
      .from('gurukuls')
      .select('name')
      .eq('id', gurukulId)
      .single()

    if (gurukulError || !gurukul) {
      throw new Error('Gurukul not found')
    }

    // Extract first 2 letters of gurukul name (uppercase)
    const gurukulPrefix = extractGurukulPrefix(gurukul.name)

    // Extract first letter of course title (uppercase)
    const coursePrefix = extractCoursePrefix(courseTitle)

    // Combine prefixes
    const prefix = `${gurukulPrefix}${coursePrefix}`

    // Get the next incremental number for this prefix
    const { data: existingCourses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('course_number')
      .ilike('course_number', `${prefix}%`)
      .order('course_number', { ascending: false })

    if (coursesError) {
      throw coursesError
    }

    // Find the highest number for this prefix
    let nextNumber = 1
    if (existingCourses && existingCourses.length > 0) {
      // Extract numbers from existing course numbers
      const numbers = existingCourses
        .map((course) => {
          // Remove prefix and optional part letter to extract the number
          const match = course.course_number.match(new RegExp(`^${prefix}(\\d+)`))
          return match ? parseInt(match[1], 10) : 0
        })
        .filter((num) => !isNaN(num) && num > 0)

      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1
      }
    }

    // Build the course number
    let courseNumber = `${prefix}${nextNumber}`

    // Add part if provided
    if (part && part.trim()) {
      // Ensure part is a single uppercase letter
      const normalizedPart = part.trim().toUpperCase().charAt(0)
      if (/[A-Z]/.test(normalizedPart)) {
        courseNumber += normalizedPart
      }
    }

    return courseNumber
  } catch (error) {
    console.error('Error generating course number:', error)
    throw error
  }
}

/**
 * Extracts the first 2 letters from gurukul name
 * Handles special characters and spaces
 */
function extractGurukulPrefix(gurukulName: string): string {
  // Remove special characters and spaces, keep only letters
  const cleaned = gurukulName.replace(/[^a-zA-Z]/g, '')

  if (cleaned.length < 2) {
    throw new Error('Gurukul name must contain at least 2 letters')
  }

  return cleaned.substring(0, 2).toUpperCase()
}

/**
 * Extracts the first letter from course title
 * Handles special characters and spaces
 */
function extractCoursePrefix(courseTitle: string): string {
  // Remove special characters and spaces, keep only letters
  const cleaned = courseTitle.replace(/[^a-zA-Z]/g, '')

  if (cleaned.length < 1) {
    throw new Error('Course title must contain at least 1 letter')
  }

  return cleaned.charAt(0).toUpperCase()
}

/**
 * Validates if a part identifier is valid
 * Part must be a single letter A-Z
 */
export function isValidPart(part: string): boolean {
  if (!part || !part.trim()) return true // Empty is valid (optional)
  const normalized = part.trim().toUpperCase()
  return /^[A-Z]$/.test(normalized)
}
