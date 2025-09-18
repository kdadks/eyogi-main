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
  const { isSuperAdmin, profile, loading, canAccess } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Super admin (Supabase authenticated) users have full access
  if (!isSuperAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Super admin has full access without any additional checks
  return <>{children}</>
}

export default ProtectedRoute
