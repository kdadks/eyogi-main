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
 * @param state - 2-letter state code (already normalized, e.g., DU, CA, NS)
 */
export async function generateStudentId(country: string, state: string): Promise<string> {
  // Use the codes directly from the database - they're already in correct format
  const countryCode = country.toUpperCase()
  const stateCode = state.toUpperCase()
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
 */
export async function generateTeacherId(): Promise<string> {
  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'teacher')
    .not('teacher_code', 'is', null)

  if (error) {
    console.error('Error counting teachers:', error)
    return 'EYG-TCH-0001'
  }

  const nextNumber = (count || 0) + 1
  return `EYG-TCH-${nextNumber.toString().padStart(4, '0')}`
}

/**
 * Generate Parent ID
 * Format: EYG-PNT-#### (e.g., EYG-PNT-0001)
 */
export async function generateParentId(): Promise<string> {
  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'parent')
    .not('parent_code', 'is', null)

  if (error) {
    console.error('Error counting parents:', error)
    return 'EYG-PNT-0001'
  }

  const nextNumber = (count || 0) + 1
  return `EYG-PNT-${nextNumber.toString().padStart(4, '0')}`
}

/**
 * Generate Admin ID
 * Format: EYG-ADM-#### (e.g., EYG-ADM-0001)
 * Used for admin, business_admin, and super_admin roles
 */
export async function generateAdminId(): Promise<string> {
  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .in('role', ['admin', 'business_admin', 'super_admin'])
    .not('admin_code', 'is', null)

  if (error) {
    console.error('Error counting admins:', error)
    return 'EYG-ADM-0001'
  }

  const nextNumber = (count || 0) + 1
  return `EYG-ADM-${nextNumber.toString().padStart(4, '0')}`
}

/**
 * Generate appropriate ID based on role
 */
export async function generateRoleId(
  role: string,
  country?: string,
  state?: string,
): Promise<{
  student_id?: string
  teacher_code?: string
  parent_code?: string
  admin_code?: string
}> {
  switch (role) {
    case 'student':
      if (!country || !state) {
        throw new Error('Country and state are required for student ID generation')
      }
      return { student_id: await generateStudentId(country, state) }

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
