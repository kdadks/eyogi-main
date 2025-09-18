import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  // Current authenticated super admin user (from Supabase Auth ONLY)
  user: User | null
  loading: boolean
  initialized: boolean

  // Super admin sign in (Supabase Auth only)
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>

  // Check if user is super admin (only users in Supabase Auth are super admins)
  isSuperAdmin: boolean

  // Check permissions
  canAccess: (resource: string, action: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🔐 [AUTH_PROVIDER] Initializing AuthProvider...')

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  console.log(
    '🔐 [AUTH_PROVIDER] Initial state - user:',
    user,
    'loading:',
    loading,
    'initialized:',
    initialized,
  )

  useEffect(() => {
    console.log('🔐 [AUTH_PROVIDER] useEffect triggered for auth initialization')
    let isMounted = true

    // Get initial session
    const getSession = async () => {
      console.log('🔐 [AUTH_PROVIDER] Getting initial session...')
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log('🔐 [AUTH_PROVIDER] Session retrieved:', !!session, 'User:', !!session?.user)

        if (!isMounted) {
          console.log('🔐 [AUTH_PROVIDER] Component unmounted, skipping state update')
          return
        }

        setUser(session?.user ?? null)
        setLoading(false)
        setInitialized(true)
        console.log('🔐 [AUTH_PROVIDER] Initial session processed successfully')
      } catch (error) {
        console.error('❌ [AUTH_PROVIDER] Error getting initial session:', error)
        if (isMounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    getSession()

    // Listen for auth changes
    console.log('🔐 [AUTH_PROVIDER] Setting up auth state change listener...')
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('🔐 [AUTH_PROVIDER] Auth state change:', event, 'Session:', !!session)

      if (!isMounted) {
        console.log('🔐 [AUTH_PROVIDER] Component unmounted, skipping auth state change')
        return
      }

      setUser(session?.user ?? null)
      setLoading(false)
      setInitialized(true)
    })

    return () => {
      console.log('🔐 [AUTH_PROVIDER] Cleaning up AuthProvider...')
      isMounted = false
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

      if (!error) {
        console.log('Super admin SignIn successful')
      }

      return { error }
    } catch (err) {
      console.error('SignIn error:', err)
      return { error: err }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // All Supabase Auth users are super admins
  const isSuperAdmin = !!user

  const canAccess = (resource: string, action: string): boolean => {
    // Super admin has access to everything
    return isSuperAdmin
  }

  const value: AuthContextType = {
    user,
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
