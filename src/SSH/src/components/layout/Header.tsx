'use client'

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ScrollLink from '../ui/ScrollLink'
import { useAuth } from '../providers/AuthProvider'
import { getUserDisplayName, getUserInitials, getRoleDisplayName } from '../../lib/auth/authUtils'
import { Bars3Icon, XMarkIcon, UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { Button } from '../ui/button'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, signOut, loading } = useAuth()

  // Handle scroll effect for glass morphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.user-menu-container')) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Gurukuls', href: '/gurukuls' },
    { name: 'Courses', href: '/courses' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      // Navigation is handled in the signOut function
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Show loading state while auth is initializing
  if (!user && loading) {
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-lg shadow-xl border-b border-white/20'
            : 'bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100'
        }`}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="h-12 w-12 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-lg">eY</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    SSH University
                  </span>
                  <span className="text-xs text-gray-500 font-medium">Excellence in Education</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
            </div>
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-lg shadow-xl border-b border-white/20'
          : 'bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="relative">
                <img
                  src="/Images/Logo.png"
                  alt="eYogi Gurukul logo"
                  className="h-8 w-8 sm:h-12 sm:w-12 object-contain rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-orange-600 group-hover:to-red-600 transition-all duration-300">
                  SSH University
                </span>
                <span className="text-xs sm:text-xs text-gray-500 font-medium group-hover:text-orange-500 transition-colors duration-300 hidden sm:block">
                  Excellence in Education
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {navigation.map((item) => (
              <ScrollLink
                key={item.name}
                to={item.href}
                className="relative px-4 py-2 text-sm font-semibold text-gray-700 hover:text-orange-600 transition-all duration-300 rounded-lg hover:bg-orange-50 group nav-item"
              >
                <span className="relative z-10">{item.name}</span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </ScrollLink>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <ScrollLink
                  to="/dashboard"
                  className="hidden lg:block px-3 py-2 text-sm font-semibold text-gray-700 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-all duration-300"
                >
                  Dashboard
                </ScrollLink>

                {/* User Profile Dropdown */}
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50 transition-all duration-300 group"
                  >
                    <div className="relative">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <span className="text-white text-xs sm:text-sm font-bold">
                          {getUserInitials(user)}
                        </span>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-semibold text-gray-900">
                        {getUserDisplayName(user)}
                      </div>
                      <div className="text-xs text-gray-500">{getRoleDisplayName(user.role)}</div>
                    </div>
                    <ChevronDownIcon
                      className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-400 transition-transform duration-200 hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200/50 py-2 z-50 user-dropdown">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {getUserDisplayName(user)}
                        </p>
                        <p className="text-xs text-gray-500">{getRoleDisplayName(user.role)}</p>
                      </div>
                      <ScrollLink
                        to="/dashboard"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors duration-200 md:hidden"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </ScrollLink>
                      <button
                        onClick={() => {
                          handleSignOut()
                          setUserMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
                <Link to="/auth/signin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-semibold hover:bg-orange-50 hover:text-orange-600 transition-all duration-300 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/signup">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="p-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden border-t border-gray-200/50 mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
          >
            <div className="bg-white/95 backdrop-blur-lg px-3 pt-3 pb-4 space-y-1">
              {navigation.map((item) => (
                <ScrollLink
                  key={item.name}
                  to={item.href}
                  className="block px-4 py-4 text-base font-semibold text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-300"
                  style={{ minHeight: '44px' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </ScrollLink>
              ))}
              {user && (
                <ScrollLink
                  to="/dashboard"
                  className="block px-4 py-4 text-base font-semibold text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-300"
                  style={{ minHeight: '44px' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </ScrollLink>
              )}
              {!user && (
                <div className="pt-4 space-y-3">
                  <Link to="/auth/signin" className="block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center font-semibold py-3"
                      style={{ minHeight: '44px' }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth/signup" className="block">
                    <Button
                      size="sm"
                      className="w-full justify-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3"
                      style={{ minHeight: '44px' }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
