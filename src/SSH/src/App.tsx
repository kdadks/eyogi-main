import React, { Suspense, useState, lazy, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Layout Components (keep these eager loaded as they're used everywhere)
import { GlossyHeader } from './components/layout/GlossyHeader'
import Footer from './components/layout/FooterDynamic'
import WebsiteAuthModal from './components/auth/WebsiteAuthModal'
import AuthRedirect from './components/auth/AuthRedirect'
import AdminProtectedRoute from './components/auth/AdminProtectedRoute'
import ProtectedRoute from './components/auth/ProtectedRoute'
import CookieConsentBanner from './components/tracking/CookieConsentBanner'
import PageTracker from './components/tracking/PageTracker'

// Lazy load SSH Website Components
const HomePage = lazy(() => import('./pages/HomePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const GurukulPage = lazy(() => import('./pages/GurukulPage'))
const GurukulDetailPage = lazy(() => import('./pages/GurukulDetailPage'))
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'))
const LegalPageDisplay = lazy(() => import('./components/legal/LegalPageDisplay'))
const CertificateViewer = lazy(() => import('./components/certificates/CertificateViewer'))

// Lazy load Dashboard Components
const StudentDashboard = lazy(() => import('./pages/dashboard/StudentDashboard'))
const TeacherDashboard = lazy(() => import('./pages/dashboard/TeacherDashboard'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const ParentsDashboard = lazy(() => import('./pages/dashboard/parents/ParentsDashboard'))
const TeacherStudentManagement = lazy(() => import('./components/teacher/TeacherStudentManagement'))

// Lazy load Admin Components
const AdminLogin = lazy(() => import('./components/auth/AdminLogin'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'))
const AdminUserManagementNew = lazy(() => import('./components/admin/AdminUserManagementNew'))
const AdminPermissionManagement = lazy(() => import('./components/admin/AdminPermissionManagement'))
const CourseManagement = lazy(() => import('./components/admin/CourseManagement'))
const CourseAssignmentManagement = lazy(
  () => import('./components/admin/CourseAssignmentManagement'),
)
const EnrollmentManagement = lazy(() => import('./components/admin/EnrollmentManagement'))
const GurukulManagement = lazy(() => import('./components/admin/GurukulManagement'))
const AdminAnalytics = lazy(() => import('./components/admin/AdminAnalytics'))
const CertificateManagement = lazy(() => import('./components/admin/CertificateManagement'))
const ContentManagement = lazy(() => import('./components/admin/ContentManagement'))
const MediaManagement = lazy(() => import('./components/admin/MediaManagement'))
const BatchManagement = lazy(() => import('./components/admin/BatchManagement'))
const StudentManagement = lazy(() => import('./components/admin/StudentManagement'))
const TeacherManagement = lazy(() => import('./components/admin/TeacherManagement'))
const TeacherDetailView = lazy(() => import('./components/admin/TeacherDetailView'))
const ComplianceManagement = lazy(() => import('./components/admin/ComplianceManagement'))
const InvoiceManagement = lazy(() => import('./components/admin/InvoiceManagement'))
const PaymentManagement = lazy(() => import('./components/admin/PaymentManagement'))
const GDPRDeletionManagement = lazy(() => import('./components/admin/GDPRDeletionManagement'))
const AuditTrailManagement = lazy(() => import('./components/admin/AuditTrailManagement'))
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
  const location = useLocation()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin')

  // Check if current path is admin route
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isDashboardRoute = location.pathname.startsWith('/dashboard')

  // Load cache testing utilities in PRODUCTION only
  useEffect(() => {
    if (import.meta.env.PROD) {
      // Import cache testing utility only in production
      import('./lib/quickCacheTest').catch(() => {
        // Silently fail if utility can't load
      })
    }
  }, [])

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Page Tracker - tracks page views for analytics */}
      {!isAdminRoute && <PageTracker />}
      {/* Only show GlossyHeader for non-admin routes */}
      {!isAdminRoute && <GlossyHeader onOpenAuthModal={openAuthModal} />}
      {/* Main content with top padding only for non-admin routes */}
      <main className={isAdminRoute ? '' : 'pt-28 lg:pt-32'}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* SSH Website Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/gurukuls" element={<GurukulPage />} />
            {/* Legal Pages Route */}
            <Route path="/legal/:slug" element={<LegalPageDisplay />} />
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
            <Route
              path="/dashboard/teacher/students"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherStudentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/parent"
              element={
                <ProtectedRoute requiredRole="parent">
                  <ParentsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/business_admin"
              element={
                <ProtectedRoute requiredRole="business_admin">
                  <AdminDashboard />
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
              <Route path="course-assignments" element={<CourseAssignmentManagement />} />
              <Route path="enrollments" element={<EnrollmentManagement />} />
              <Route path="gurukuls" element={<GurukulManagement />} />
              <Route path="certificates" element={<CertificateManagement />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="media" element={<MediaManagement />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="batches" element={<BatchManagement />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="teachers" element={<TeacherManagement />} />
              <Route path="teachers/:teacherId" element={<TeacherDetailView />} />
              <Route path="compliance" element={<ComplianceManagement />} />
              <Route path="invoice" element={<InvoiceManagement />} />
              <Route path="payment" element={<PaymentManagement />} />
              <Route path="gdpr" element={<GDPRDeletionManagement />} />
              <Route path="audit-trail" element={<AuditTrailManagement />} />
            </Route>
            {/* Detail pages */}
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/gurukuls/:slug" element={<GurukulDetailPage />} />
            {/* Certificate viewer - public route */}
            <Route path="/certificates/:certificateNumber" element={<CertificateViewer />} />
            {/* Catch all route - redirect to homepage */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {/* Footer for non-dashboard pages */}
      {!isAdminRoute && !location.pathname.startsWith('/dashboard') && <Footer />}
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
        redirectAfterAuth="/dashboard" // Redirect to dashboard after successful login
      />
      {/* Cookie Consent Banner - Show only on public website pages (not admin or dashboard) */}
      {!isAdminRoute && !isDashboardRoute && <CookieConsentBanner />}
    </div>
  )
}
export default App
