import { supabaseAdmin } from '../supabase'
import type { Database } from '../supabase'
import type { Course } from '../../types'
type Profile = Database['public']['Tables']['profiles']['Row']
export async function getAllUsers(): Promise<Profile[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      return []
    }
    return data || []
  } catch {
    return []
  }
}
export async function updateUserRole(userId: string, newRole: Profile['role']): Promise<Profile> {
  try {
    const updateData: Partial<Profile> = {
      role: newRole,
      updated_at: new Date().toISOString(),
    }
    // If changing to student, assign student ID
    if (newRole === 'student') {
      const year = new Date().getFullYear()
      const { data: existingStudents } = await supabaseAdmin
        .from('profiles')
        .select('student_id')
        .eq('role', 'student')
        .not('student_id', 'is', null)
      const nextNumber = (existingStudents?.length || 0) + 1
      updateData.student_id = `EYG-${year}-${nextNumber.toString().padStart(4, '0')}`
    }
    // If changing from student, remove student ID
    if (newRole !== 'student') {
      updateData.student_id = null
    }
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()
    if (error) {
      throw new Error('Failed to update user role')
    }
    return data
  } catch (error) {
    throw error
  }
}
export async function deleteUser(userId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('profiles').delete().eq('id', userId)
    if (error) {
      throw new Error('Failed to delete user')
    }
  } catch (error) {
    throw error
  }
}
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      return null
    }
    // Transform flat address fields to nested address object to match the expected type structure
    if (data) {
      // The actual database has flat address fields, so we cast to any to access them
      // Return the data as-is with flat address fields from database
      return data as Profile
    }
    return data
  } catch (error) {
    return null
  }
}
export async function updateUserProfile(
  userId: string,
  updates: Database['public']['Tables']['profiles']['Update'],
): Promise<Profile> {
  try {
    // Update with flat address fields directly - no transformation needed
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()
    if (error) {
      throw new Error('Failed to update user profile')
    }
    // Return the data as-is with flat address fields
    return data as Profile
  } catch (error) {
    throw error
  }
}
export async function getTeacherCourses(teacherId: string): Promise<Course[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select(
        `
        *,
        gurukuls (*)
      `,
      )
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
    if (error) {
      return []
    }
    return data || []
  } catch (error) {
    return []
  }
}
