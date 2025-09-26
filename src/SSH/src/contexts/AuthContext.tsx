import React, { useEffect, useState, useCallback } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { useLocation } from 'react-router-dom'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { AuthContext, type AuthContextType } from './AuthContextTypes'
import type { Profile } from '../types'
import { debugAuth } from '../lib/authDebug'
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
  const location = useLocation()
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

        return data
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
    let isMounted = true
    // Skip full initialization if on public pages (not admin pages)
    // Handle both direct admin paths and ssh-app prefixed paths
    const isAdminPage =
      (location.pathname.startsWith('/admin') || location.pathname.includes('/admin')) &&
      !location.pathname.includes('/admin/login')
    // Debug logging disabled for production
    if (!isAdminPage) {
      // Don't clear user state on login page - just mark as initialized
      // This prevents losing auth state during navigation
      setLoading(false)
      setInitialized(true)
      return
    }
    // For production reliability on hard refresh, we need simpler logic
    // Skip if already properly initialized with user/profile data
    if (initialized && (user || location.pathname.includes('/admin/login'))) {
      return
    }

    // Prevent concurrent initialization
    if (initializationRef.current) {
      return
    }

    initializationRef.current = true
    // Fast initialization
    const initAuth = async () => {
      try {
        let session = null

        try {
          // For production, add a race condition timeout to prevent hanging
          const sessionPromise = supabase.auth.getSession()
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Session check timeout')), 2000),
          )

          const result = await Promise.race([sessionPromise, timeoutPromise])
          session = result.data.session
          if (result.error) {
            console.error('Session error:', result.error)
            session = null
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          debugAuth.warn('Session check failed or timed out', {
            error: errorMessage,
            pathname: location.pathname,
          })
          session = null
        }
        if (!isMounted) return
        const currentUser = session?.user ?? null
        setUser(currentUser)
        // Only fetch profile if user exists and not on login page
        const shouldFetchProfile = currentUser && !location.pathname.includes('/admin/login')
        if (shouldFetchProfile && !profileFetchingRef.current) {
          // Prevent concurrent profile fetches
          profileFetchingRef.current = true
          // Keep loading true during profile fetch
          setLoading(true)
          try {
            const userProfile = await fetchProfile(currentUser.id)
            if (isMounted) {
              setProfile(userProfile)
            }
          } catch {
            if (isMounted) setProfile(null)
          } finally {
            profileFetchingRef.current = false
            if (isMounted) {
              setLoading(false)
            }
          }
        } else {
          setProfile(null)
        }
        if (isMounted) {
          // Only set initialized true and loading false if we're not fetching profile
          if (!shouldFetchProfile) {
            setLoading(false)
            setInitialized(true)
          } else {
            setInitialized(true)
          }
        } else {
          // No session found, already set to null
        }
      } catch {
        if (isMounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
          setInitialized(true)
        }
      }
    }
    // Backup timeout - shorter for better UX in production
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        // In production, we want to fail fast rather than show infinite spinner
        debugAuth.warn('Auth initialization timeout - setting initialized state', {
          pathname: location.pathname,
          hadUser: !!user,
          hadProfile: !!profile,
        })
        setUser(null)
        setProfile(null)
        setLoading(false)
        setInitialized(true)
      } else {
        // Component unmounted, no action needed
      }
    }, 3000) // Reduced to 3 seconds for better production UX
    initAuth().finally(() => {
      clearTimeout(timeoutId)
    })
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted) return
      // Skip auth state processing on public pages unless it's a SIGNED_IN event
      const isAdminPage = location.pathname.includes('/admin')
      if (!isAdminPage && event !== 'SIGNED_IN') {
        return
      }
      // Set loading true during auth change processing
      setLoading(true)
      const currentUser = session?.user ?? null
      setUser(currentUser)
      // Fetch profile if user exists
      if (currentUser) {
        try {
          const userProfile = await fetchProfile(currentUser.id)
          if (isMounted) {
            setProfile(userProfile)
          }
        } catch {
          if (isMounted) setProfile(null)
        }
      } else {
        setProfile(null)
      }
      if (isMounted) {
        setLoading(false)
        setInitialized(true)
      }
    })
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [initialized, location, user, profile, fetchProfile]) // Re-run when pathname changes or user state changes

  // Recovery mechanism for stuck loading states in production
  useEffect(() => {
    const isAdminPage =
      location.pathname.includes('/admin') && !location.pathname.includes('/admin/login')

    if (isAdminPage && loading && initialized) {
      // If we're in an inconsistent state (loading=true but initialized=true), fix it
      debugAuth.warn('Fixing inconsistent auth state: loading=true but initialized=true', {
        pathname: location.pathname,
        userExists: !!user,
        profileExists: !!profile,
      })
      setLoading(false)
    }

    // Additional timeout for hard refresh scenarios
    if (isAdminPage && !initialized) {
      const recoveryTimeout = setTimeout(() => {
        debugAuth.warn('Force initializing auth state after extended delay', {
          pathname: location.pathname,
          timeElapsed: '5000ms',
        })
        setInitialized(true)
        setLoading(false)
      }, 5000) // 5 second recovery timeout

      return () => clearTimeout(recoveryTimeout)
    }
  }, [location.pathname, loading, initialized, user, profile])
  // Sign in for super admin only (Supabase Auth)
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (err) {
      return { error: err }
    }
  }
  const signOut = async () => {
    try {
      // Clear local state immediately
      setUser(null)
      setProfile(null)
      setLoading(false)
      setInitialized(true)
      // Sign out from Supabase with global scope
      await supabase.auth.signOut({ scope: 'global' })
      // Clear storage
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      // Still clear local state
      setUser(null)
      setProfile(null)
    }
  }
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
