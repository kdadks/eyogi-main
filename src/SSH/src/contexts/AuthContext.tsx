import React, { useEffect, useState, useCallback } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { useLocation } from 'react-router-dom'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { AuthContext, type AuthContextType } from './AuthContextTypes'
import type { Profile } from '../types'
import { debugAuth } from '../lib/authDebug'
import { decryptProfileFields } from '../lib/encryption'
interface AuthProviderProps {
  children: React.ReactNode
}
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const initializationRef = React.useRef(false)
  const profileFetchingRef = React.useRef(false)
  const currentInitId = React.useRef<string | null>(null)
  const isMounted = React.useRef(true)
  const location = useLocation()

  // Inactivity timeout: 30 minutes
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
  const inactivityTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = React.useRef<number>(Date.now())
  // Fetch user profile from database using admin client for admin context
  const fetchProfile = useCallback(
    async (userId: string, retryCount = 0): Promise<Profile | null> => {
      try {
        // Add a small delay for retries to avoid overwhelming the server
        if (retryCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
        }

        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          // Retry on network errors up to 2 times
          if (
            retryCount < 2 &&
            (error.message.includes('network') || error.message.includes('INSUFFICIENT_RESOURCES'))
          ) {
            return fetchProfile(userId, retryCount + 1)
          }

          return null
        }

        // Decrypt profile fields before returning
        return data ? decryptProfileFields(data) : data
      } catch {
        // Retry on network exceptions
        if (retryCount < 2) {
          return fetchProfile(userId, retryCount + 1)
        }

        return null
      }
    },
    [],
  )
  useEffect(() => {
    const initId = Math.random().toString(36).substring(7)
    currentInitId.current = initId

    // Skip full initialization if on public pages (not admin pages)
    const isAdminPage =
      (location.pathname.startsWith('/admin') || location.pathname.includes('/admin')) &&
      !location.pathname.includes('/admin/login')

    if (!isAdminPage) {
      // Don't initialize Supabase auth on non-admin pages
      setLoading(false)
      setInitialized(true)
      return
    }

    // For admin pages: mark session as active
    sessionStorage.setItem('eyogi-admin-session', 'true')

    // For admin pages: just show login, no checking
    if (initializationRef.current) {
      return
    }

    initializationRef.current = true

    // Always show login form - let the form handle authentication
    setUser(null)
    setProfile(null)
    setLoading(false)
    setInitialized(true)
    initializationRef.current = false

    return () => {
      isMounted.current = false
      initializationRef.current = false
      profileFetchingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Supabase Auth is ONLY for super_admin and business_admin login
  // All other logins (student, parent, teacher) use WebsiteAuthContext
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        debugAuth.error('Supabase Auth login failed', { error: error.message, email })
        return { error: error.message }
      }

      if (data.user) {
        // Fetch profile to verify role
        const userProfile = await fetchProfile(data.user.id)

        if (!userProfile) {
          debugAuth.error('Profile not found for authenticated user', { userId: data.user.id })
          await supabase.auth.signOut()
          return { error: 'Profile not found' }
        }

        // Only allow super_admin and business_admin to log in via Supabase Auth
        if (userProfile.role !== 'super_admin' && userProfile.role !== 'business_admin') {
          debugAuth.error('Unauthorized role for Supabase Auth login', { role: userProfile.role })
          await supabase.auth.signOut()
          return { error: 'Unauthorized access. This login is for administrators only.' }
        }

        setUser(data.user)
        setProfile(userProfile)
        sessionStorage.setItem('eyogi-admin-session', 'true')
        debugAuth.log('Supabase Auth login successful', { email, role: userProfile.role })
        return { error: null }
      }

      return { error: 'Login failed' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      debugAuth.error('Supabase Auth login exception', { error: errorMessage })
      return { error: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }

      // Sign out from Supabase Auth (for super_admin and business_admin)
      await supabase.auth.signOut()

      // Clear all session data
      setUser(null)
      setProfile(null)
      setLoading(false)
      setInitialized(true)
      sessionStorage.removeItem('eyogi-admin-session')

      debugAuth.log('Signed out successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      debugAuth.error('Sign out error', { error: errorMessage })
      // Still clear local state on error
      setUser(null)
      setProfile(null)
      sessionStorage.removeItem('eyogi-admin-session')
    }
  }

  // Inactivity timeout tracking
  useEffect(() => {
    if (
      !user ||
      !location.pathname.includes('/admin') ||
      location.pathname.includes('/admin/login')
    ) {
      // Clear timer if not on admin page or not logged in
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      return
    }

    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now()

      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }

      // Set new timer
      inactivityTimerRef.current = setTimeout(async () => {
        console.log('Auto-logout due to inactivity (30 minutes)')
        await signOut()
        // Redirect to home page instead of login page
        window.location.href = '/ssh-app'
      }, INACTIVITY_TIMEOUT)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      resetInactivityTimer()
    }

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    // Initialize timer
    resetInactivityTimer()

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [user, location.pathname])
  // Check if user has admin privileges
  const isSuperAdmin =
    !!user && !!profile && ['admin', 'business_admin', 'super_admin'].includes(profile.role)
  const updateAuthState = async (): Promise<{ user: User | null; profile: Profile | null }> => {
    const { data } = await supabase.auth.getUser()
    const authUser = data.user
    if (authUser) {
      const userProfile = await fetchProfile(authUser.id)
      setUser(authUser)
      setProfile(userProfile)
      return { user: authUser, profile: userProfile }
    } else {
      setUser(null)
      setProfile(null)
      return { user: null, profile: null }
    }
  }
  const canManageCertificates = profile?.role === 'super_admin' || profile?.role === 'admin'
  const canAssignTemplates = profile?.role === 'super_admin' || profile?.role === 'admin'
  const isTeacher = profile?.role === 'teacher'
  const canAccess = (): boolean => {
    return isSuperAdmin
  }
  const value: AuthContextType = {
    user,
    profile,
    loading,
    initialized,
    signIn,
    signOut,
    updateAuthState,
    isSuperAdmin,
    canManageCertificates,
    canAssignTemplates,
    isTeacher,
    canAccess,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export default AuthProvider
