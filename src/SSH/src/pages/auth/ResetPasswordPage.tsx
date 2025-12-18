import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { validateResetToken, resetPasswordWithToken } from '../../lib/password-reset-utils'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
      .refine((val) => !/\s/.test(val), 'Password must not contain spaces'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  })

  // Validate token on mount
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        toast.error('Invalid reset link')
        setValidatingToken(false)
        setTokenValid(false)
        return
      }

      const result = await validateResetToken(token)
      setValidatingToken(false)

      if (result.valid) {
        setTokenValid(true)
      } else {
        setTokenValid(false)
        toast.error(result.error || 'Invalid or expired reset link')
      }
    }

    checkToken()
  }, [token])

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('Invalid reset link')
      return
    }

    setLoading(true)
    try {
      const result = await resetPasswordWithToken(token, data.password)

      if (result.success) {
        toast.success('Password reset successful! You can now sign in with your new password.')
        setTimeout(() => {
          navigate('/auth/signin')
        }, 2000)
      } else {
        toast.error(result.error || 'Failed to reset password')
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to reset password')
      }
    } finally {
      setLoading(false)
    }
  }

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 page-with-header">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl border border-orange-100/20 bg-white/98 backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"></div>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Validating reset link...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 page-with-header">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl border border-orange-100/20 bg-white/98 backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
            <CardHeader className="text-center pt-6 pb-3 px-6">
              <h3 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h3>
              <p className="text-sm text-gray-600 mt-2">
                This password reset link is invalid or has expired.
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-sm text-gray-600 mb-4 text-center">
                Reset links are valid for 24 hours. Please request a new password reset.
              </p>
              <Button
                onClick={() => navigate('/auth/forgot-password')}
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Request New Reset Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 page-with-header">
      <div className="max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="h-14 w-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">eY</span>
              </div>
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-orange-800">ॐ</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Reset Your Password</h1>
          <p className="text-sm text-gray-600">Enter your new password below</p>
        </div>

        {/* Reset Password Form */}
        <Card className="shadow-2xl border border-orange-100/20 bg-white/98 backdrop-blur-xl rounded-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"></div>
          <CardHeader className="text-center pt-6 pb-3 px-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Create New Password
            </h2>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  label={
                    <>
                      New Password <span className="text-red-500">*</span>
                    </>
                  }
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className="h-11 text-sm"
                  {...register('password')}
                  error={errors.password?.message}
                />
                <p className="mt-1.5 text-xs text-gray-500 leading-tight">
                  8+ characters, 1 uppercase, 1 digit, 1 special character (!@#$%^&*), no spaces
                </p>
              </div>

              <Input
                label={
                  <>
                    Confirm Password <span className="text-red-500">*</span>
                  </>
                }
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                className="h-11 text-sm"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                loading={loading}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/auth/signin')}
                  className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Back to sign in
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Quote */}
        <div className="text-center mt-6">
          <blockquote className="text-sm text-gray-500 italic">
            "The secret of change is to focus all of your energy, not on fighting the old, but on
            building the new"
          </blockquote>
          <cite className="text-xs text-gray-400 mt-1">- Socrates</cite>
        </div>
      </div>
    </div>
  )
}
