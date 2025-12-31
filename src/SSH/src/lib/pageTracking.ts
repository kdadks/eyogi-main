import { supabaseAdmin } from './supabase'
import { v4 as uuidv4 } from 'uuid'

// Cookie consent storage keys
const CONSENT_KEY = 'eyogi_cookie_consent'
const SESSION_KEY = 'eyogi_session_id'
const PAGE_START_TIME_KEY = 'eyogi_page_start_time'

// Types
export interface TrackingConsent {
  analytics: boolean
  functional: boolean
  timestamp: string
}

export interface PageTrackingData {
  page_path: string
  user_id?: string
  session_id: string
  referrer?: string
  device_type?: string
  browser?: string
  country?: string
  duration_seconds?: number
}

// ============================================
// CONSENT MANAGEMENT
// ============================================

// Check if consent has expired (730 days = 2 years)
function isConsentExpired(timestamp: string): boolean {
  if (!timestamp) return true

  try {
    const consentDate = new Date(timestamp)
    const now = new Date()
    const daysSinceConsent = (now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceConsent >= 730 // 2 years instead of 1 year
  } catch {
    return true
  }
}

export function hasAnalyticsConsent(): boolean {
  // Guard for SSR - localStorage not available on server
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (!consent) return false

    const parsed: TrackingConsent = JSON.parse(consent)

    // If consent was given for analytics, keep it valid
    // by refreshing the timestamp on each check
    if (parsed.analytics === true) {
      // Update timestamp to keep consent fresh
      const updated: TrackingConsent = {
        ...parsed,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(CONSENT_KEY, JSON.stringify(updated))
      return true
    }

    return false
  } catch {
    return false
  }
}

export function setTrackingConsent(consent: Partial<TrackingConsent>): void {
  // Guard for SSR - localStorage not available on server
  if (typeof window === 'undefined') {
    console.warn('[CookieConsent] Cannot set consent - running on server')
    return
  }

  try {
    const existing = getTrackingConsent()
    const updated: TrackingConsent = {
      ...existing,
      ...consent,
      timestamp: new Date().toISOString(),
    }

    const serialized = JSON.stringify(updated)
    localStorage.setItem(CONSENT_KEY, serialized)
  } catch (error) {
    console.error('[CookieConsent] Error setting tracking consent:', error)
  }
}

export function getTrackingConsent(): TrackingConsent {
  // Guard for SSR - localStorage not available on server
  if (typeof window === 'undefined') {
    return {
      analytics: false,
      functional: true,
      timestamp: '', // Empty timestamp means no consent given yet
    }
  }

  try {
    const consent = localStorage.getItem(CONSENT_KEY)

    if (!consent) {
      return {
        analytics: false,
        functional: true,
        timestamp: '', // Empty timestamp means no consent given yet
      }
    }

    const parsed = JSON.parse(consent)

    // Check if consent has expired (730 days = 2 years)
    if (isConsentExpired(parsed.timestamp)) {
      clearTrackingConsent()
      return {
        analytics: false,
        functional: true,
        timestamp: '',
      }
    }

    return parsed
  } catch (error) {
    console.error('[CookieConsent] Error reading consent from localStorage:', error)
    return {
      analytics: false,
      functional: true,
      timestamp: '', // Empty timestamp means no consent given yet
    }
  }
}

export function clearTrackingConsent(): void {
  // Guard for SSR - localStorage not available on server
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(CONSENT_KEY)
    localStorage.removeItem(SESSION_KEY)
  } catch (error) {
    // Error clearing consent - silent fail
  }
}

/**
 * Force re-enable analytics tracking by updating consent timestamp
 * Useful when consent was expired and needs to be refreshed
 */
export function refreshAnalyticsConsent(): void {
  // Guard for SSR - localStorage not available on server
  if (typeof window === 'undefined') {
    return
  }

  try {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (consent) {
      const parsed = JSON.parse(consent)
      // Force refresh by updating timestamp
      const refreshed: TrackingConsent = {
        ...parsed,
        analytics: true,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(CONSENT_KEY, JSON.stringify(refreshed))
      console.log('[Analytics] Consent refreshed')
    }
  } catch (error) {
    console.error('[Analytics] Error refreshing consent:', error)
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export function getOrCreateSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem(SESSION_KEY)
    if (!sessionId) {
      sessionId = uuidv4()
      sessionStorage.setItem(SESSION_KEY, sessionId)
    }
    return sessionId
  } catch {
    // Fallback if sessionStorage is not available
    return uuidv4()
  }
}

// ============================================
// DEVICE & BROWSER DETECTION
// ============================================

export function getDeviceType(): string {
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    return 'mobile'
  }
  return 'desktop'
}

export function getBrowser(): string {
  const ua = navigator.userAgent
  if (ua.indexOf('Firefox') > -1) return 'Firefox'
  if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera'
  if (ua.indexOf('Trident') > -1) return 'IE'
  if (ua.indexOf('Edge') > -1) return 'Edge'
  if (ua.indexOf('Chrome') > -1) return 'Chrome'
  if (ua.indexOf('Safari') > -1) return 'Safari'
  return 'Unknown'
}

// ============================================
// GEOLOCATION DETECTION
// ============================================

// Cache country in sessionStorage to avoid multiple API calls
const COUNTRY_CACHE_KEY = 'eyogi_user_country'

// ISO 2-letter to full country name mapping
const ISO2_TO_COUNTRY_NAME: Record<string, string> = {
  IE: 'Ireland',
  GB: 'United Kingdom',
  US: 'United States',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  IN: 'India',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  PL: 'Poland',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  RU: 'Russia',
  CN: 'China',
  JP: 'Japan',
  KR: 'South Korea',
  BR: 'Brazil',
  MX: 'Mexico',
  ZA: 'South Africa',
  SG: 'Singapore',
  HK: 'Hong Kong',
}

/**
 * Normalize country data to full country name
 * Handles both ISO 2-letter codes (IE) and full names (Ireland)
 */
function normalizeCountry(country: string | undefined): string | undefined {
  if (!country) return undefined

  const trimmed = country.trim()
  if (!trimmed) return undefined

  // If it's a 2-letter code, map to full name
  if (trimmed.length === 2) {
    const normalized = ISO2_TO_COUNTRY_NAME[trimmed.toUpperCase()]
    return normalized || trimmed // Return mapped name or original if not in map
  }

  // If it's already a full name or other format, return as-is
  return trimmed
}

export async function getCountry(): Promise<string | undefined> {
  try {
    // Check cache first
    const cached = sessionStorage.getItem(COUNTRY_CACHE_KEY)
    if (cached) {
      return cached
    }

    // Try ipapi.co first (150 requests/day per IP)
    try {
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (response.ok) {
        const data = await response.json()
        const country = normalizeCountry(data.country_name || data.country)

        if (country) {
          // Cache the result
          sessionStorage.setItem(COUNTRY_CACHE_KEY, country)
          return country
        }
      }
    } catch (apiError) {
      console.warn('ipapi.co failed, trying fallback:', apiError)
    }

    // Fallback to ip-api.com (free, 45 requests/minute) - DIFFERENT API
    try {
      const fallbackResponse = await fetch('https://ip-api.com/json/', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        const country = normalizeCountry(fallbackData.country)

        if (country) {
          console.log('Country detected (ip-api.com):', country)
          // Cache the result
          sessionStorage.setItem(COUNTRY_CACHE_KEY, country)
          return country
        }
      }
    } catch (fallbackError) {
      console.warn('ip-api.com also failed:', fallbackError)
    }

    // Tertiary fallback: try ipinfo.io
    try {
      const tertiaryResponse = await fetch('https://ipinfo.io/json/', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })

      if (tertiaryResponse.ok) {
        const tertiaryData = await tertiaryResponse.json()
        const country = normalizeCountry(tertiaryData.country)

        if (country) {
          console.log('Country detected (ipinfo.io):', country)
          // Cache the result
          sessionStorage.setItem(COUNTRY_CACHE_KEY, country)
          return country
        }
      }
    } catch (tertiaryError) {
      console.warn('ipinfo.io also failed:', tertiaryError)
    }
  } catch (error) {
    console.error('Error fetching country:', error)
  }

  // Don't cache 'Unknown' - return undefined so analytics query filters it out
  console.warn('Could not determine country from any geolocation service')
  return undefined
}

// Parse referrer to extract source information
export function getReferrerSource(referrer: string): string {
  if (!referrer) return 'Direct'

  try {
    const url = new URL(referrer)
    const hostname = url.hostname.toLowerCase()

    // Social Media
    if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'Facebook'
    if (hostname.includes('twitter.com') || hostname.includes('t.co')) return 'Twitter'
    if (hostname.includes('linkedin.com')) return 'LinkedIn'
    if (hostname.includes('instagram.com')) return 'Instagram'
    if (hostname.includes('youtube.com')) return 'YouTube'
    if (hostname.includes('pinterest.com')) return 'Pinterest'
    if (hostname.includes('reddit.com')) return 'Reddit'
    if (hostname.includes('tiktok.com')) return 'TikTok'

    // Search Engines
    if (hostname.includes('google.com') || hostname.includes('google.')) return 'Google'
    if (hostname.includes('bing.com')) return 'Bing'
    if (hostname.includes('yahoo.com')) return 'Yahoo'
    if (hostname.includes('duckduckgo.com')) return 'DuckDuckGo'
    if (hostname.includes('baidu.com')) return 'Baidu'

    // Email
    if (hostname.includes('mail.') || hostname.includes('outlook.') || hostname.includes('gmail.'))
      return 'Email'

    // Same domain - internal navigation
    if (hostname === window.location.hostname) return 'Internal'

    // External website
    return hostname
  } catch {
    return 'Unknown'
  }
}

// ============================================
// PAGE TRACKING
// ============================================

let pageStartTime: number | null = null

export function startPageTracking(pagePath: string): void {
  if (!hasAnalyticsConsent()) {
    return
  }

  try {
    pageStartTime = Date.now()
    sessionStorage.setItem(PAGE_START_TIME_KEY, pageStartTime.toString())
  } catch (error) {
    console.error('Error starting page tracking:', error)
  }
}

export async function trackPageView(
  pagePath: string,
  userId?: string,
  additionalData?: Partial<PageTrackingData>,
): Promise<void> {
  if (!hasAnalyticsConsent()) {
    console.log('Analytics consent not given, skipping tracking')
    return
  }

  try {
    const sessionId = getOrCreateSessionId()
    const deviceType = getDeviceType()
    const browser = getBrowser()
    const referrer = document.referrer || undefined

    // Get country (async, but we'll await it)
    const country = await getCountry()

    // Calculate duration if page tracking was started
    let durationSeconds: number | undefined
    try {
      const startTimeStr = sessionStorage.getItem(PAGE_START_TIME_KEY)
      if (startTimeStr && pageStartTime) {
        const duration = (Date.now() - pageStartTime) / 1000
        durationSeconds = Math.round(duration)
      }
    } catch {
      // Ignore if we can't calculate duration
    }

    const trackingData: PageTrackingData = {
      page_path: pagePath,
      user_id: userId,
      session_id: sessionId,
      referrer,
      device_type: deviceType,
      browser,
      country,
      duration_seconds: durationSeconds,
      ...additionalData,
    }

    // Send to database
    await supabaseAdmin.from('page_analytics').insert(trackingData)
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.error('Error tracking page view:', error)
  }
}

export function endPageTracking(pagePath: string, userId?: string): void {
  if (!hasAnalyticsConsent()) {
    return
  }

  try {
    // Track the page view with duration when leaving
    trackPageView(pagePath, userId)

    // Clear page start time
    sessionStorage.removeItem(PAGE_START_TIME_KEY)
    pageStartTime = null
  } catch (error) {
    console.error('Error ending page tracking:', error)
  }
}

// ============================================
// REACT HOOK FOR PAGE TRACKING
// ============================================

export function usePageTracking(pagePath: string, userId?: string) {
  if (typeof window === 'undefined') return

  // Start tracking when component mounts
  React.useEffect(() => {
    if (hasAnalyticsConsent()) {
      startPageTracking(pagePath)
      trackPageView(pagePath, userId)
    }

    // End tracking when component unmounts
    return () => {
      if (hasAnalyticsConsent()) {
        endPageTracking(pagePath, userId)
      }
    }
  }, [pagePath, userId])
}

// ============================================
// AUTO TRACKING SETUP
// ============================================

export function setupAutoTracking(): void {
  if (typeof window === 'undefined') return

  // Track initial page load
  if (hasAnalyticsConsent()) {
    const currentPath = window.location.pathname
    startPageTracking(currentPath)
    trackPageView(currentPath)
  }

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // User left the page
      endPageTracking(window.location.pathname)
    } else {
      // User returned to the page
      startPageTracking(window.location.pathname)
    }
  })

  // Track page unload
  window.addEventListener('beforeunload', () => {
    endPageTracking(window.location.pathname)
  })
}

// Import React for the hook (will be available in React components)
import React from 'react'
