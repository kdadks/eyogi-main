/**
 * Protected Route Component for Member Portal
 * Redirects to login if not authenticated or not a member
 */

import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function MemberProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setIsAuthorized(false)
        setLoading(false)
        return
      }

      // Check if user is a member
      const userRole = session.user.user_metadata?.role
      if (userRole === 'member') {
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    // Redirect to login, but save the attempted location
    return <Navigate to="/members/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
