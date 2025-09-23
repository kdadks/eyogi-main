import React, { useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthContextType } from './AuthContextTypes'
import type { Profile } from '../types'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const initializationRef = React.useRef(false)
  const location = useLocation()

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  useEffect(() => {
    let isMounted = true

    // Skip full initialization if on public pages (not admin pages)
    // Handle both direct admin paths and ssh-app prefixed paths
    const isAdminPage =
      (location.pathname.startsWith('/admin') || location.pathname.includes('/admin')) &&
      !location.pathname.includes('/admin/login')

    // Debug logging (set to false to reduce console noise)
    const DEBUG_AUTH = true
    if (DEBUG_AUTH && import.meta.env.DEV) {
      console.log('AuthContext:', {
        path: location.pathname,
        isAdminPage: isAdminPage,
        action: isAdminPage ? 'initializing' : 'skipping (public page)',
      })
    }

    if (!isAdminPage) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      setInitialized(true)
      return
    }

    // Reset initialization when moving to admin pages from non-admin pages, or when no user but we might have a session
    const shouldReinitialize =
      isAdminPage && (!user || (!initialized && !initializationRef.current))

    if (isAdminPage && !initialized) {
      initializationRef.current = false
    }

    // Prevent double initialization in React StrictMode, but allow re-initialization if needed
    if (initializationRef.current && initialized && !shouldReinitialize) {
      console.log('AuthContext: Skipping duplicate initialization (already completed)')
      return
    }

    if (initializationRef.current && !initialized) {
      console.log('AuthContext: Previous initialization incomplete, allowing retry')
    } else if (shouldReinitialize) {
      console.log('AuthContext: Re-initializing due to page change or missing user')
      initializationRef.current = false
    } else {
      console.log('AuthContext: First initialization attempt')
    }

    initializationRef.current = true

    // Fast initialization
    const initAuth = async () => {
      try {
        console.log('AuthContext: Starting fast initialization...')

        let session = null
        let sessionError = null

        try {
          // Simple session check without timeouts
          console.log('AuthContext: Getting session...')
          const result = await supabase.auth.getSession()
          session = result.data.session
          sessionError = result.error
          console.log('AuthContext: Session check completed successfully', {
            hasSession: !!session,
            error: sessionError,
          })
        } catch (error) {
          console.warn('AuthContext: Session check failed:', error)
          session = null
        }

        if (!isMounted) return

        const currentUser = session?.user ?? null
        console.log(
          'AuthContext: Setting user:',
          currentUser ? `logged in user ${currentUser.id}` : 'no user',
        )
        setUser(currentUser)

        // Only fetch profile if user exists and not on login page
        const shouldFetchProfile = currentUser && !location.pathname.includes('/admin/login')
        console.log('AuthContext: Profile fetch decision:', {
          hasUser: !!currentUser,
          currentPath: location.pathname,
          includesLogin: location.pathname.includes('/admin/login'),
          shouldFetchProfile,
        })

        if (shouldFetchProfile) {
          console.log('AuthContext: User exists, fetching profile for user:', currentUser.id)
          // Keep loading true during profile fetch
          setLoading(true)
          try {
            const userProfile = await fetchProfile(currentUser.id)
            if (isMounted) {
              setProfile(userProfile)
              console.log('AuthContext: Profile set:', userProfile?.role || 'no role')
            }
          } catch (error) {
            console.warn('AuthContext: Profile fetch failed:', error)
            if (isMounted) setProfile(null)
          } finally {
            if (isMounted) {
              setLoading(false)
            }
          }
        } else {
          console.log(
            'AuthContext: No user or on login page, clearing profile. User:',
            !!currentUser,
            'Path:',
            location.pathname,
          )
          setProfile(null)
        }

        if (isMounted) {
          // Only set initialized true and loading false if we're not fetching profile
          if (!shouldFetchProfile) {
            console.log(
              'AuthContext: Setting loading false and initialized true (no profile fetch needed)',
            )
            setLoading(false)
            setInitialized(true)
          } else {
            console.log(
              'AuthContext: Profile fetch in progress, will complete in profile fetch block',
            )
            setInitialized(true)
          }
          console.log('AuthContext: Initialization process completed')
        } else {
          console.warn('AuthContext: Component unmounted before completion')
        }
      } catch (error) {
        console.error('AuthContext: Initialization error:', error)
        if (isMounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
          setInitialized(true)
          console.log('AuthContext: Initialization completed with error')
        }
      }
    }

    // Backup timeout
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('AuthContext: Backup timeout fired - forcing initialization completion')
        setUser(null)
        setProfile(null)
        setLoading(false)
        setInitialized(true)
      } else {
        console.warn('AuthContext: Backup timeout fired but component unmounted')
      }
    }, 6000) // Increased to 6 seconds to give more time

    console.log('AuthContext: Starting initAuth...')
    initAuth().finally(() => {
      console.log('AuthContext: initAuth completed, clearing timeout')
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
        console.log(
          'AuthContext: On public page, skipping auth state change:',
          event,
          'Current path:',
          location.pathname,
        )
        return
      }

      console.log(
        'Auth state changed:',
        event,
        session ? 'with session' : 'no session',
        'Current path:',
        location.pathname,
      )

      // Set loading true during auth change processing
      setLoading(true)

      const currentUser = session?.user ?? null
      setUser(currentUser)

      // Fetch profile if user exists
      if (currentUser) {
        console.log('AuthContext: Fetching profile for auth change, user:', currentUser.id)
        try {
          const userProfile = await fetchProfile(currentUser.id)
          if (isMounted) {
            setProfile(userProfile)
            console.log('AuthContext: Profile updated after auth change:', userProfile?.role)
          }
        } catch (error) {
          console.error('AuthContext: Profile fetch failed in auth change:', error)
          if (isMounted) setProfile(null)
        }
      } else {
        setProfile(null)
        console.log('AuthContext: No user, profile cleared')
      }

      if (isMounted) {
        setLoading(false)
        setInitialized(true)
        console.log('AuthContext: Auth change processing completed')
      }
    })

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [initialized, location, user]) // Re-run when pathname changes or user state changes

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
      console.log('AuthContext: Starting signOut...')

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

      console.log('AuthContext: SignOut completed')
    } catch (error) {
      console.error('AuthContext: SignOut error:', error)
      // Still clear local state
      setUser(null)
      setProfile(null)
    }
  }

  // Check if user has admin privileges
  const isSuperAdmin =
    !!user && !!profile && ['admin', 'business_admin', 'super_admin'].includes(profile.role)

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
    isSuperAdmin,
    canAccess,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
