import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { WebsiteAuthProvider } from './contexts/WebsiteAuthContext'
import { PermissionProvider } from './contexts/PermissionContext'
import { SessionManager } from './lib/sessionManager'
import './index.css'

// Suppress ReactQuill findDOMNode warning in development
if (import.meta.env.DEV) {
  const originalError = console.error
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('findDOMNode is deprecated')) {
      return
    }
    originalError.call(console, ...args)
  }
}
// Initialize session management before rendering (only in production or when needed)
if (import.meta.env.PROD || import.meta.env.VITE_FORCE_SESSION_MANAGEMENT) {
  SessionManager.initializeSessionManagement()
    .then(() => {
      // Session management initialized
    })
    .catch(() => {
      // Session management initialization failed
    })
}
// Keep essential error handlers for production monitoring
window.addEventListener('error', (event) => {
  if (event.message.includes('prototype')) {
    // Prototype error detected
  }
})
window.addEventListener('unhandledrejection', () => {
  // Unhandled promise rejection
})
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      basename="/ssh-app"
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <WebsiteAuthProvider>
          <PermissionProvider>
            <App />
          </PermissionProvider>
        </WebsiteAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
