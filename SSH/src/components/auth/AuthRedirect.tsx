import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface AuthRedirectProps {
  openModal: (mode: 'signin' | 'signup' | 'forgot-password') => void
}

export function AuthRedirect({ openModal }: AuthRedirectProps) {
  const location = useLocation()

  useEffect(() => {
    // Determine which modal to open based on the path
    if (location.pathname.includes('/auth/signin')) {
      openModal('signin')
    } else if (location.pathname.includes('/auth/signup')) {
      openModal('signup')
    } else if (location.pathname.includes('/auth/forgot-password')) {
      openModal('forgot-password')
    }
  }, [location.pathname, openModal])

  // Redirect to homepage
  return <Navigate to="/" replace />
}

export default AuthRedirect
