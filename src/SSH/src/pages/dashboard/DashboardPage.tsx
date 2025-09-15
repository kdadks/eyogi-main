import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/components/providers/AuthProvider'
import { getDefaultRedirectPath } from '@/lib/auth/authUtils'

export default function DashboardPage() {
  const { user, loading, initialized } = useAuth()

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center page-with-header">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />
  }

  // Redirect to role-specific dashboard using utility function
  const redirectPath = getDefaultRedirectPath(user)
  return <Navigate to={redirectPath} replace />
}