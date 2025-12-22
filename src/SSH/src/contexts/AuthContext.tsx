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
  const location = useLocation()

  // Inactivity timeout: 15 minutes
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutes in milliseconds
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
    let isMounted = true
    // Skip full initialization if on public pages (not admin pages)
    // Handle both direct admin paths and ssh-app prefixed paths
    const isAdminPage =
      (location.pathname.startsWith('/admin') || location.pathname.includes('/admin')) &&
      !location.pathname.includes('/admin/login')
    // Debug logging disabled for production
    if (!isAdminPage) {
      // Don't initialize Supabase auth on non-admin pages
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
          // Get session without aggressive timeout
          const { data, error } = await supabase.auth.getSession()
          session = data.session

          if (error) {
            console.error('Session error:', error)

            // Handle refresh token errors - these require re-login
            if (
              error.message &&
              (error.message.includes('refresh') ||
                error.message.includes('Refresh Token') ||
                error.message.includes('Invalid Refresh Token'))
            ) {
              debugAuth.warn('Invalid refresh token - clearing session', {
                error: error.message,
                pathname: location.pathname,
              })
              await supabase.auth.signOut({ scope: 'local' })
              session = null
            }
            // Only clear on actual auth errors, not timeouts
            else if (
              error.message &&
              !error.message.includes('timeout') &&
              !error.message.includes('network')
            ) {
              await supabase.auth.signOut({ scope: 'local' })
              session = null
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          debugAuth.warn('Session check failed', {
            error: errorMessage,
            pathname: location.pathname,
          })

          // Handle refresh token errors in catch block too
          if (errorMessage.includes('refresh') || errorMessage.includes('Refresh Token')) {
            debugAuth.warn('Invalid refresh token in catch - clearing session')
            try {
              await supabase.auth.signOut({ scope: 'local' })
            } catch {
              // Silent fail on signout error
            }
            session = null
          }
          // Don't clear session on network/timeout errors - keep existing session
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

          // Timeout for profile fetch - don't let it hang forever
          const profileTimeout = setTimeout(() => {
            if (isMounted && profileFetchingRef.current) {
              debugAuth.warn('Profile fetch timeout - proceeding without profile')
              profileFetchingRef.current = false
              if (isMounted) {
                setProfile(null)
                setLoading(false)
              }
            }
          }, 3000) // 3 second timeout for profile fetch

          try {
            const userProfile = await fetchProfile(currentUser.id)
            clearTimeout(profileTimeout)
            if (isMounted) {
              setProfile(userProfile)
            }
          } catch {
            clearTimeout(profileTimeout)
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
    // Start auth initialization
    initAuth()

    // Only set up auth listener on admin pages
    let subscription: { unsubscribe: () => void } | null = null
    if (isAdminPage) {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
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
        },
      )
      subscription = authSubscription
    }

    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
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
      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }

      // Clear local state immediately
      setUser(null)
      setProfile(null)
      setLoading(false)
      setInitialized(true)
      // Sign out from Supabase with global scope
      await supabase.auth.signOut({ scope: 'global' })
      // Clear only auth-related storage
      localStorage.removeItem('eyogi-ssh-app-auth')
      sessionStorage.removeItem('eyogi-ssh-app-auth')
    } catch {
      // Still clear local state
      setUser(null)
      setProfile(null)
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
        console.log('Auto-logout due to inactivity (15 minutes)')
        await signOut()
        window.location.href = '/admin/login'
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
