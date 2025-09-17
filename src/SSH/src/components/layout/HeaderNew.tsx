import React from 'react'
import { Link } from 'react-router-dom'

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">🕉️</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">eYogi Gurukul</span>
                <span className="text-xs text-gray-500">Hindu Education Platform</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              to="/gurukuls"
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              Gurukuls
            </Link>
            <Link
              to="/courses"
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              Courses
            </Link>
            <Link
              to="/about"
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors">
              Sign In
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-medium transition-colors">
              Sign Up
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-700 hover:text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
