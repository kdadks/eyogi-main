import React, { Suspense, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Layout Components
import { GlossyHeader } from './components/layout/GlossyHeader'
import WebsiteAuthModal from './components/auth/WebsiteAuthModal'
import AuthRedirect from './components/auth/AuthRedirect'

// SSH Website Components
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import CoursesPage from './pages/CoursesPage'
import GurukulPage from './pages/GurukulPage'

// Dashboard Components
import StudentDashboard from './pages/dashboard/StudentDashboard'
import TeacherDashboard from './pages/dashboard/TeacherDashboard'
import DashboardPage from './pages/dashboard/DashboardPage'

// Admin Components
import AdminLogin from './components/auth/AdminLogin'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminUserManagementNew from './components/admin/AdminUserManagementNew'
import AdminPermissionManagement from './components/admin/AdminPermissionManagement'
import CourseManagement from './components/admin/CourseManagement'
import EnrollmentManagement from './components/admin/EnrollmentManagement'
import GurukulManagement from './components/admin/GurukulManagement'
import SiteAnalytics from './components/admin/SiteAnalytics'
import CertificateManagement from './components/admin/CertificateManagement'
import ContentManagement from './components/admin/ContentManagement'
import AdminProtectedRoute from './components/auth/AdminProtectedRoute'
import ProtectedRoute from './components/auth/ProtectedRoute'

import GurukulDetailPage from './pages/GurukulDetailPage'
import CourseDetailPage from './pages/CourseDetailPage'

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      <p className="text-gray-600 animate-pulse">Loading eYogi Gurukul...</p>
    </div>
  </div>
)

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin')

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <GlossyHeader onOpenAuthModal={openAuthModal} />

      {/* Main content with top padding to account for fixed header */}
      <main className="pt-16 lg:pt-20">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* SSH Website Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/gurukuls" element={<GurukulPage />} />

            {/* Auth Redirects - Opens modals instead of separate pages */}
            <Route path="/auth/*" element={<AuthRedirect openModal={openAuthModal} />} />

            {/* User Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/student"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/teacher"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected admin routes */}
            <Route
              path="/admin/*"
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUserManagementNew />} />
              <Route path="permissions" element={<AdminPermissionManagement />} />

              {/* Course Management */}
              <Route path="courses" element={<CourseManagement />} />
              <Route path="enrollments" element={<EnrollmentManagement />} />
              <Route path="gurukuls" element={<GurukulManagement />} />
              <Route path="certificates" element={<CertificateManagement />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="analytics" element={<SiteAnalytics />} />
            </Route>

            {/* Detail pages */}
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/gurukuls/:slug" element={<GurukulDetailPage />} />

            {/* Catch all route - redirect to homepage */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      />

      {/* Website Auth Modal - Rendered at app level to avoid positioning issues */}
      <WebsiteAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        redirectAfterAuth={false} // Stay on current page after auth
      />
    </div>
  )
}

export default App
