import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signUpSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z.enum(['student', 'teacher']),
    phone: z.string().optional(),
    date_of_birth: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SignInForm = z.infer<typeof signInSchema>
type SignUpForm = z.infer<typeof signUpSchema>

interface WebsiteAuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
  redirectAfterAuth?: string | false // false means stay on current page
}

export default function WebsiteAuthModal({
  isOpen,
  onClose,
  initialMode = 'signin',
  redirectAfterAuth = '/dashboard',
}: WebsiteAuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useWebsiteAuth()
  const navigate = useNavigate()

  // Reset mode when modal opens with different initialMode
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
    }
  }, [isOpen, initialMode])

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  })

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: 'student',
    },
  })

  // Handle escape key to close modal and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleSignIn = async (data: SignInForm) => {
    setLoading(true)
    try {
      const { error } = await signIn(data.email, data.password)

      if (error) {
        toast.error(error)
        return
      }

      toast.success('Welcome back!')
      onClose()

      // Conditionally redirect after successful login
      if (redirectAfterAuth !== false) {
        navigate(redirectAfterAuth)
      }
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

  const handleSignUp = async (data: SignUpForm) => {
    setLoading(true)
    try {
      const { error } = await signUp({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
        phone: data.phone,
        date_of_birth: data.date_of_birth,
      })

      if (error) {
        toast.error(error)
        return
      }

      toast.success('Account created successfully! You can now sign in.')
      setMode('signin')
      signUpForm.reset()
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to create account')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div className="max-w-md w-full my-8 animate-in zoom-in-95 duration-200">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </CardHeader>
          <CardContent>
            {mode === 'signin' ? (
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  {...signInForm.register('email')}
                  error={signInForm.formState.errors.email?.message}
                />

                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  {...signInForm.register('password')}
                  error={signInForm.formState.errors.password?.message}
                />

                <Button type="submit" className="w-full" loading={loading}>
                  Sign in
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="font-medium text-orange-600 hover:text-orange-500"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <Input
                  label="Full Name"
                  {...signUpForm.register('full_name')}
                  error={signUpForm.formState.errors.full_name?.message}
                />

                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  {...signUpForm.register('email')}
                  error={signUpForm.formState.errors.email?.message}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    {...signUpForm.register('password')}
                    error={signUpForm.formState.errors.password?.message}
                  />

                  <Input
                    label="Confirm Password"
                    type="password"
                    autoComplete="new-password"
                    {...signUpForm.register('confirmPassword')}
                    error={signUpForm.formState.errors.confirmPassword?.message}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      I am a
                    </label>
                    <select
                      {...signUpForm.register('role')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </div>

                  <Input
                    label="Phone (Optional)"
                    type="tel"
                    {...signUpForm.register('phone')}
                    error={signUpForm.formState.errors.phone?.message}
                  />
                </div>

                <Input
                  label="Date of Birth (Optional)"
                  type="date"
                  {...signUpForm.register('date_of_birth')}
                  error={signUpForm.formState.errors.date_of_birth?.message}
                />

                <Button type="submit" className="w-full" loading={loading}>
                  Create Account
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="font-medium text-orange-600 hover:text-orange-500"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
