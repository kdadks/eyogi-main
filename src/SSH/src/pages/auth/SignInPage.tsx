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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 page-with-header">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">eY</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/auth/signup" className="font-medium text-orange-600 hover:text-orange-500">
              create a new account
            </Link>
          </p>
        </div>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Welcome back</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                error={errors.password?.message}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link
                    to="/auth/forgot-password"
                    className="font-medium text-orange-600 hover:text-orange-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link to="/contact" className="font-medium text-orange-600 hover:text-orange-500">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
