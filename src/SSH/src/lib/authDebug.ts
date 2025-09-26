// Production auth debugging utility
// This helps debug authentication issues in production

export const debugAuth = {
  log: (message: string, data?: unknown) => {
    // Only log in development or if explicitly enabled
    if (import.meta.env.DEV || localStorage.getItem('ssh-debug-auth') === 'true') {
      console.log(`[SSH Auth Debug] ${message}`, data)
    }
  },

  error: (message: string, error?: unknown) => {
    // Always log errors, but format them nicely
    console.error(`[SSH Auth Error] ${message}`, error)
  },

  warn: (message: string, data?: unknown) => {
    console.warn(`[SSH Auth Warning] ${message}`, data)
  },

  enableDebugMode: () => {
    localStorage.setItem('ssh-debug-auth', 'true')
    console.log('SSH Auth debug mode enabled. Reload the page to see debug logs.')
  },

  disableDebugMode: () => {
    localStorage.removeItem('ssh-debug-auth')
    console.log('SSH Auth debug mode disabled.')
  },

  // Production health check
  checkAuthHealth: async () => {
    const checks = {
      sessionExists: false,
      localStorageHasAuth: false,
      currentPath: window.location.pathname,
      timestamp: new Date().toISOString(),
    }

    try {
      // Check if we have session data in localStorage
      const authKey = 'eyogi-ssh-app-auth-v2'
      const authData = localStorage.getItem(`sb-${authKey}`)
      checks.localStorageHasAuth = !!authData

      debugAuth.log('Auth Health Check', checks)
      return checks
    } catch (error) {
      debugAuth.error('Auth health check failed', error)
      return checks
    }
  },
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  ;(window as { sshAuthDebug?: typeof debugAuth }).sshAuthDebug = debugAuth
}
