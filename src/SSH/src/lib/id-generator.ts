/**
 * ID Generation utilities for different user roles
 * - Students: CCCCCYYYY##### (Country + County + Year + Sequence)
 * - Teachers: EYG-TCH-#### (eYogi Teacher + 4-digit sequence)
 * - Parents: EYG-PNT-#### (eYogi Parent + 4-digit sequence)
 */

import { supabaseAdmin } from './supabase'

/**
 * Generate Student ID based on location and year
 * Format: CCCCCYYYY##### (e.g., IRLDU202500001)
 * @param country - 3-letter country code (already normalized, e.g., IRL, USA, AUS)
 * @param state - 2-letter state code (already normalized, e.g., DU, CA, NS) or null
 * @param city - City name to use if state is not available
 */
export async function generateStudentId(
  country: string,
  state: string | null,
  city?: string,
): Promise<string> {
  // Use the codes directly from the database - they're already in correct format
  const countryCode = country.toUpperCase()
  // If state is not available, use first 2 letters of city (uppercase)
  const stateCode = state ? state.toUpperCase() : city ? city.substring(0, 2).toUpperCase() : 'XX'
  const year = new Date().getFullYear()

  // Get the count of existing students with the same location prefix for this year
  const prefix = `${countryCode}${stateCode}${year}`

  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'student')
    .not('student_id', 'is', null)
    .ilike('student_id', `${prefix}%`)

  if (error) {
    console.error('Error counting students:', error)
    // Fallback: use total student count
    const { count: totalCount } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .not('student_id', 'is', null)

    const nextNumber = (totalCount || 0) + 1
    return `${prefix}${nextNumber.toString().padStart(5, '0')}`
  }

  const nextNumber = (count || 0) + 1
  return `${prefix}${nextNumber.toString().padStart(5, '0')}`
}

/**
 * Generate Teacher ID
 * Format: EYG-TCH-#### (e.g., EYG-TCH-0001)
 * Ensures uniqueness by checking existing codes and retrying if necessary
 */
export async function generateTeacherId(): Promise<string> {
  const maxAttempts = 10

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Get the highest existing teacher code number
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('teacher_code')
      .eq('role', 'teacher')
      .not('teacher_code', 'is', null)
      .order('teacher_code', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching teacher codes:', error)
      // Fallback: use timestamp-based approach for uniqueness
      const timestamp = Date.now().toString().slice(-4)
      return `EYG-TCH-${timestamp}`
    }

    let nextNumber = 1

    if (data && data.length > 0 && data[0].teacher_code) {
      // Extract the number from the last code (e.g., "EYG-TCH-0042" -> 42)
      const match = data[0].teacher_code.match(/EYG-TCH-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    const candidateCode = `EYG-TCH-${nextNumber.toString().padStart(4, '0')}`

    // Verify this code doesn't already exist
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('teacher_code', candidateCode)
      .single()

    if (!existing) {
      return candidateCode
    }

    // If code exists, retry
    console.warn(`Teacher code ${candidateCode} already exists, retrying...`)
  }

  // Final fallback: use timestamp to ensure uniqueness
  const timestamp = Date.now().toString().slice(-4)
  const fallbackCode = `EYG-TCH-${timestamp}`
  console.warn(`Using timestamp-based fallback code: ${fallbackCode}`)
  return fallbackCode
}

/**
 * Generate Parent ID
 * Format: EYG-PNT-#### (e.g., EYG-PNT-0001)
 * Ensures uniqueness by checking existing codes and retrying if necessary
 */
export async function generateParentId(): Promise<string> {
  const maxAttempts = 10

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Get the highest existing parent code number
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('parent_code')
      .eq('role', 'parent')
      .not('parent_code', 'is', null)
      .order('parent_code', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching parent codes:', error)
      // Fallback: use timestamp-based approach for uniqueness
      const timestamp = Date.now().toString().slice(-4)
      return `EYG-PNT-${timestamp}`
    }

    let nextNumber = 1

    if (data && data.length > 0 && data[0].parent_code) {
      // Extract the number from the last code (e.g., "EYG-PNT-0042" -> 42)
      const match = data[0].parent_code.match(/EYG-PNT-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    const candidateCode = `EYG-PNT-${nextNumber.toString().padStart(4, '0')}`

    // Verify this code doesn't already exist
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('parent_code', candidateCode)
      .single()

    if (!existing) {
      return candidateCode
    }

    // If code exists, add random offset and retry
    console.warn(`Parent code ${candidateCode} already exists, retrying...`)
  }

  // Final fallback: use timestamp to ensure uniqueness
  const timestamp = Date.now().toString().slice(-4)
  const fallbackCode = `EYG-PNT-${timestamp}`
  console.warn(`Using timestamp-based fallback code: ${fallbackCode}`)
  return fallbackCode
}

/**
 * Generate Admin ID
 * Format: EYG-ADM-#### (e.g., EYG-ADM-0001)
 * Used for admin, business_admin, and super_admin roles
 * Ensures uniqueness by checking existing codes and retrying if necessary
 */
export async function generateAdminId(): Promise<string> {
  const maxAttempts = 10

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Get the highest existing admin code number
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('admin_code')
      .in('role', ['admin', 'business_admin', 'super_admin'])
      .not('admin_code', 'is', null)
      .order('admin_code', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching admin codes:', error)
      // Fallback: use timestamp-based approach for uniqueness
      const timestamp = Date.now().toString().slice(-4)
      return `EYG-ADM-${timestamp}`
    }

    let nextNumber = 1

    if (data && data.length > 0 && data[0].admin_code) {
      // Extract the number from the last code (e.g., "EYG-ADM-0042" -> 42)
      const match = data[0].admin_code.match(/EYG-ADM-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    const candidateCode = `EYG-ADM-${nextNumber.toString().padStart(4, '0')}`

    // Verify this code doesn't already exist
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('admin_code', candidateCode)
      .single()

    if (!existing) {
      return candidateCode
    }

    // If code exists, retry
    console.warn(`Admin code ${candidateCode} already exists, retrying...`)
  }

  // Final fallback: use timestamp to ensure uniqueness
  const timestamp = Date.now().toString().slice(-4)
  const fallbackCode = `EYG-ADM-${timestamp}`
  console.warn(`Using timestamp-based fallback code: ${fallbackCode}`)
  return fallbackCode
}

/**
 * Generate appropriate ID based on role
 */
export async function generateRoleId(
  role: string,
  country?: string,
  state?: string,
  city?: string,
): Promise<{
  student_id?: string
  teacher_code?: string
  parent_code?: string
  admin_code?: string
}> {
  switch (role) {
    case 'student':
      if (!country) {
        throw new Error('Country is required for student ID generation')
      }
      if (!state && !city) {
        throw new Error('Either state or city is required for student ID generation')
      }
      return { student_id: await generateStudentId(country, state || null, city) }

    case 'teacher':
      return { teacher_code: await generateTeacherId() }

    case 'parent':
      return { parent_code: await generateParentId() }

    case 'admin':
    case 'business_admin':
    case 'super_admin':
      return { admin_code: await generateAdminId() }

    default:
      return {}
  }
}
