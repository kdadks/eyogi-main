'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Users, BookOpen, GraduationCap, LogOut, User, Home } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'
import logoImage from '/eyogiTextLess.png'
import fallbackLogo from '/Images/Logo.png'
interface NavLink {
  name: string
  href: string
  icon?: React.ReactNode
  external?: boolean
}
const navLinks: NavLink[] = [
  { name: 'Home', href: '/', icon: <GraduationCap className="w-4 h-4" /> },
  { name: 'About', href: '/about', icon: <Users className="w-4 h-4" /> },
  { name: 'Courses', href: '/courses', icon: <BookOpen className="w-4 h-4" /> },
  { name: 'Gurukuls', href: '/gurukuls', icon: <GraduationCap className="w-4 h-4" /> },
  { name: 'Contact', href: '/contact', icon: <Users className="w-4 h-4" /> },
]
interface GlossyHeaderProps {
  onOpenAuthModal?: (mode?: 'signin' | 'signup') => void
}
export function GlossyHeader({ onOpenAuthModal }: GlossyHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  // Get website auth context
  const { user: websiteUser, signOut: websiteSignOut } = useWebsiteAuth()

  // Handle logout with navigation to home page
  const handleSignOut = async () => {
    await websiteSignOut()
    navigate('/', { replace: true })
  }
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  const headerVariants = {
    top: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(0px)',
      boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
    },
    scrolled: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    },
  }
  const logoVariants = {
    initial: { scale: 1, filter: 'drop-shadow(0 0 0px rgba(255, 165, 0, 0))' },
    hover: {
      scale: 1.05,
      filter: 'drop-shadow(0 0 20px rgba(255, 165, 0, 0.6))',
      transition: { duration: 0.3 },
    },
  }
  const linkVariants = {
    initial: {
      scale: 1,
      background: 'rgba(0, 0, 0, 0)',
      color: 'rgba(31, 41, 55, 0.9)',
    },
    hover: {
      scale: 1.05,
      background: 'rgba(249, 115, 22, 0.1)',
      color: 'rgba(220, 38, 38, 1)',
      boxShadow: '0 4px 20px rgba(255, 165, 0, 0.3)',
    },
  }
  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        when: 'afterChildren',
      },
    },
    open: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.3,
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
  }
  const mobileItemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 },
  }
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10"
      variants={headerVariants}
      animate={isScrolled ? 'scrolled' : 'top'}
      transition={{ duration: 0.3 }}
      style={{
        background: isScrolled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        backdropFilter: isScrolled ? 'blur(20px)' : 'blur(0px)',
        boxShadow: isScrolled ? '0 8px 32px rgba(0, 0, 0, 0.1)' : '0 0 0 rgba(0, 0, 0, 0)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="flex items-center justify-between h-16 lg:h-20 max-w-full">
          {/* Logo */}
          <motion.div
            variants={logoVariants}
            initial="initial"
            whileHover="hover"
            className="flex items-center gap-4 flex-shrink-0"
          >
            <Link to="/" className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={logoImage}
                  alt="eYogi Gurukul"
                  className="h-10 w-10 lg:h-12 lg:w-12 rounded-full border-2 border-white/20"
                  onError={(e) => {
                    // Fallback to Logo.png if eyogiTextLess.png fails
                    const target = e.target as HTMLImageElement
                    target.src = fallbackLogo
                  }}
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400/20 to-red-500/20"></div>
              </div>
              <div className="hidden sm:block">
                <div className="flex flex-col">
                  <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent whitespace-nowrap">
                    SSH University
                  </h1>
                  <h2 className="text-xs lg:text-sm font-medium text-gray-600 whitespace-nowrap">
                    eYogi Gurukul
                  </h2>
                </div>
              </div>
            </Link>
          </motion.div>
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2 flex-1 justify-center min-w-0">
            {navLinks.map((link) => (
              <motion.div
                key={link.name}
                variants={linkVariants}
                initial="initial"
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-1 relative overflow-hidden whitespace-nowrap ${
                    location.pathname === link.href
                      ? 'text-gray-900 bg-orange-100 shadow-lg'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                  {location.pathname === link.href && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-red-500"
                      layoutId="activeTab"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
            {/* Main Site Link */}
            <motion.div
              variants={linkVariants}
              initial="initial"
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              className="ml-2 pl-2 border-l border-gray-300 flex-shrink-0"
            >
              <a
                href="/"
                onClick={() => (window.location.href = '/')}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center relative overflow-hidden text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 whitespace-nowrap"
              >
                <span>← eYogi Gurukul</span>
              </a>
            </motion.div>
          </nav>
          {/* Right side - Auth & CTA */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Fixed width container to maintain alignment */}
            <div className="hidden lg:flex items-center justify-end w-72 max-w-xs">
              {websiteUser ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 min-w-0 max-w-48"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="h-6 w-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-medium text-gray-900 truncate">
                        {websiteUser.full_name || websiteUser.email || 'User'}
                      </span>
                      <Link
                        to="/dashboard"
                        className="text-xs text-orange-600 hover:text-orange-700 hover:underline font-medium"
                      >
                        Dashboard
                      </Link>
                    </div>
                  </motion.div>
                  <motion.button
                    onClick={handleSignOut}
                    className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-gray-700 hover:text-gray-900 hover:bg-white/30 hover:border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenAuthModal?.('signin')}
                      className="bg-white/20 backdrop-blur-md border-white/30 text-gray-800 hover:bg-white/30 hover:border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden px-3 py-1 text-xs"
                    >
                      <span className="relative z-10">Sign In</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      onClick={() => onOpenAuthModal?.('signup')}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl border-0 px-3 py-1 text-xs"
                    >
                      Get Started
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
            {/* Mobile menu button */}
            <motion.button
              className="lg:hidden p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="lg:hidden border-t border-gray-200 bg-white/90 backdrop-blur-md"
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <div className="px-2 pt-2 pb-3 space-y-3">
                {navLinks.map((link) => (
                  <motion.div key={link.name} variants={mobileItemVariants}>
                    <Link
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                        location.pathname === link.href
                          ? 'text-gray-900 bg-orange-100 shadow-lg'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {link.icon}
                      <span>{link.name}</span>
                    </Link>
                  </motion.div>
                ))}
                {/* Main Site Link for Mobile */}
                <motion.div variants={mobileItemVariants} className="pt-2 border-t border-gray-200">
                  <a
                    href="/"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      window.location.href = '/'
                    }}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <span>← eYogi Gurukul</span>
                  </a>
                </motion.div>
                {/* Mobile Auth Section */}
                <motion.div
                  className="pt-4 border-t border-gray-200 space-y-3"
                  variants={mobileItemVariants}
                >
                  {websiteUser ? (
                    <>
                      <div className="flex items-center space-x-3 px-3 py-2 text-gray-800">
                        <User className="w-4 h-4" />
                        <span>{websiteUser.full_name || websiteUser.email || 'User'}</span>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      >
                        <Home className="w-4 h-4" />
                        <span>View Dashboard</span>
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut()
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center space-x-3 px-3 py-2 w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          onOpenAuthModal?.('signin')
                          setIsMobileMenuOpen(false)
                        }}
                        className="block w-full px-3 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-gray-800 hover:bg-white/30 hover:border-white/40 rounded-lg font-medium shadow-lg transition-all duration-200 relative overflow-hidden"
                      >
                        <span className="relative z-10">Sign In</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                      <button
                        onClick={() => {
                          onOpenAuthModal?.('signup')
                          setIsMobileMenuOpen(false)
                        }}
                        className="block w-full px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium shadow-lg"
                      >
                        Get Started
                      </button>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
