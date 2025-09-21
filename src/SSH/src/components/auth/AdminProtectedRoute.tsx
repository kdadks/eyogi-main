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
  const { isSuperAdmin, loading } = useAuth()
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

export default AdminProtectedRoute
