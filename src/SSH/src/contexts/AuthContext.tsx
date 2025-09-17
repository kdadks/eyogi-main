import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase, supabaseAdmin } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
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
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Memoize loadProfile to prevent infinite loops
  const loadProfile = useCallback(async (userId: string) => {
    try {
      // Use admin client to bypass RLS for loading profile
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist - this is normal for admin users
          console.log('No profile found for admin user - this is expected')
          setProfile(null)
          return
        }

        console.error('Error loading profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error in loadProfile:', error)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) return

      setUser(session?.user ?? null)

      if (session?.user) {
        await loadProfile(session.user.id)
      }
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted) return

      setUser(session?.user ?? null)

      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error) {
        console.log('SignIn successful')
      }

      return { error }
    } catch (err) {
      console.error('SignIn error:', err)
      return { error: err }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  // For admin console, any authenticated user is considered admin
  // Profile-based permissions are only for users in the profiles table
  const isAdmin = user !== null

  const canAccess = (resource: string, action: string): boolean => {
    // Admin Console: Any Supabase authenticated user has full access
    if (user) {
      return true
    }

    // Website Dashboard: For non-authenticated users, deny access
    return false
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin,
    canAccess,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
