import { useState, useEffect } from 'react'
import { authStore } from '@/lib/auth/authStore'
import { getCurrentSession, LocalUser } from '@/lib/local-data/storage'
import { signOut as localSignOut } from '@/lib/local-data/auth'
import { User } from '../types'
// Convert LocalUser to User
function convertLocalUserToUser(localUser: LocalUser): User {
  return {
    id: localUser.id,
    email: localUser.email,
    full_name: localUser.full_name || null,
    avatar_url: localUser.avatar_url,
    role: localUser.role as User['role'],
    date_of_birth: null, // LocalUser doesn't have this
    phone: localUser.phone,
    address_line_1: localUser.address || null,
    address_line_2: null,
    city: null,
    state: null,
    zip_code: null,
    country: null,
    age: localUser.age,
    student_id: localUser.student_id,
    created_at: localUser.created_at,
    updated_at: localUser.updated_at,
  }
}
export function useAuth() {
  const [state, setState] = useState(authStore.getState())
  useEffect(() => {
    // Subscribe to auth store changes
    const unsubscribe = authStore.subscribe(() => {
      setState(authStore.getState())
    })
    // Initialize auth state if not already done
    if (!state.initialized) {
      void initializeAuth()
    }
    return unsubscribe
  }, [state.initialized])
  const initializeAuth = async () => {
    try {
      authStore.setLoading(true)
      const session = getCurrentSession()
      if (session?.user) {
        authStore.setUser(convertLocalUserToUser(session.user))
      } else {
        authStore.setUser(null)
      }
    } catch (error) {
      authStore.setUser(null)
    } finally {
      authStore.setLoading(false)
      authStore.setInitialized(true)
    }
  }
  const signOut = async () => {
    try {
      authStore.setLoading(true)
      await localSignOut()
      authStore.clearAuth()
      // Redirect to home page after sign out
      window.location.href = '/'
    } catch (error) {
    } finally {
      authStore.setLoading(false)
    }
  }
  const refreshUser = async () => {
    await initializeAuth()
  }
  const updateUser = (user: User) => {
    authStore.setUser(user)
  }
  return {
    user: state.user,
    loading: state.loading,
    initialized: state.initialized,
    signOut,
    refreshUser,
    updateUser,
  }
}
