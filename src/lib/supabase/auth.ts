/**
 * Supabase Auth utilities
 * Handles user authentication, session management, and role-based access
 */

import { createAdminClient } from './server'
import type { Session, User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  user_metadata?: {
    full_name?: string
    role?: 'admin' | 'teacher' | 'student' | 'parent' | 'member' | 'public'
  }
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.getUser()
    return error ? null : (data?.user as AuthUser | null)
  } catch (error) {
    return null
  }
}

/**
 * Get user role from database
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.from('users').select('role').eq('id', userId).single()
    return data?.role || null
  } catch (error) {
    return null
  }
}

/**
 * Check if user has required role
 */
export async function checkUserRole(
  userId: string,
  requiredRole: string | string[],
): Promise<boolean> {
  const userRole = await getUserRole(userId)
  if (!userRole) return false

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return roles.includes(userRole)
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.getUser(token)
    return error ? null : (data?.user as AuthUser | null)
  } catch (error) {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

/**
 * Create user account
 */
export async function createUserAccount(
  email: string,
  password: string,
  metadata?: {
    full_name?: string
    role?: string
  },
) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    })

    if (error) return { error: error.message }

    // Also create user record in users table
    if (data?.user?.id) {
      const { error: dbError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        full_name: metadata?.full_name,
        role: metadata?.role || 'public',
      })

      if (dbError) return { error: dbError.message }
    }

    return { data: data.user }
  } catch (error) {
    return { error: String(error) }
  }
}

/**
 * Update user email
 */
export async function updateUserEmail(userId: string, newEmail: string) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      email: newEmail,
      email_confirm: true,
    })
    return error ? { error: error.message } : { data: data.user }
  } catch (error) {
    return { error: String(error) }
  }
}

/**
 * Reset user password
 */
export async function resetUserPassword(userId: string, password: string) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password,
    })
    return error ? { error: error.message } : { data: data.user }
  } catch (error) {
    return { error: String(error) }
  }
}
