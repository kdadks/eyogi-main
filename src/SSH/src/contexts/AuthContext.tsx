import React, { useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthContextType } from './AuthContextTypes'
import type { Profile } from '../types'

// useAuth hook moved to hooks/useAuth.ts to fix Fast Refresh issue

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

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

    // Get initial session with timeout
    const getSession = async () => {
      try {
        console.log('AuthContext: Starting session initialization...')

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 5000),
        )

        let session = null
        let sessionError = null

        try {
          const result = await Promise.race([supabase.auth.getSession(), timeoutPromise])
          session = result.data.session
          sessionError = result.error
        } catch (error) {
          console.warn('AuthContext: Session call timed out or failed:', error)
          // Continue with null session
        }

        console.log('AuthContext: Session result:', { session: !!session, error: sessionError })

        if (!isMounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        // Fetch profile if user exists
        if (currentUser) {
          console.log('AuthContext: Fetching profile for user:', currentUser.id)
          const userProfile = await fetchProfile(currentUser.id)
          setProfile(userProfile)
          console.log('AuthContext: Profile loaded:', !!userProfile)
        } else {
          setProfile(null)
          console.log('AuthContext: No user session found')
        }

        setLoading(false)
        setInitialized(true)
        console.log('AuthContext: Initialization completed')
      } catch (error) {
        console.error('AuthContext: Error getting initial session:', error)
        if (isMounted) {
          // Force complete initialization even on error
          setUser(null)
          setProfile(null)
          setLoading(false)
          setInitialized(true)
          console.log('AuthContext: Initialization completed with error')
        }
      }
    }

    // Set a backup timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('AuthContext: Backup timeout - forcing completion')
      if (isMounted) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        setInitialized(true)
      }
    }, 8000) // 8 second backup timeout

    getSession().finally(() => {
      clearTimeout(timeoutId)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted) return

      const currentUser = session?.user ?? null
      setUser(currentUser)

      // Fetch profile if user exists
      if (currentUser) {
        const userProfile = await fetchProfile(currentUser.id)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }

      setLoading(false)
      setInitialized(true)
    })

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

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
      console.log('AuthContext: Starting signOut process...')

      // Clear local state immediately
      setUser(null)
      setProfile(null)
      setLoading(false)
      setInitialized(true)

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('AuthContext: Supabase signOut error:', error)
      } else {
        console.log('AuthContext: Supabase signOut successful')
      }

      // Clear any cached data from localStorage/sessionStorage
      try {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.clear()
      } catch (storageError) {
        console.warn('AuthContext: Error clearing storage:', storageError)
      }

      // Force page reload to ensure clean state
      console.log('AuthContext: Redirecting to login...')
      window.location.replace('/ssh-app/admin/login')

    } catch (error) {
      console.error('AuthContext: signOut error:', error)
      // Force redirect even if there's an error
      setUser(null)
      setProfile(null)
      window.location.replace('/ssh-app/admin/login')
    }
  }

  // Check if user has admin privileges (admin, business_admin, or super_admin)
  const isSuperAdmin =
    !!user && !!profile && ['admin', 'business_admin', 'super_admin'].includes(profile.role)

  const canAccess = (): boolean => {
    // Super admin has access to everything
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
