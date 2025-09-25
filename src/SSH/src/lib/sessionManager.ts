import { supabase } from './supabase'
// Version tracking for session invalidation
const APP_VERSION = '1.0.1' // Updated version
const VERSION_KEY = 'eyogi_app_version'
const LAST_CLEAR_KEY = 'eyogi_last_clear'
export class SessionManager {
  static async clearAllSessions() {
    try {
      // Sign out from Supabase globally
      await supabase.auth.signOut({ scope: 'global' })
      // Clear specific auth-related storage only, preserve app state
      const keysToRemove = ['supabase.auth.token']
      // Clear localStorage items that match our patterns
      Object.keys(localStorage).forEach((key) => {
        if (keysToRemove.some((pattern) => key.includes(pattern)) || key.startsWith('sb-')) {
          localStorage.removeItem(key)
        }
      })
      // Clear session storage completely
      sessionStorage.clear()
      // Mark when we last cleared
      localStorage.setItem(LAST_CLEAR_KEY, Date.now().toString())
    } catch {
      // Error clearing sessions - silent fail
    }
  }
  static async checkVersionAndClearIfNeeded() {
    try {
      const storedVersion = localStorage.getItem(VERSION_KEY)
      const lastClear = localStorage.getItem(LAST_CLEAR_KEY)
      const timeSinceLastClear = lastClear ? Date.now() - parseInt(lastClear) : Infinity
      // Only clear if version actually changed AND it's been more than 5 minutes since last clear
      // This prevents clearing on every dev server restart
      if (storedVersion !== APP_VERSION && timeSinceLastClear > 5 * 60 * 1000) {
        await this.clearAllSessions()
        localStorage.setItem(VERSION_KEY, APP_VERSION)
      } else if (storedVersion !== APP_VERSION) {
        localStorage.setItem(VERSION_KEY, APP_VERSION)
      }
    } catch {
      // Error checking version - silent fail
    }
  }
  static async clearExpiredSessions() {
    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000)
        if (session.expires_at && session.expires_at < now) {
          await this.clearAllSessions()
        }
      }
    } catch {
      // Error checking session expiry - silent fail
    }
  }
  static async initializeSessionManagement() {
    // Check version and clear if needed
    await this.checkVersionAndClearIfNeeded()
    // Clear expired sessions
    await this.clearExpiredSessions()
  }
}
