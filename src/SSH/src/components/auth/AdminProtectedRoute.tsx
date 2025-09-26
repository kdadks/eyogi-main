import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSupabaseAuth as useAuth } from '../../hooks/useSupabaseAuth'
interface ProtectedRouteProps {
  children: React.ReactNode
}
const AdminProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isSuperAdmin, loading, user, initialized } = useAuth()
  const location = useLocation()
  const [showFallback, setShowFallback] = React.useState(false)

  // Fallback mechanism for production - if loading too long, show fallback
  React.useEffect(() => {
    if (!initialized || loading) {
      const fallbackTimer = setTimeout(() => {
        setShowFallback(true)
      }, 4000) // Show fallback after 4 seconds

      return () => clearTimeout(fallbackTimer)
    } else {
      setShowFallback(false)
    }
  }, [initialized, loading])

  // Allow login page through
  if (location.pathname.includes('/admin/login')) {
    return <>{children}</>
  }
  // Redirect bare /admin to login
  if (location.pathname === '/admin' || location.pathname === '/admin/') {
    return <Navigate to="/admin/login" replace />
  }

  // Show fallback if auth is taking too long
  if (showFallback && (!initialized || loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-4">Authentication is taking longer than expected...</p>
          </div>
          <button
            onClick={() => (window.location.href = '/ssh-app/admin/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Show loading while checking auth (normal case)
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
