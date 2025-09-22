import { supabase } from './supabase'

// Version tracking for session invalidation
const APP_VERSION = '1.0.1' // Updated version
const VERSION_KEY = 'eyogi_app_version'
const LAST_CLEAR_KEY = 'eyogi_last_clear'

export class SessionManager {
  static async clearAllSessions() {
    try {
      console.log('SessionManager: Clearing all sessions...')

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

      console.log('SessionManager: Sessions cleared successfully')
    } catch (error) {
      console.warn('SessionManager: Error clearing sessions:', error)
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
        console.log(
          `SessionManager: Version changed from ${storedVersion} to ${APP_VERSION}, clearing sessions`,
        )
        await this.clearAllSessions()
        localStorage.setItem(VERSION_KEY, APP_VERSION)
      } else if (storedVersion !== APP_VERSION) {
        console.log(`SessionManager: Version changed but cleared recently, skipping clear`)
        localStorage.setItem(VERSION_KEY, APP_VERSION)
      } else {
        console.log('SessionManager: Version unchanged, no clearing needed')
      }
    } catch (error) {
      console.warn('SessionManager: Error checking version:', error)
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
          console.log('SessionManager: Session expired, clearing...')
          await this.clearAllSessions()
        }
      }
    } catch (error) {
      console.warn('SessionManager: Error checking session expiry:', error)
    }
  }

  static async initializeSessionManagement() {
    console.log('SessionManager: Initializing session management...')

    // Check version and clear if needed
    await this.checkVersionAndClearIfNeeded()

    // Clear expired sessions
    await this.clearExpiredSessions()

    console.log('SessionManager: Session management initialized')
  }
}
