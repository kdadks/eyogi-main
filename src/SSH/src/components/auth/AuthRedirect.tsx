import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface AuthRedirectProps {
  openModal: (mode: 'signin' | 'signup') => void
}

export const AuthRedirect: React.FC<AuthRedirectProps> = ({ openModal }) => {
  const location = useLocation()

  useEffect(() => {
    // Determine which modal to open based on the path
    if (location.pathname.includes('/auth/signin')) {
      openModal('signin')
    } else if (location.pathname.includes('/auth/signup')) {
      openModal('signup')
    }
  }, [location.pathname, openModal])

  // Redirect to homepage
  return <Navigate to="/" replace />
}

export default AuthRedirect
