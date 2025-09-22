import React, { useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
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
  const location = useLocation()
  const mountedRef = useRef(true)

  // Simple profile fetch
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('Profile fetch error:', error)
      return null
    }
  }

  // Simple initialization
  useEffect(() => {
    const isLoginPage = location.pathname.includes('/admin/login')
    const isAdminPath = location.pathname.includes('/admin')

    // Skip auth completely on login page
    if (isLoginPage) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      setInitialized(true)
      return
    }

    // Only initialize on admin paths
    if (!isAdminPath) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      setInitialized(true)
      return
    }

    // Simple auth check
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mountedRef.current) return

        if (session?.user) {
          setUser(session.user)
          const userProfile = await fetchProfile(session.user.id)
          if (mountedRef.current) {
            setProfile(userProfile)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
        setProfile(null)
      } finally {
        if (mountedRef.current) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    checkAuth()

    // Simple auth state listener - handle sign in and sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current || !isAdminPath || isLoginPage) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Update state immediately on sign in
        setUser(session.user)
        const userProfile = await fetchProfile(session.user.id)
        if (mountedRef.current) {
          setProfile(userProfile)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [location.pathname])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Update auth state directly (for login)
  const updateAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const userProfile = await fetchProfile(session.user.id)
        setProfile(userProfile)
        setLoading(false)
        setInitialized(true)
        return { user: session.user, profile: userProfile }
      }
      return { user: null, profile: null }
    } catch (error) {
      console.error('Failed to update auth state:', error)
      return { user: null, profile: null }
    }
  }

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

  // Check if user can manage certificates
  const canManageCertificates =
    !!user && !!profile && ['business_admin', 'admin', 'super_admin'].includes(profile.role)

  // Check if user can assign templates
  const canAssignTemplates =
    !!user && !!profile && ['admin', 'super_admin'].includes(profile.role)

  // Check if user is teacher
  const isTeacher =
    !!user && !!profile && profile.role === 'teacher'

  const canAccess = (resource: string, action: string): boolean => {
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
