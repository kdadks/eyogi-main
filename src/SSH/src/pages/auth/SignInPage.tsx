import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { useSupabaseAuth as useAuth } from '../../hooks/useSupabaseAuth'
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type SignInForm = z.infer<typeof signInSchema>
export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
  })
  const onSubmit = async (data: SignInForm) => {
    setLoading(true)
    try {
      const { error } = await signIn(data.email, data.password)
      if (error) {
        toast.error((error as { message?: string })?.message || 'Failed to sign in')
        return
      }
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to sign in')
      }
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 page-with-header">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">eY</span>
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-orange-800">ॐ</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-lg text-gray-600 mb-6">Continue your journey of Vedic learning</p>
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Link
              to="/auth/signup"
              className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              Create one here
            </Link>
          </p>
        </div>

        {/* Sign In Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <h2 className="text-2xl font-semibold text-gray-800">Sign In</h2>
            <p className="text-gray-600 mt-1">Access your learning dashboard</p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Input
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  className="h-12 text-base"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>

              <div className="space-y-2">
                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-12 text-base"
                  {...register('password')}
                  error={errors.password?.message}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700 font-medium"
                  >
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link
                    to="/auth/forgot-password"
                    className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200"
                loading={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-8 mb-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Need assistance?</span>
                </div>
              </div>
            </div>

            {/* Support Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Having trouble signing in?{' '}
                <Link
                  to="/contact"
                  className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Contact Support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Quote */}
        <div className="text-center">
          <blockquote className="text-sm text-gray-500 italic">
            "The journey of a thousand miles begins with a single step"
          </blockquote>
          <cite className="text-xs text-gray-400 mt-1">- Lao Tzu</cite>
        </div>
      </div>
    </div>
  )
}
