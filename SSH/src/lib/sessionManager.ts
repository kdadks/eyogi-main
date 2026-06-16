// Session management utilities
// Version tracking for session invalidation
const APP_VERSION = '1.0.1' // Updated version
const VERSION_KEY = 'eyogi_app_version'
const LAST_CLEAR_KEY = 'eyogi_last_clear'
export class SessionManager {
  static async clearAllSessions() {
    try {
      // Since we use custom auth, we don't sign out from Supabase
      // Just clear any leftover auth-related storage
      const keysToRemove = ['supabase.auth.token']
      Object.keys(localStorage).forEach((key) => {
        if (keysToRemove.some((pattern) => key.includes(pattern)) || key.startsWith('sb-')) {
          localStorage.removeItem(key)
        }
      })
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
      // Since we use custom auth, we don't need to check Supabase sessions
      // Just clear any leftover Supabase auth storage
      const keysToRemove = ['supabase.auth.token']
      Object.keys(localStorage).forEach((key) => {
        if (keysToRemove.some((pattern) => key.includes(pattern)) || key.startsWith('sb-')) {
          localStorage.removeItem(key)
        }
      })

      // Also clear the eyogi-ssh-app-auth token if it exists but is invalid
      // This prevents "Invalid Refresh Token" errors on app load
      const authKey = 'eyogi-ssh-app-auth'
      const authData = localStorage.getItem(authKey)
      if (authData) {
        try {
          const parsed = JSON.parse(authData)
          // If there's no valid session structure, clear it
          if (!parsed || !parsed.access_token || !parsed.refresh_token) {
            localStorage.removeItem(authKey)
          }
        } catch {
          // If parsing fails, the data is corrupted - remove it
          localStorage.removeItem(authKey)
        }
      }

      sessionStorage.clear()
    } catch {
      // Error clearing sessions - silent fail
    }
  }
  static async initializeSessionManagement() {
    // Check version and clear if needed
    await this.checkVersionAndClearIfNeeded()
    // Clear expired sessions
    await this.clearExpiredSessions()
  }
}
