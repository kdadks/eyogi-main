import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSupabaseAuth as useAuth } from '../../hooks/useSupabaseAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const AdminProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isSuperAdmin, loading, user, initialized } = useAuth()
  const location = useLocation()

  // Allow login page through
  if (location.pathname.includes('/admin/login')) {
    return <>{children}</>
  }

  // Redirect bare /admin to login
  if (location.pathname === '/admin' || location.pathname === '/admin/') {
    return <Navigate to="/admin/login" replace />
  }

  // Show loading while checking auth
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated or not admin
  if (!user || !isSuperAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Allow access
  return <>{children}</>
}

export default AdminProtectedRoute
