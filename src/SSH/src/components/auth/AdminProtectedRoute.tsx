import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'super_admin' | 'teacher'
  requiredPermission?: {
    resource: string
    action: string
  }
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
}) => {
  const { user, profile, loading, canAccess } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Supabase authenticated users have full access (no profile required)
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // If user has no profile, they are a Supabase admin user with full access
  if (!profile) {
    return <>{children}</>
  }

  // For users with profiles, check role and permission requirements
  // Check role requirement
  if (requiredRole) {
    if (requiredRole === 'admin' && !['admin', 'super_admin'].includes(profile.role)) {
      return <Navigate to="/admin/unauthorized" replace />
    }

    if (requiredRole === 'super_admin' && profile.role !== 'super_admin') {
      return <Navigate to="/admin/unauthorized" replace />
    }

    if (requiredRole === 'teacher' && !['teacher', 'admin', 'super_admin'].includes(profile.role)) {
      return <Navigate to="/admin/unauthorized" replace />
    }
  }

  // Check permission requirement
  if (requiredPermission) {
    if (!canAccess(requiredPermission.resource, requiredPermission.action)) {
      return <Navigate to="/admin/unauthorized" replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
