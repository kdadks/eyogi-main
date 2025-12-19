import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { WebsiteAuthProvider } from './contexts/WebsiteAuthContext'
import { PermissionProvider } from './contexts/PermissionContext'
import { SessionManager } from './lib/sessionManager'
import './index.css'

// Suppress ReactQuill warnings in development
if (import.meta.env.DEV) {
  const originalError = console.error
  const originalWarn = console.warn

  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('findDOMNode is deprecated')) {
      return
    }
    originalError.call(console, ...args)
  }

  // Suppress react-quill passive event listener warnings
  // This is a known issue with react-quill v2.0.0 - the library adds touchstart listeners
  // See: https://github.com/zenoamaro/react-quill/issues/791
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('[Violation] Added non-passive event listener')
    ) {
      return
    }
    originalWarn.call(console, ...args)
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
  console.error('Global error caught:', event.error || event.message)
  if (event.message.includes('prototype')) {
    // Prototype error detected
  }
  if (event.message.includes('createContext')) {
    console.error('React context error - possible duplicate React instance')
  }
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find the root element')
}

try {
  ReactDOM.createRoot(rootElement).render(
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
} catch (error) {
  console.error('Failed to render application:', error)
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(to bottom right, #fff7ed, #ffffff, #fef2f2); font-family: system-ui, -apple-system, sans-serif;">
      <div style="text-align: center; padding: 2rem;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">Application Failed to Load</h1>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">Please try refreshing the page. If the problem persists, contact support.</p>
        <button onclick="window.location.reload()" style="background: #ea580c; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 500;">
          Refresh Page
        </button>
      </div>
    </div>
  `
}
