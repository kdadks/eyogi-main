/**
 * Protected Route Component for Admin Panel
 * Redirects to login if not authenticated or not an admin
 */

import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setIsAuthorized(false)
        setLoading(false)
        return
      }

      // Check if user is an admin - first check user_metadata
      const userRole = session.user.user_metadata?.role
      
      if (userRole === 'admin') {
        setIsAuthorized(true)
        setLoading(false)
        return
      }

      // If not in metadata, check the users table
      const { data: userRecord } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (userRecord?.role === 'admin') {
        setIsAuthorized(true)
      } else {
        setIsAuthorized(false)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthorized(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying credentials...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    // Redirect to login, but save the attempted location
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
