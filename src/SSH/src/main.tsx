import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { WebsiteAuthProvider } from './contexts/WebsiteAuthContext'
import { PermissionProvider } from './contexts/PermissionContext'
import { SessionManager } from './lib/sessionManager'
import './index.css'

// Initialize session management before rendering (only in production or when needed)
if (import.meta.env.PROD || import.meta.env.VITE_FORCE_SESSION_MANAGEMENT) {
  SessionManager.initializeSessionManagement()
    .then(() => {
      console.log('Session management initialized, starting app...')
    })
    .catch((error) => {
      console.warn('Session management initialization failed:', error)
    })
} else {
  console.log('Session management skipped in development mode')
}

// Keep essential error handlers for production monitoring
window.addEventListener('error', (event) => {
  if (event.message.includes('prototype')) {
    console.error('🔍 Prototype error detected:', event.message)
  }
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason)
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
