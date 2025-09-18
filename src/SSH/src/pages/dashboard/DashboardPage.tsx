import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'

export default function DashboardPage() {
  const { loading: authLoading, isSuperAdmin } = useAuth()
  const { user: websiteUser, loading: websiteLoading } = useWebsiteAuth()

  if (authLoading || websiteLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center page-with-header">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect super admin to admin console
  if (isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />
  }

  // Redirect website users based on role
  if (websiteUser) {
    switch (websiteUser.role) {
      case 'student':
        return <Navigate to="/dashboard/student" replace />
      case 'teacher':
        return <Navigate to="/dashboard/teacher" replace />
      case 'admin':
        return <Navigate to="/dashboard/admin" replace />
      default:
        return <Navigate to="/auth/signin" replace />
    }
  }

  // Not authenticated
  return <Navigate to="/auth/signin" replace />
}
