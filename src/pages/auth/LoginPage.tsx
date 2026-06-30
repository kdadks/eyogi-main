import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user?.user_metadata?.role === 'admin') {
        navigate('/admin', { replace: true })
      }
    }

    checkAuth()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message || 'Invalid email or password')
        return
      }

      if (!data?.user) {
        setError('Login failed: No user data returned')
        return
      }

      // Check if user has admin role from metadata first
      const metadataRole = data.user.user_metadata?.role
      if (metadataRole === 'admin') {
        // User has admin role in metadata, proceed
        navigate('/admin', { replace: true })
        return
      }

      // If not in metadata, check the users table
      try {
        console.log('Querying users table for role check, user ID:', data.user.id)
        const { data: userRecord, error: queryError } = await supabase
          .schema('public')
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        console.log('Query result:', { userRecord, queryError })

        if (queryError) {
          console.error('Query error:', queryError)
        }

        if (userRecord?.role === 'admin') {
          // User is admin in database, proceed
          console.log('Admin user confirmed in database')
          navigate('/admin', { replace: true })
          return
        }
      } catch (dbError) {
        console.error('Error checking user role in database:', dbError)
        // Continue to show error below
      }

      // User is not an admin
      await supabase.auth.signOut()
      setError('This account does not have admin privileges')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Sign in to access the dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              <Link to="/" className="text-orange-500 hover:text-orange-600 font-medium">
                Go to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
