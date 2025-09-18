import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { WebsiteAuthProvider } from './contexts/WebsiteAuthContext'
import { PermissionProvider } from './contexts/PermissionContext'
import './index.css'

// Global error handlers for debugging
window.addEventListener('error', (event) => {
  console.error('🚨 [GLOBAL_ERROR] Uncaught error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack,
  })

  if (event.message.includes('prototype')) {
    console.error('🔍 [PROTOTYPE_ERROR] Prototype-related error detected!')
    console.error('🔍 [PROTOTYPE_ERROR] This might be the cause of the blank page')
  }
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 [GLOBAL_PROMISE_REJECTION] Unhandled promise rejection:', event.reason)
})

// Debug logging for prototype error diagnosis
console.log('🚀 [MAIN] Starting SSH App initialization...')
console.log('🔍 [MAIN] React version:', React.version)
console.log('🔍 [MAIN] ReactDOM:', !!ReactDOM)
console.log('🔍 [MAIN] Document root element:', document.getElementById('root'))

// Check for potential undefined prototypes
console.log('🔍 [MAIN] React.Component.prototype:', React.Component?.prototype)
console.log('🔍 [MAIN] BrowserRouter:', BrowserRouter)
console.log('🔍 [MAIN] AuthProvider:', AuthProvider)
console.log('🔍 [MAIN] WebsiteAuthProvider:', WebsiteAuthProvider)

try {
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
  console.log('✅ [MAIN] React app rendered successfully')
} catch (error) {
  console.error('❌ [MAIN] Error during React app render:', error)
  console.error('❌ [MAIN] Error stack:', error.stack)
}
