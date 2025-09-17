import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Layout Components
import { GlossyHeader } from './components/layout/GlossyHeader'

// SSH Website Components
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import CoursesPage from './pages/CoursesPage'
import GurukulPage from './pages/GurukulPage'
import SignInPage from './pages/auth/SignInPage'
import SignUpPage from './pages/auth/SignUpPage'
// import GurukulDetailPage from './pages/GurukulDetailPage'
// import CourseDetailPage from './pages/CourseDetailPage'

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <GlossyHeader />

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

            {/* Auth Pages */}
            <Route path="/auth/signin" element={<SignInPage />} />
            <Route path="/auth/signup" element={<SignUpPage />} />

            {/* Detail pages temporarily disabled due to auth dependencies */}
            {/* <Route path="/gurukuls/:slug" element={<GurukulDetailPage />} /> */}
            {/* <Route path="/courses/:id" element={<CourseDetailPage />} /> */}

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
    </div>
  )
}

export default App
