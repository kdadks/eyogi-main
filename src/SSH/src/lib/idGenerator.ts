import { supabaseAdmin } from './supabase'
import { getCountryCode, getCountyCode } from './isoCodes'

/**
 * Generates the next student or teacher ID
 * For students: ISO format - CountryCode(3) + CountyCode(2) + Year(4) + Sequence(5)
 * For teachers: Use teacher_code with EYG-TCH-#### format instead
 * Example Student ID: IRLDU202500001 (Ireland + Dublin + 2025 + 00001)
 */
export async function generateNextId(
  role: 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent',
  country?: string | null,
  county?: string | null,
): Promise<string> {
  // Only generate sequential IDs for students and teachers
  if (role !== 'student' && role !== 'teacher') {
    // For admin roles, return a simple identifier
    const currentYear = new Date().getFullYear()
    return `ADMIN-${currentYear}-${Date.now()}`
  }

  // For students, use ISO format
  if (role === 'student') {
    try {
      const year = new Date().getFullYear()

      // Get ISO codes
      const countryCode = getCountryCode(country)
      const countyCode = getCountyCode(county, countryCode)

      // Create the prefix for this location and year
      const prefix = `${countryCode}${countyCode}${year}`

      // Get existing student IDs with this prefix
      const { data: existingStudents } = await supabaseAdmin
        .from('profiles')
        .select('student_id')
        .not('student_id', 'is', null)
        .like('student_id', `${prefix}%`)

      let nextNumber = 1
      if (existingStudents && existingStudents.length > 0) {
        // Extract the numeric part (last 5 digits) from student IDs and find the maximum
        const numbers = existingStudents
          .map((student) => {
            const studentId = student.student_id
            if (!studentId || studentId.length < 5) return 0
            // Get last 5 characters as the sequence number
            const sequencePart = studentId.slice(-5)
            const num = parseInt(sequencePart, 10)
            return isNaN(num) ? 0 : num
          })
          .filter((num) => num > 0)

        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1
        }
      }

      // Format: CCCCCYYYY##### (e.g., IRLDU202500001)
      return `${prefix}${nextNumber.toString().padStart(5, '0')}`
    } catch (error) {
      console.error('Error generating student ID:', error)
      // Fallback to a default pattern if there's an error
      const year = new Date().getFullYear()
      const randomNum = Math.floor(Math.random() * 99999) + 1
      return `XXXXX${year}${randomNum.toString().padStart(5, '0')}`
    }
  }

  // For teachers, use legacy format
  try {
    const currentYear = new Date().getFullYear()
    // Legacy code - use id-generator.ts generateStudentId() for new ISO format
    const prefix = `EYG-${currentYear}-`
    // Get all existing teacher codes
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('teacher_code')
      .not('teacher_code', 'is', null)
      .order('created_at', { ascending: false })
    if (error) {
      // Fallback to 0001 if there's an error
      return `${prefix}0001`
    }
    // Extract all sequence numbers for this year
    const sequenceNumbers: number[] = []
    if (data && data.length > 0) {
      data.forEach((record) => {
        const id = record.teacher_code as string
        if (id && id.startsWith(prefix)) {
          const sequencePart = id.replace(prefix, '')
          const sequenceNum = parseInt(sequencePart, 10)
          if (!isNaN(sequenceNum)) {
            sequenceNumbers.push(sequenceNum)
          }
        }
      })
    }
    // Find the next available number
    let nextNumber = 1
    if (sequenceNumbers.length > 0) {
      // Sort numbers and find the highest
      sequenceNumbers.sort((a, b) => b - a)
      nextNumber = sequenceNumbers[0] + 1
    }
    // Format as 4-digit number with leading zeros
    const formattedNumber = nextNumber.toString().padStart(4, '0')
    return `${prefix}${formattedNumber}`
  } catch {
    // Fallback to 0001 if there's any error
    const currentYear = new Date().getFullYear()
    // Legacy fallback - use id-generator.ts generateStudentId() for new ISO format
    return `EYG-${currentYear}-0001`
  }
}
/**
 * Validates if an ID follows the correct format
 * Supports both new ISO format and legacy format
 */
export function validateIdFormat(id: string): boolean {
  // New ISO format: CCCCCYYYY##### (3-letter country + 2-letter county + 4-digit year + 5-digit sequence)
  const isoRegex = /^[A-Z]{3}[A-Z]{2}\d{4}\d{5}$/
  // Legacy format: EYG-YYYY-XXXX (deprecated, use ISO format CCCCCYYYY#####)
  const legacyRegex = /^EYG-\d{4}-\d{4}$/
  return isoRegex.test(id) || legacyRegex.test(id)
}
/**
 * Gets the sequence number from an ID
 */
export function getSequenceFromId(id: string): number | null {
  if (!validateIdFormat(id)) {
    return null
  }

  // Check if it's legacy format (EYG-YYYY-XXXX) - deprecated
  if (id.includes('-')) {
    const parts = id.split('-')
    if (parts.length === 3) {
      const sequence = parseInt(parts[2], 10)
      return isNaN(sequence) ? null : sequence
    }
  }

  // ISO format - last 5 digits
  if (id.length >= 5) {
    const sequence = parseInt(id.slice(-5), 10)
    return isNaN(sequence) ? null : sequence
  }

  return null
}
