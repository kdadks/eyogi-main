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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

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

    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

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
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (isMounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    getSession()

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
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      // Redirect to admin login page
      window.location.href = '/ssh-app/admin/login'
    } catch {
      // Handle sign out error silently
    }
  }

  // Check if user has admin privileges (admin, business_admin, or super_admin)
  const isSuperAdmin = !!user && !!profile && ['admin', 'business_admin', 'super_admin'].includes(profile.role)

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
