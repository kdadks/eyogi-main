import { supabase, supabaseAdmin } from '../supabase'
import type { Database } from '../../types/database'
import { getCountryCode, getCountyCode } from '../isoCodes'
import { normalizeCountryToISO3, normalizeStateToISO2 } from '../iso-utils'
import { encryptProfileFields, decryptProfileFields } from '../encryption'
type Profile = Database['public']['Tables']['profiles']['Row']
export interface CreateChildData {
  full_name: string
  date_of_birth: string // Make this mandatory instead of age
  grade: string
  parent_id: string
  country: string // MANDATORY for proper student ID generation
  state: string // MANDATORY for proper student ID generation (county/state)
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  zip_code?: string
}
/**
 * Generate next student ID in ISO format
 * Format: CountryCode(3) + CountyCode(2) + Year(4) + Sequence(5)
 * Example: IRLDU202500001 (Ireland + Dublin + 2025 + 00001)
 */
async function generateNextStudentId(
  country?: string | null,
  county?: string | null,
): Promise<string> {
  try {
    let client = supabaseAdmin
    if (!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
      client = supabase
    }

    const year = new Date().getFullYear()

    // Get ISO codes
    const countryCode = getCountryCode(country)
    const countyCode = getCountyCode(county, countryCode)

    // Create the prefix for this location and year
    const prefix = `${countryCode}${countyCode}${year}`

    // Get existing student IDs with this prefix
    const { data: existingStudents } = await client
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
    const result = `${prefix}${nextNumber.toString().padStart(5, '0')}`
    return result
  } catch (error) {
    console.error('Error generating student ID:', error)
    // Fallback to a default pattern if there's an error
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 99999) + 1
    return `XXX XX${year}${randomNum.toString().padStart(5, '0')}`
  }
}
/**
 * Generate email from full name and student ID
 */
function generateStudentEmail(fullName: string, studentId: string): string {
  // Convert name to lowercase, remove spaces and special characters
  const namePart = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10)
  // Use last 5 digits of student ID (the sequence number)
  const idPart = studentId.slice(-5)
  return `${namePart}${idPart}@eyogi-student.com`
}
/**
 * Generate unique ID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
/**
 * Create a new child profile in the database
 */
export async function createChild(childData: CreateChildData): Promise<Profile> {
  try {
    // Validate mandatory fields for student ID generation
    if (!childData.country || childData.country.trim() === '') {
      throw new Error('Country is required to generate student ID')
    }
    if (!childData.state || childData.state.trim() === '') {
      throw new Error('State/County is required to generate student ID')
    }

    // Normalize country and state codes to ISO format
    const normalizedCountry = normalizeCountryToISO3(childData.country)
    const normalizedState = normalizeStateToISO2(childData.state, normalizedCountry)

    // Generate unique ID
    const childId = generateUUID()
    // Generate student ID with normalized country and county/state codes
    const studentId = await generateNextStudentId(normalizedCountry, normalizedState)
    // Generate unique email for child
    const email = generateStudentEmail(childData.full_name, studentId)
    // Calculate age from date of birth
    const birthDate = new Date(childData.date_of_birth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    // Prepare child profile data with normalized ISO codes
    const profileData = {
      id: childId,
      email,
      full_name: childData.full_name,
      date_of_birth: childData.date_of_birth, // Add the missing date_of_birth field
      role: 'student' as const,
      age,
      grade: childData.grade,
      phone: childData.phone || null,
      address_line_1: childData.address_line_1 || null,
      address_line_2: childData.address_line_2 || null,
      city: childData.city || null,
      state: normalizedState, // Use normalized 2-letter state code
      zip_code: childData.zip_code || null,
      country: normalizedCountry, // Use normalized 3-letter country code
      student_id: studentId,
      parent_id: childData.parent_id, // Link child to parent
    }

    // Encrypt sensitive fields before saving
    const encryptedProfileData = encryptProfileFields(profileData)

    // Insert into database
    let client = supabaseAdmin
    if (!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
      client = supabase
    }

    const { data, error } = await client
      .from('profiles')
      .insert(encryptedProfileData)
      .select()
      .single()
    if (error) {
      throw new Error(`Failed to create child profile: ${error.message}`)
    }

    // Parent-child relationship is now handled simply through parent_id field in profiles table
    // No need for complex parent_child_relationships table

    // Decrypt before returning
    return decryptProfileFields(data)
  } catch (error) {
    throw error
  }
}
/**
 * Get children for a specific parent
 */
export async function getChildrenByParentId(parentId: string): Promise<Profile[]> {
  try {
    // Get children using parent_id field (current approach)
    let client = supabaseAdmin
    if (!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
      client = supabase
    }

    const { data: directChildren, error: directError } = await client
      .from('profiles')
      .select('*')
      .eq('parent_id', parentId)
      .eq('role', 'student')
      .order('created_at', { ascending: false })
    if (directError) {
      throw new Error(`Failed to fetch children: ${directError.message}`)
    }
    // Decrypt sensitive fields before returning
    const decryptedChildren = (directChildren || []).map((child) => decryptProfileFields(child))
    return decryptedChildren
  } catch (error) {
    throw error
  }
}
/**
 * Update child profile - simplified to only work with profiles table
 * Parent-child relationship maintained through parent_id field
 */
export async function updateChild(
  childId: string,
  updates: Partial<CreateChildData> & { age?: number; email?: string },
): Promise<Profile> {
  try {
    // Calculate age from date of birth if provided
    let calculatedAge = updates.age
    if (updates.date_of_birth) {
      const birthDate = new Date(updates.date_of_birth)
      const today = new Date()
      calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--
      }
    }

    // Normalize country and state codes if provided
    let normalizedCountry = updates.country || null
    let normalizedState = updates.state || null

    if (normalizedCountry) {
      normalizedCountry = normalizeCountryToISO3(normalizedCountry)
      if (normalizedState) {
        normalizedState = normalizeStateToISO2(normalizedState, normalizedCountry)
      }
    }

    const updateData = {
      full_name: updates.full_name,
      date_of_birth: updates.date_of_birth, // Add the missing date_of_birth field
      age: calculatedAge,
      grade: updates.grade,
      email: updates.email, // Allow email updates
      phone: updates.phone || null,
      address_line_1: updates.address_line_1 || null,
      address_line_2: updates.address_line_2 || null,
      city: updates.city || null,
      state: normalizedState, // Use normalized 2-letter state code
      zip_code: updates.zip_code || null,
      country: normalizedCountry, // Use normalized 3-letter country code
    }

    // Encrypt sensitive fields before updating
    const encryptedUpdateData = encryptProfileFields(updateData)

    let client = supabaseAdmin
    if (!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
      client = supabase
    }

    const { data, error } = await client
      .from('profiles')
      .update(encryptedUpdateData)
      .eq('id', childId)
      .select()
      .single()
    if (error) {
      throw new Error(`Failed to update child profile: ${error.message}`)
    }
    // Decrypt before returning
    return decryptProfileFields(data)
  } catch (error) {
    throw error
  }
}
/**
 * Delete child profile - simplified to only work with profiles table
 * Parent-child relationship is automatically handled through parent_id field
 */
export async function deleteChild(childId: string): Promise<void> {
  try {
    let client = supabaseAdmin
    if (!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
      client = supabase
    }

    const { error } = await client.from('profiles').delete().eq('id', childId).eq('role', 'student')
    if (error) {
      throw new Error(`Failed to delete child profile: ${error.message}`)
    }
  } catch (error) {
    throw error
  }
}
