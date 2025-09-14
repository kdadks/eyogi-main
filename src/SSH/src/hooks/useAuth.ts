import { useState, useEffect } from 'react'
import { authStore } from '@/lib/auth/authStore'
import { getCurrentSession, clearSession } from '@/lib/local-data/storage'
import { signOut as localSignOut } from '@/lib/local-data/auth'
import { User } from '@/types'

export function useAuth() {
  const [state, setState] = useState(authStore.getState())

  useEffect(() => {
    // Subscribe to auth store changes
    const unsubscribe = authStore.subscribe(() => {
      setState(authStore.getState())
    })

    // Initialize auth state if not already done
    if (!state.initialized) {
      initializeAuth()
    }

    return unsubscribe
  }, [state.initialized])

  const initializeAuth = async () => {
    try {
      authStore.setLoading(true)
      const session = getCurrentSession()
      
      if (session?.user) {
        authStore.setUser(session.user)
      } else {
        authStore.setUser(null)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
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
      console.error('Error signing out:', error)
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
    updateUser
  }
}