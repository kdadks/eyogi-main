import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  hasAnalyticsConsent,
  startPageTracking,
  trackPageView,
  endPageTracking,
} from '@/lib/pageTracking'
import { supabase } from '@/lib/supabase'

export default function PageTracker() {
  const location = useLocation()

  useEffect(() => {
    if (!hasAnalyticsConsent()) {
      return
    }

    const pagePath = location.pathname
    let userId: string | undefined

    // Get current user ID if logged in
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user?.id
    }

    // Start tracking
    getUserId().then((uid) => {
      userId = uid
      startPageTracking(pagePath)
      trackPageView(pagePath, userId)
    })

    // Cleanup: end tracking when component unmounts or path changes
    return () => {
      if (userId) {
        endPageTracking(pagePath, userId)
      } else {
        getUserId().then((uid) => {
          if (uid) {
            endPageTracking(pagePath, uid)
          }
        })
      }
    }
  }, [location.pathname])

  return null // This component doesn't render anything
}
