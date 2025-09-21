import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSupabaseAuth as useAuth } from '../../hooks/useSupabaseAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'business_admin' | 'super_admin' | 'teacher'
  requiredPermission?: {
    resource: string
    action: string
  }
}

const AdminProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  // requiredRole, // For future role-based access control
  // requiredPermission, // For future permission-based access control
}) => {
  const { isSuperAdmin, loading, user } = useAuth()
  const location = useLocation()

  // Debug logging for production troubleshooting
  React.useEffect(() => {
    console.log('AdminProtectedRoute Debug:', {
      loading,
      isSuperAdmin,
      userExists: !!user,
      pathname: location.pathname,
      environment: import.meta.env.NODE_ENV,
    })
  }, [loading, isSuperAdmin, user, location.pathname])

  if (loading) {
    console.log('AdminProtectedRoute: Showing loading state')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Super admin (Supabase authenticated) users have full access
  if (!isSuperAdmin) {
    console.log('AdminProtectedRoute: Redirecting to login - not super admin')
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  console.log('AdminProtectedRoute: Access granted - user is super admin')
  // Super admin has full access without any additional checks
  return <>{children}</>
}

export default AdminProtectedRoute
