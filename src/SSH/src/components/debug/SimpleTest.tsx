import React from 'react'

export default function SimpleTest() {
  // Log immediately when component loads
  console.log('SimpleTest component loaded successfully!')
  console.log('Window location:', window.location.href)
  console.log('Environment check:', {
    NODE_ENV: import.meta.env.NODE_ENV,
    BASE_URL: import.meta.env.BASE_URL,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
  })

  React.useEffect(() => {
    console.log('SimpleTest useEffect triggered')
    
    // Add some visual feedback
    document.title = 'Admin Test Page - Loading Success'
    
    // Test if basic React functionality works
    const timer = setTimeout(() => {
      console.log('Timer works - React is functioning')
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px', 
      backgroundColor: '#f3f4f6',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#111', marginBottom: '20px' }}>
          🚀 Admin Test Page - SUCCESS!
        </h1>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2>✅ If you can see this, React is working!</h2>
          <p><strong>Current URL:</strong> {window.location.href}</p>
          <p><strong>Pathname:</strong> {window.location.pathname}</p>
          <p><strong>Host:</strong> {window.location.host}</p>
          <p><strong>Time:</strong> {new Date().toISOString()}</p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3>Environment Info:</h3>
          <ul>
            <li>NODE_ENV: {import.meta.env.NODE_ENV || 'undefined'}</li>
            <li>BASE_URL: {import.meta.env.BASE_URL || 'undefined'}</li>
            <li>DEV: {import.meta.env.DEV ? 'true' : 'false'}</li>
            <li>PROD: {import.meta.env.PROD ? 'true' : 'false'}</li>
            <li>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING'}</li>
          </ul>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3>Quick Navigation Test:</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                console.log('Navigating to admin login')
                window.location.href = '/ssh-app/admin/login'
              }}
              style={{
                padding: '10px 15px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Go to Admin Login
            </button>
            <button
              onClick={() => {
                console.log('Navigating to home')
                window.location.href = '/ssh-app/'
              }}
              style={{
                padding: '10px 15px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Go to Home
            </button>
            <button
              onClick={() => {
                console.log('Reloading page')
                window.location.reload()
              }}
              style={{
                padding: '10px 15px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#fef3c7', 
          padding: '15px', 
          borderRadius: '8px',
          marginTop: '20px',
          border: '1px solid #f59e0b'
        }}>
          <p><strong>📋 Check Browser Console:</strong> Open F12 → Console tab to see detailed logs</p>
          <p><strong>🔍 If this page loads:</strong> The issue is with auth hooks or complex components</p>
          <p><strong>❌ If this page doesn't load:</strong> There's a fundamental build/routing issue</p>
        </div>
      </div>
    </div>
  )
}