import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/components/providers/AuthProvider'
import { User } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: User['role']
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/auth/signin' 
}: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuth()
  const location = useLocation()

  // Show loading spinner while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to sign in if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Redirect to appropriate dashboard if role doesn't match
  if (requiredRole && user.role !== requiredRole) {
    const dashboardPath = `/dashboard/${user.role}`
    return <Navigate to={dashboardPath} replace />
  }

  return <>{children}</>
}