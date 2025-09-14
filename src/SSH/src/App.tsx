import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/layout/ScrollToTop'
import AuthProvider from './components/providers/AuthProvider'
import HomePage from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import GurukulPage from './pages/GurukulPage'
import GurukulDetailPage from './pages/GurukulDetailPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'

// Lazy load dashboard components
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'))
const StudentDashboard = React.lazy(() => import('./pages/dashboard/StudentDashboard'))
const TeacherDashboard = React.lazy(() => import('./pages/dashboard/TeacherDashboard'))
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard'))
const SignInPage = React.lazy(() => import('./pages/auth/SignInPage'))
const SignUpPage = React.lazy(() => import('./pages/auth/SignUpPage'))

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 min-h-screen">
          <ScrollToTop />
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/gurukuls" element={<GurukulPage />} />
              <Route path="/gurukuls/:slug" element={<GurukulDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/auth/signin" element={
                <PublicRoute>
                  <SignInPage />
                </PublicRoute>
              } />
              <Route path="/auth/signup" element={
                <PublicRoute>
                  <SignUpPage />
                </PublicRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/student" element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/teacher" element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App