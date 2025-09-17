import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { PermissionProvider } from './contexts/PermissionContext'
import AdminProtectedRoute from './components/auth/AdminProtectedRoute'

// SSH Website Components
import SSHHomepage from './pages/SSHHomepage'

// Admin Components
import AdminLogin from './components/auth/AdminLogin'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminUserManagementNew from './components/admin/AdminUserManagementNew'
import AdminPermissionManagement from './components/admin/AdminPermissionManagement'

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <div className="min-h-screen bg-gray-50">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* SSH Website Homepage */}
              <Route path="/" element={<SSHHomepage />} />

              {/* Public route for admin login */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected routes with admin layout */}
              <Route
                path="/admin/*"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                {/* Dashboard Route */}
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />

                {/* User Management Routes */}
                <Route
                  path="users"
                  element={
                    <AdminProtectedRoute>
                      <AdminUserManagementNew />
                    </AdminProtectedRoute>
                  }
                />

                {/* Permission Management Routes */}
                <Route
                  path="permissions"
                  element={
                    <AdminProtectedRoute>
                      <AdminPermissionManagement />
                    </AdminProtectedRoute>
                  }
                />
              </Route>

              {/* Access Denied Route */}
              <Route
                path="/access-denied"
                element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                      <p className="text-gray-600 mb-4">
                        You don't have permission to access this resource.
                      </p>
                      <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                }
              />

              {/* Catch all route - redirect to homepage instead of admin */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          <Toaster position="top-right" />
        </div>
      </PermissionProvider>
    </AuthProvider>
  )
}

export default App
