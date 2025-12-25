import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSupabaseAuth } from '../../contexts/AuthContextTypes'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const AdminProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading, initialized } = useSupabaseAuth()
  const location = useLocation()

  // Check if user has admin privileges (from Supabase Auth)
  const isAdmin =
    user && profile && ['admin', 'business_admin', 'super_admin'].includes(profile.role)

  // Allow login page through
  if (location.pathname.includes('/admin/login')) {
    return <>{children}</>
  }
  // Redirect bare /admin to login
  if (location.pathname === '/admin' || location.pathname === '/admin/') {
    return <Navigate to="/admin/login" replace />
  }

  // Show loading while checking auth
  if (!initialized || (loading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If we have a user but profile is still loading, allow access (profile will be verified later)
  // Only redirect to login if we definitively know the user is not authenticated or not an admin
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // If profile is loaded and user is not admin, redirect
  if (profile && !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Allow access
  return <>{children}</>
}
export default AdminProtectedRoute
