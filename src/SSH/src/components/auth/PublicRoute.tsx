import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/components/providers/AuthProvider'

interface PublicRouteProps {
  children: React.ReactNode
  redirectAuthenticated?: boolean
}

export default function PublicRoute({ 
  children, 
  redirectAuthenticated = true 
}: PublicRouteProps) {
  const { user, loading, initialized } = useAuth()

  // Show loading while auth is initializing
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

  // Redirect authenticated users to their dashboard
  if (user && redirectAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}