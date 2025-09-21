import React, { useEffect, useState } from 'react'
import { useSupabaseAuth as useAuth } from '../../hooks/useSupabaseAuth'

export default function AdminDebug() {
  const { user, loading, isSuperAdmin } = useAuth()
  const [env, setEnv] = useState<Record<string, string>>({})

  useEffect(() => {
    // Check environment variables (only public ones for security)
    setEnv({
      NODE_ENV: import.meta.env.NODE_ENV || 'unknown',
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      BASE_URL: import.meta.env.BASE_URL || 'unknown',
      DEV: import.meta.env.DEV ? 'true' : 'false',
      PROD: import.meta.env.PROD ? 'true' : 'false',
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Debug Information</h1>

        <div className="grid gap-6">
          {/* Auth State */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication State</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Loading:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-sm ${loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
                >
                  {loading ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">User:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-sm ${user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {user ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
              <div>
                <span className="font-medium">Is Super Admin:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-sm ${isSuperAdmin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {isSuperAdmin ? 'Yes' : 'No'}
                </span>
              </div>
              {user && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h3 className="font-medium mb-2">User Details:</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(
                      {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        created_at: user.created_at,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Environment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment Variables</h2>
            <div className="space-y-2">
              {Object.entries(env).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <span className="font-medium w-48">{key}:</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      value === 'MISSING'
                        ? 'bg-red-100 text-red-800'
                        : value === 'SET'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* URL Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">URL Information</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Current URL:</span>
                <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
                  {window.location.href}
                </span>
              </div>
              <div>
                <span className="font-medium">Pathname:</span>
                <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
                  {window.location.pathname}
                </span>
              </div>
              <div>
                <span className="font-medium">Origin:</span>
                <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
                  {window.location.origin}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Actions</h2>
            <div className="space-x-4">
              <button
                onClick={() => (window.location.href = '/ssh-app/admin/login')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Admin Login
              </button>
              <button
                onClick={() => (window.location.href = '/ssh-app/admin/dashboard')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Try Admin Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
