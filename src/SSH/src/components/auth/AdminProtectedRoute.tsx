import React, { useState, useEffect } from 'react'
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
  const { isSuperAdmin, loading, user, initialized, profile } = useAuth()
  const location = useLocation()
  const [allowRedirect, setAllowRedirect] = useState(false)

  // Add a delay before allowing redirects to give auth time to initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      setAllowRedirect(true)
    }, 1000) // 1 second delay

    return () => clearTimeout(timer)
  }, [location.pathname])

  // Debug logging for production troubleshooting (but skip for login page)
  React.useEffect(() => {
    if (location.pathname === '/admin/login' || location.pathname.endsWith('/admin/login')) return

    console.log('AdminProtectedRoute Debug:', {
      loading,
      initialized,
      isSuperAdmin,
      userExists: !!user,
      userRole: user && profile ? profile.role : 'no profile',
      pathname: location.pathname,
      fullPath: window.location.pathname,
      environment: import.meta.env.NODE_ENV,
    })
  }, [loading, initialized, isSuperAdmin, user, profile, location.pathname])

  // Early return for login page - don't run any auth checks
  if (location.pathname === '/admin/login' || location.pathname.endsWith('/admin/login')) {
    console.log('AdminProtectedRoute: On login page, skipping all checks. Path:', location.pathname)
    return <>{children}</>
  }

  // Show loading only if auth is still initializing OR we have a user but no profile yet
  // OR if we haven't waited long enough for auth to complete
  if (!initialized || loading || (user && !profile) || !allowRedirect) {
    console.log('AdminProtectedRoute: Showing loading state', {
      initialized,
      loading,
      hasUser: !!user,
      hasProfile: !!profile,
      allowRedirect,
    })
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!initialized
              ? 'Initializing authentication...'
              : loading
                ? 'Checking authentication...'
                : user && !profile
                  ? 'Loading user profile...'
                  : !allowRedirect
                    ? 'Verifying authentication...'
                    : 'Checking authentication...'}
          </p>
        </div>
      </div>
    )
  }

  // Once initialized, check if user is super admin
  if (!user || !isSuperAdmin) {
    console.log('AdminProtectedRoute: Redirecting to login - not authenticated or not super admin')
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  console.log('AdminProtectedRoute: Access granted - user is super admin')
  // Super admin has full access without any additional checks
  return <>{children}</>
}

export default AdminProtectedRoute
