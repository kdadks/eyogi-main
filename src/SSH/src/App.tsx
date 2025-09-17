import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// SSH Website Components
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import CoursesPage from './pages/CoursesPage'
import GurukulPage from './pages/GurukulPage'
// import GurukulDetailPage from './pages/GurukulDetailPage'
// import CourseDetailPage from './pages/CourseDetailPage'

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* SSH Website Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/gurukuls" element={<GurukulPage />} />
          {/* Detail pages temporarily disabled due to auth dependencies */}
          {/* <Route path="/gurukuls/:slug" element={<GurukulDetailPage />} /> */}
          {/* <Route path="/courses/:id" element={<CourseDetailPage />} /> */}

          {/* Catch all route - redirect to homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <Toaster position="top-right" />
    </div>
  )
}

export default App
