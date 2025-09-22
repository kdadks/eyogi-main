import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { PermissionProvider } from './contexts/PermissionContext'
import AdminProtectedRoute from './components/auth/AdminProtectedRoute'

// Admin Components
import AdminLogin from './components/auth/AdminLogin'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminUserManagementNew from './components/admin/AdminUserManagementNew'
import AdminPermissionManagement from './components/admin/AdminPermissionManagement'
import CertificateManagement from './components/admin/CertificateManagement'

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

function AdminApp() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <div className="min-h-screen bg-gray-50">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public route for login */}
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

                {/* Course Management Routes */}
                <Route
                  path="courses"
                  element={
                    <AdminProtectedRoute>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold">Course Management</h1>
                        <p>Coming in Phase 2: Course creation and management tools</p>
                      </div>
                    </AdminProtectedRoute>
                  }
                />

                {/* Enrollment Management Routes */}
                <Route
                  path="enrollments"
                  element={
                    <AdminProtectedRoute>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold">Enrollment Management</h1>
                        <p>Coming in Phase 2: Enrollment approval and tracking system</p>
                      </div>
                    </AdminProtectedRoute>
                  }
                />

                {/* Certificate Management Routes */}
                <Route
                  path="certificates"
                  element={
                    <AdminProtectedRoute>
                      <CertificateManagement />
                    </AdminProtectedRoute>
                  }
                />

                {/* Content Management Routes */}
                <Route
                  path="content"
                  element={
                    <AdminProtectedRoute>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold">Content Management</h1>
                        <p>Coming in Phase 4: Dynamic content and SEO management</p>
                      </div>
                    </AdminProtectedRoute>
                  }
                />

                {/* Analytics Routes */}
                <Route
                  path="analytics"
                  element={
                    <AdminProtectedRoute>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold">Analytics</h1>
                        <p>Coming in Phase 3: Advanced analytics and reporting</p>
                      </div>
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

                {/* Settings Routes */}
                <Route
                  path="settings"
                  element={
                    <AdminProtectedRoute>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold">System Settings</h1>
                        <p>Coming in Phase 2: System configuration and settings</p>
                      </div>
                    </AdminProtectedRoute>
                  }
                />
              </Route>

              {/* Unauthorized page */}
              <Route
                path="/admin/unauthorized"
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

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </Suspense>

          <Toaster position="top-right" />
        </div>
      </PermissionProvider>
    </AuthProvider>
  )
}

export default AdminApp
