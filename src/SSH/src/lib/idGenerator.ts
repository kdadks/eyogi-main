import { supabaseAdmin } from './supabase'

/**
 * Generates the next student or teacher ID in sequence
 * Format: EYG-2025-XXXX where XXXX is a 4-digit incrementing number
 */
export async function generateNextId(
  role: 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent',
): Promise<string> {
  // Only generate sequential IDs for students and teachers
  if (role !== 'student' && role !== 'teacher') {
    // For admin roles, return a simple identifier
    const currentYear = new Date().getFullYear()
    return `ADMIN-${currentYear}-${Date.now()}`
  }

  try {
    const currentYear = new Date().getFullYear()
    const prefix = `EYG-${currentYear}-`

    // Get all existing IDs for this role
    const column = role === 'student' ? 'student_id' : 'teacher_id'
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(column)
      .not(column, 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching existing IDs:', error)
      // Fallback to 0001 if there's an error
      return `${prefix}0001`
    }

    // Extract all sequence numbers for this year
    const sequenceNumbers: number[] = []

    if (data && data.length > 0) {
      data.forEach((record) => {
        const id = record[column as keyof typeof record] as string
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
  } catch (error) {
    console.error('Error generating ID sequence:', error)
    // Fallback to 0001 if there's any error
    const currentYear = new Date().getFullYear()
    return `EYG-${currentYear}-0001`
  }
}

/**
 * Validates if an ID follows the correct format
 */
export function validateIdFormat(id: string): boolean {
  const regex = /^EYG-\d{4}-\d{4}$/
  return regex.test(id)
}

/**
 * Gets the sequence number from an ID
 */
export function getSequenceFromId(id: string): number | null {
  if (!validateIdFormat(id)) {
    return null
  }

  const parts = id.split('-')
  if (parts.length === 3) {
    const sequence = parseInt(parts[2], 10)
    return isNaN(sequence) ? null : sequence
  }

  return null
}
