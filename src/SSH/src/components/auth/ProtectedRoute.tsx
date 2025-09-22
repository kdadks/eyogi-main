import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSupabaseAuth as useAuth } from '../../hooks/useSupabaseAuth'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent'
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/auth/signin',
}: ProtectedRouteProps) {
  const { loading: authLoading, isSuperAdmin } = useAuth()
  const { user: websiteUser, loading: websiteLoading } = useWebsiteAuth()
  const location = useLocation()

  // Show loading spinner while either auth is initializing
  if (authLoading || websiteLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated (either super admin or website user)
  const isAuthenticated = isSuperAdmin || !!websiteUser

  // Redirect to sign in if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Super admin has access to everything
  if (isSuperAdmin) {
    return <>{children}</>
  }

  // For website users, check role if required
  if (requiredRole && websiteUser?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    const dashboardPath = websiteUser?.role ? `/dashboard/${websiteUser.role}` : '/dashboard'
    return <Navigate to={dashboardPath} replace />
  }

  return <>{children}</>
}
