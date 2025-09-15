import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Multiple approaches to ensure scroll to top works
    const scrollToTop = () => {
      // Method 1: Standard window scroll
      window.scrollTo(0, 0)
      
      // Method 2: Document element scroll
      if (document.documentElement) {
        document.documentElement.scrollTop = 0
      }
      
      // Method 3: Body scroll
      if (document.body) {
        document.body.scrollTop = 0
      }
      
      // Method 4: Force scroll with requestAnimationFrame
      requestAnimationFrame(() => {
        window.scrollTo(0, 0)
      })
    }

    // Execute immediately
    scrollToTop()
    
    // Also execute after a small delay to handle any async content loading
    const timer = setTimeout(scrollToTop, 10)
    
    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
