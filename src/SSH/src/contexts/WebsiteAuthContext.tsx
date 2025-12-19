import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabaseAdmin } from '../lib/supabase'
import { generateRoleId } from '../lib/id-generator'
import { getUserProfile } from '../lib/api/users'
import { getUserPermissions } from '../lib/api/permissions'
import { queryCache } from '../lib/cache'
import { encryptProfileFields, decryptField } from '../lib/encryption'
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
    age?: number
    country?: string
    state?: string
    city?: string
    emergency_contact?: {
      name?: string
      phone?: string
      email?: string
      relationship?: string
    }
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
  const [userPermissions, setUserPermissions] = useState<
    Array<{ resource: string; action: string }>
  >([])
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

    // Listen for GDPR deletion broadcasts
    const channel = new BroadcastChannel('gdpr-deletion-channel')
    channel.onmessage = (event) => {
      // Only logout if the deleted user is the current user AND they are not an admin
      // Admins performing deletions should not be logged out
      if (
        event.data.type === 'user-deleted' &&
        user?.id === event.data.userId &&
        user?.role !== 'admin' &&
        user?.role !== 'business_admin' &&
        user?.role !== 'super_admin'
      ) {
        // This user has been deleted, force logout and redirect
        setUser(null)
        setUserPermissions([])
        localStorage.removeItem('website-user-id')
        localStorage.removeItem('eyogi-ssh-local-session')
        window.location.href = '/'
      }
    }

    return () => {
      channel.close()
    }
  }, [user?.id, user?.role])
  const loadUser = async (userId: string) => {
    try {
      // Invalidate user profile cache to ensure fresh decrypted data
      queryCache.invalidatePattern(`users:profile:${userId}`)

      const userData = await getUserProfile(userId)
      if (!userData) {
        localStorage.removeItem('website-user-id')
        setUser(null)
        setUserPermissions([])
      } else {
        setUser(userData)
        // Load user permissions from database
        try {
          const permissions = await getUserPermissions(userId)
          const permissionMap = permissions
            .map((perm) => ({
              resource: perm.permission?.resource || '',
              action: perm.permission?.action || '',
            }))
            .filter((perm) => perm.resource && perm.action)
          setUserPermissions(permissionMap)
        } catch (error) {
          console.warn('Failed to load user permissions:', error)
          setUserPermissions([])
        }
      }
    } catch {
      // Clear invalid session data on any error
      localStorage.removeItem('website-user-id')
      setUser(null)
      setUserPermissions([])
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
      // Allow login for all statuses except suspended
      // Users with pending_verification can log in but will see appropriate banners
      if (userData.status === 'suspended') {
        return {
          error:
            'Your account has been suspended. For activation, kindly get in touch with the administrator.',
        }
      }

      // Invalidate user profile cache to ensure fresh decrypted data
      queryCache.invalidatePattern(`users:profile:${userData.id}`)

      // Load full user profile with properly structured address
      const fullUserProfile = await getUserProfile(userData.id)
      if (!fullUserProfile) {
        return { error: 'Failed to load user profile. Please try again.' }
      }
      // Set user session
      setUser(fullUserProfile)
      localStorage.setItem('website-user-id', userData.id)

      // Load user permissions from database
      try {
        const permissions = await getUserPermissions(userData.id)

        const permissionMap = permissions
          .map((perm) => ({
            resource: perm.permission?.resource || '',
            action: perm.permission?.action || '',
          }))
          .filter((perm) => perm.resource && perm.action)
        setUserPermissions(permissionMap)
      } catch (error) {
        console.error('Failed to load user permissions during sign in:', error)
        setUserPermissions([])
      }
      return { error: null }
    } catch {
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
    age?: number
    country?: string
    state?: string
    city?: string
    emergency_contact?: {
      name?: string
      phone?: string
      email?: string
      relationship?: string
    }
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

      console.log('Creating user with email:', userData.email.toLowerCase())

      // Hash password
      const passwordHash = await hashPassword(userData.password)

      // Generate the appropriate ID based on role using the new system
      const roleIds = await generateRoleId(
        userData.role,
        userData.country,
        userData.state,
        userData.city,
      )

      // Create user profile
      // All new registrations require admin approval before activation
      const profileData = {
        email: userData.email.toLowerCase(),
        password_hash: passwordHash,
        full_name: userData.full_name,
        role: userData.role,
        status: 'pending_verification',
        phone: userData.phone || null,
        date_of_birth: userData.date_of_birth || null,
        age: userData.age || null,
        preferences: {},
        address_line_1: null,
        address_line_2: null,
        city: userData.city || null,
        state: userData.state || null,
        zip_code: null,
        country: userData.country || null,
        emergency_contact: userData.emergency_contact || null,
        avatar_url: null,
        parent_id: null,
        // Spread the generated role IDs (student_id, teacher_code, parent_code, admin_code)
        ...roleIds,
      }

      // Encrypt sensitive profile fields before inserting
      const encryptedProfileData = encryptProfileFields(profileData)

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert(encryptedProfileData)
        .select()
        .single()

      if (createError || !newProfile) {
        console.error('Profile creation failed:', createError)
        return { error: `Failed to create account: ${createError?.message || 'Unknown error'}` }
      }

      console.log('Profile created successfully:', newProfile.id)

      // Send welcome email to user (non-blocking)
      // Wait to ensure database transaction is fully committed before sending email
      setTimeout(async () => {
        try {
          // Decrypt the full name from the stored profile before sending email
          const decryptedFullName = newProfile.full_name
            ? decryptField(newProfile.full_name)
            : userData.full_name

          const loginLink = `${window.location.origin}/ssh-app/`
          const apiBaseUrl = window.location.origin
          console.log(
            'Sending welcome email to:',
            userData.email.toLowerCase(),
            'via API:',
            `${apiBaseUrl}/api/auth/welcome`,
          )
          const welcomeResponse = await fetch(`${apiBaseUrl}/api/auth/welcome`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userData.email.toLowerCase(),
              fullName: decryptedFullName,
              loginLink: loginLink,
              role: userData.role,
            }),
          })

          if (!welcomeResponse.ok) {
            console.warn('Failed to send welcome email to user:', {
              status: welcomeResponse.status,
              statusText: welcomeResponse.statusText,
              email: userData.email.toLowerCase(),
            })
            const errorText = await welcomeResponse.text()
            console.warn('Welcome email API error response:', errorText)
          } else {
            console.log('Welcome email API call successful for:', userData.email.toLowerCase())
          }
        } catch (emailError) {
          console.warn('Error sending welcome email to user:', emailError)
        }
      }, 10000) // Wait 10 seconds to ensure DB transaction is committed

      // Send registration notification email to admin (non-blocking)
      // Wait a brief moment to ensure database transaction is committed
      setTimeout(async () => {
        try {
          const apiBaseUrl = window.location.origin
          const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userData.email.toLowerCase(),
              fullName: userData.full_name,
              role: userData.role,
              status: 'pending_verification',
            }),
          })

          if (!response.ok) {
            console.warn('Failed to send registration email notification:', {
              status: response.status,
              statusText: response.statusText,
            })
          } else {
            console.log('Registration notification email sent successfully')
          }
        } catch (emailError) {
          console.warn('Error sending registration email:', emailError)
        }
      }, 2500) // Wait 2.5 seconds, slightly after welcome email

      return { error: null }
    } catch (error) {
      return {
        error: `Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }
  const signOut = async () => {
    setUser(null)
    setUserPermissions([])
    localStorage.removeItem('website-user-id')
  }
  const canAccess = (resource: string, action: string): boolean => {
    if (!user) return false

    // Admins and Super Admins have unrestricted access to everything
    if (user.role === 'admin' || user.role === 'super_admin') {
      return true // Full access to all resources and actions
    }

    // All other roles (parent, student, teacher, business_admin) ONLY use database permissions
    // No hardcoded fallbacks - everything must be granted through admin interface
    const hasDbPermission = userPermissions.some(
      (perm) => perm.resource === resource && perm.action === action,
    )

    return hasDbPermission
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
