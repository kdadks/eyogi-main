import { supabaseAdmin } from '../supabase'
import type { Database } from '../supabase'
import type { Course } from '../../types'
type Profile = Database['public']['Tables']['profiles']['Row'] & {
  grade?: string
  address_line_1?: string
  address_line_2?: string
  zip_code?: string
  city?: string
  state?: string
  country?: string
}
export async function getAllUsers(): Promise<Profile[]> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    return []
  }
  return data || []
}
export async function updateUserRole(userId: string, newRole: Profile['role']): Promise<Profile> {
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
}
export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('profiles').delete().eq('id', userId)
  if (error) {
    throw new Error('Failed to delete user')
  }
}
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single()
  if (error) {
    console.error('getUserProfile error:', error)
    return null
  }
  // If address is present and is an object, return as is
  if (data && typeof data.address === 'object' && data.address !== null) {
    return data as Profile
  }
  // If address is missing, reconstruct from flat fields
  if (data) {
    const d = data as Profile
    const address = {
      country: d.country || '',
      state: d.state || '',
      city: d.city || '',
      street: (d as { street?: string }).street || '',
      postal_code: (d as { postal_code?: string }).postal_code || '',
    }
    return {
      ...data,
      address,
    } as Profile
  }
  return data
}
export async function updateUserProfile(
  userId: string,
  updates: Database['public']['Tables']['profiles']['Update'],
): Promise<Profile> {
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
  } catch {
    return []
  }
}
