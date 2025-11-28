import { supabaseAdmin } from '../supabase'
import { queryCache, CACHE_DURATIONS, createCacheKey } from '../cache'
import type { Database } from '../supabase'
import type { Course } from '../../types'
import { normalizeCountryToISO3, normalizeStateToISO2 } from '../iso-utils'
import { generateStudentId } from '../id-generator'
import { encryptProfileFields, decryptProfileFields } from '../encryption'
import { logEncryptedFieldChanges, type ChangedByInfo } from './auditTrail'
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
  const cacheKey = createCacheKey('users', 'all')

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, role, student_id, created_at, updated_at, age')
        .order('created_at', { ascending: false })
      if (error) {
        return []
      }
      // Decrypt sensitive fields for each user
      const decryptedUsers = (data || []).map((user) => decryptProfileFields(user))
      return decryptedUsers as unknown as Profile[]
    },
    CACHE_DURATIONS.USER_PROFILE, // 5 minutes
  )
}

export async function getAllStudents(): Promise<Profile[]> {
  const cacheKey = createCacheKey('users', 'students')

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, role, student_id, created_at, updated_at, age')
        .eq('role', 'student')
        .not('student_id', 'is', null)
        .order('student_id', { ascending: true })
      if (error) {
        return []
      }
      // Decrypt sensitive fields for each student
      const decryptedStudents = (data || []).map((student) => decryptProfileFields(student))
      return decryptedStudents as unknown as Profile[]
    },
    CACHE_DURATIONS.USER_PROFILE, // 5 minutes
  )
}

export async function getAllTeachers(): Promise<Profile[]> {
  const cacheKey = createCacheKey('users', 'teachers')

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, role, student_id, created_at, updated_at, age')
        .eq('role', 'teacher')
        .order('full_name', { ascending: true })
      if (error) {
        return []
      }
      // Decrypt sensitive fields for each teacher
      const decryptedTeachers = (data || []).map((teacher) => decryptProfileFields(teacher))
      return decryptedTeachers as unknown as Profile[]
    },
    CACHE_DURATIONS.USER_PROFILE, // 5 minutes
  )
}

export async function updateUserRole(userId: string, newRole: Profile['role']): Promise<Profile> {
  const updateData: Partial<Profile> = {
    role: newRole,
    updated_at: new Date().toISOString(),
  }
  // If changing to student, assign student ID (requires country and state)
  if (newRole === 'student') {
    // Get user's country and state
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('country, state')
      .eq('id', userId)
      .single()

    if (userProfile?.country && userProfile?.state) {
      updateData.student_id = await generateStudentId(userProfile.country, userProfile.state)
    } else {
      throw new Error('Country and state are required to generate student ID')
    }
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

  // Invalidate user caches
  queryCache.invalidatePattern('users:.*')

  return data
}
export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('profiles').delete().eq('id', userId)
  if (error) {
    throw new Error('Failed to delete user')
  }

  // Invalidate user caches
  queryCache.invalidatePattern('users:.*')
}
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const cacheKey = createCacheKey('users', 'profile', userId)

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) {
        console.error('getUserProfile error:', error)
        return null
      }

      // Decrypt sensitive fields before returning
      if (data) {
        const decryptedData = decryptProfileFields(data)

        // If address is present and is an object, return as is
        if (typeof decryptedData.address === 'object' && decryptedData.address !== null) {
          return decryptedData as Profile
        }

        // If address is missing, reconstruct from flat fields
        const d = decryptedData as Profile
        const address = {
          country: d.country || '',
          state: d.state || '',
          city: d.city || '',
          street: (d as { street?: string }).street || '',
          postal_code: (d as { postal_code?: string }).postal_code || '',
        }
        return {
          ...decryptedData,
          address,
        } as Profile
      }
      return data
    },
    CACHE_DURATIONS.USER_PROFILE, // 5 minutes
  )
}
export async function updateUserProfile(
  userId: string,
  updates: Database['public']['Tables']['profiles']['Update'],
  changedBy?: ChangedByInfo,
): Promise<Profile> {
  // Get current profile data for audit trail comparison
  const { data: currentProfile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Normalize country and state codes to ISO format if provided
  let normalizedUpdates = { ...updates }

  if (updates.country) {
    normalizedUpdates.country = normalizeCountryToISO3(updates.country as string)
    if (updates.state) {
      normalizedUpdates.state = normalizeStateToISO2(
        updates.state as string,
        normalizedUpdates.country,
      )
    }
  }

  // Encrypt sensitive fields before saving to database
  const encryptedUpdates = encryptProfileFields(normalizedUpdates)

  // Update with encrypted data
  const updateData = {
    ...encryptedUpdates,
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

  // Log audit trail for encrypted field changes
  if (changedBy && currentProfile) {
    try {
      // Decrypt old data and use plaintext new data for proper comparison
      const decryptedOldData = decryptProfileFields(currentProfile)
      await logEncryptedFieldChanges(
        'profiles',
        userId,
        decryptedOldData as Record<string, unknown>,
        normalizedUpdates as Record<string, unknown>,
        changedBy,
        'UPDATE',
      )
    } catch (auditError) {
      console.error('Failed to log audit trail:', auditError)
      // Don't fail the update if audit trail fails
    }
  }

  // Invalidate user caches
  queryCache.invalidatePattern('users:.*')

  // Decrypt the data before returning to the caller
  const decryptedData = decryptProfileFields(data)
  return decryptedData as Profile
}
export async function getTeacherCourses(teacherId: string): Promise<Course[]> {
  const cacheKey = createCacheKey('users', 'teacher-courses', teacherId)

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('courses')
          .select(
            `
        *,
        gurukuls (*)
      `,
          )
          .eq('teacher_id', teacherId) // teacherId is profiles.id (UUID)
          .order('created_at', { ascending: false })
        if (error) {
          return []
        }
        return data || []
      } catch {
        return []
      }
    },
    CACHE_DURATIONS.COURSES, // 1 week (course data is stable)
  )
}
