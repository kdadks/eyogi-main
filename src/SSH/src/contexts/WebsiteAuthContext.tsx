import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabaseAdmin } from '../lib/supabase'
import { generateNextId } from '../lib/idGenerator'
import { getUserProfile } from '../lib/api/users'
import type { Database } from '../lib/supabase'
type Profile = Database['public']['Tables']['profiles']['Row']
// Simple password hashing function (for development - use bcrypt in production)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'eyogi-salt-2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}
interface WebsiteAuthContextType {
  // Current website user (from profiles table only)
  user: Profile | null
  loading: boolean
  initialized: boolean
  // Website user authentication
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (userData: {
    email: string
    password: string
    full_name: string
    role: 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent'
    phone?: string
    date_of_birth?: string
  }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  // Check permissions
  canAccess: (resource: string, action: string) => boolean
}
const WebsiteAuthContext = createContext<WebsiteAuthContextType | undefined>(undefined)
// eslint-disable-next-line react-refresh/only-export-components
export const useWebsiteAuth = () => {
  const context = useContext(WebsiteAuthContext)
  if (context === undefined) {
    throw new Error('useWebsiteAuth must be used within a WebsiteAuthProvider')
  }
  return context
}
interface WebsiteAuthProviderProps {
  children: React.ReactNode
}
export const WebsiteAuthProvider: React.FC<WebsiteAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    // Check for stored session
    const storedUserId = localStorage.getItem('website-user-id')
    if (storedUserId) {
      loadUser(storedUserId)
    } else {
      setLoading(false)
      setInitialized(true)
    }
  }, [])
  const loadUser = async (userId: string) => {
    try {
      const userData = await getUserProfile(userId)
      if (!userData) {
        localStorage.removeItem('website-user-id')
        setUser(null)
      } else {
        setUser(userData)
      }
    } catch (error) {
      localStorage.removeItem('website-user-id')
      setUser(null)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }
  const signIn = async (email: string, password: string) => {
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()
      if (userError || !userData) {
        return { error: 'Invalid email or password' }
      }
      // Check if user has a password hash
      if (!userData.password_hash) {
        return { error: 'Account not properly configured. Please contact support.' }
      }
      // Verify password
      const isValidPassword = await verifyPassword(password, userData.password_hash)
      if (!isValidPassword) {
        return { error: 'Invalid email or password' }
      }
      // Check account status
      if (userData.status !== 'active') {
        return { error: 'Account is not active. Please contact support.' }
      }
      // Load full user profile with properly structured address
      const fullUserProfile = await getUserProfile(userData.id)
      if (!fullUserProfile) {
        return { error: 'Failed to load user profile. Please try again.' }
      }
      // Set user session
      setUser(fullUserProfile)
      localStorage.setItem('website-user-id', userData.id)
      return { error: null }
    } catch (error) {
      return { error: 'Failed to sign in. Please try again.' }
    }
  }
  const signUp = async (userData: {
    email: string
    password: string
    full_name: string
    role: 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent'
    phone?: string
    date_of_birth?: string
  }) => {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', userData.email.toLowerCase())
        .single()
      if (existingUser) {
        return { error: 'An account with this email already exists' }
      }
      // Hash password
      const passwordHash = await hashPassword(userData.password)
      // Generate the appropriate ID based on role
      const generatedId = await generateNextId(userData.role)
      // Create user profile
      const profileData = {
        email: userData.email.toLowerCase(),
        password_hash: passwordHash,
        full_name: userData.full_name,
        role: userData.role,
        status: 'active',
        phone: userData.phone || null,
        date_of_birth: userData.date_of_birth || null,
        preferences: {},
        address_line_1: null,
        address_line_2: null,
        city: null,
        state: null,
        zip_code: null,
        country: null,
        emergency_contact: null,
        avatar_url: null,
        parent_id: null,
        ...(userData.role === 'student'
          ? { student_id: generatedId, teacher_id: null }
          : { student_id: null, teacher_id: generatedId }),
      }
      const { error: createError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData)
        .select()
        .single()
      if (createError) {
        return { error: `Failed to create account: ${createError.message || 'Unknown error'}` }
      }
      return { error: null }
    } catch (error) {
      return {
        error: `Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }
  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('website-user-id')
  }
  const canAccess = (resource: string, action: string): boolean => {
    if (!user) return false
    // Role-based permissions with component-level access control
    switch (user.role) {
      case 'admin':
        return true // Admin can access everything
      case 'business_admin': {
        // Business Admin has access to specific components only
        const businessAdminResources = [
          'dashboard',
          'certificates',
          'courses',
          'assignments',
          'enrollments',
          'students',
          'gurukuls',
          'content',
        ]
        return businessAdminResources.includes(resource)
      }
      case 'teacher': {
        // Teachers can access courses they're assigned to, their students, and enrollments
        const teacherResources = ['courses', 'students', 'enrollments', 'dashboard']
        return teacherResources.includes(resource) || (resource === 'users' && action === 'read')
      }
      case 'student':
        return (
          (resource === 'courses' && (action === 'read' || action === 'enroll')) ||
          resource === 'dashboard' ||
          resource === 'profile'
        )
      default:
        return false
    }
  }
  const value: WebsiteAuthContextType = {
    user,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    canAccess,
  }
  return <WebsiteAuthContext.Provider value={value}>{children}</WebsiteAuthContext.Provider>
}
export default WebsiteAuthProvider
