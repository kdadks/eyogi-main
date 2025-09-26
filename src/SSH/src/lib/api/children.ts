import { supabaseAdmin } from '../supabase'
import type { Database } from '../../types/database'
type Profile = Database['public']['Tables']['profiles']['Row']
export interface CreateChildData {
  full_name: string
  date_of_birth: string // Make this mandatory instead of age
  grade: string
  parent_id: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
}
/**
 * Generate next student ID
 */
async function generateNextStudentId(): Promise<string> {
  try {
    const year = new Date().getFullYear()
    // Get existing student IDs for this year
    const { data: existingStudents } = await supabaseAdmin
      .from('profiles')
      .select('student_id')
      .eq('role', 'student')
      .not('student_id', 'is', null)
      .like('student_id', `EYG-${year}%`)
    const nextNumber = (existingStudents?.length || 0) + 1
    return `EYG-${year}-${nextNumber.toString().padStart(4, '0')}`
  } catch {
    // Fallback to a random number if there's an error
    const randomNum = Math.floor(Math.random() * 9999) + 1
    return `EYG-${new Date().getFullYear()}-${randomNum.toString().padStart(4, '0')}`
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
  // Extract numeric part from student ID
  const idPart = studentId.replace(/[^0-9]/g, '').substring(-4)
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
    // Generate unique ID
    const childId = generateUUID()
    // Generate student ID
    const studentId = await generateNextStudentId()
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
    // Prepare child profile data
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
      state: childData.state || null,
      zip_code: childData.zip_code || null,
      country: childData.country || null,
      student_id: studentId,
      parent_id: childData.parent_id, // Link child to parent
    }
    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    if (error) {
      throw new Error(`Failed to create child profile: ${error.message}`)
    }

    // Parent-child relationship is now handled simply through parent_id field in profiles table
    // No need for complex parent_child_relationships table

    return data
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
    const { data: directChildren, error: directError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('parent_id', parentId)
      .eq('role', 'student')
      .order('created_at', { ascending: false })
    if (directError) {
      throw new Error(`Failed to fetch children: ${directError.message}`)
    }
    return directChildren || []
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
      state: updates.state || null,
      zip_code: updates.zip_code || null,
      country: updates.country || null,
    }
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', childId)
      .select()
      .single()
    if (error) {
      throw new Error(`Failed to update child profile: ${error.message}`)
    }
    return data
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
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', childId)
      .eq('role', 'student')
    if (error) {
      throw new Error(`Failed to delete child profile: ${error.message}`)
    }
  } catch (error) {
    throw error
  }
}
