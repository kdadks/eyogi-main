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
import CountrySelect from '../forms/CountrySelect'
import StateSelect from '../forms/StateSelect'
import { countryHasStates } from '../../lib/address-utils'
import { requestPasswordReset } from '../../lib/password-reset-utils'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
})

const signUpSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
      .refine((val) => !/\s/.test(val), 'Password must not contain spaces'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    full_name: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .regex(/^[a-zA-Z\s']+$/, 'Full name can only contain letters, spaces, and apostrophes'),
    role: z.enum(['student', 'teacher', 'parent'], { required_error: 'Role is required' }),
    phone: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), 'Phone number can only contain numbers'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    country: z.string().min(1, 'Country is required'),
    state: z.string().optional(),
    city: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[a-zA-Z\s]+$/.test(val),
        'City can only contain letters and spaces',
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (!data.country) return true
      if (countryHasStates(data.country)) {
        return !!data.state
      } else {
        return !!data.city && /^[a-zA-Z\s]+$/.test(data.city)
      }
    },
    {
      message: 'This field is required',
      path: ['city'],
    },
  )
  .refine(
    (data) => {
      // Calculate age from date of birth
      const today = new Date()
      const birthDate = new Date(data.date_of_birth)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      // Validate age range
      if (age < 4 || age > 100) {
        return false
      }
      return true
    },
    {
      message: 'You must be between 4 and 100 years old',
      path: ['date_of_birth'],
    },
  )
  .refine(
    (data) => {
      // Calculate age from date of birth for student validation
      const today = new Date()
      const birthDate = new Date(data.date_of_birth)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (data.role === 'student' && age < 18) {
        return false
      }
      return true
    },
    {
      message: 'Ask your parent to register for you',
      path: ['date_of_birth'],
    },
  )
type SignInForm = z.infer<typeof signInSchema>
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>
type SignUpForm = z.infer<typeof signUpSchema>
interface WebsiteAuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup' | 'forgot-password'
  redirectAfterAuth?: string | false // false means stay on current page
}
export default function WebsiteAuthModal({
  isOpen,
  onClose,
  initialMode = 'signin',
  redirectAfterAuth = '/dashboard',
}: WebsiteAuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot-password'>(initialMode)
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
    mode: 'onChange',
  })

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  })

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      role: 'student',
      country: '',
      state: '',
      city: '',
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
  const handleForgotPassword = async (data: ForgotPasswordForm) => {
    setLoading(true)
    try {
      const result = await requestPasswordReset(data.email)

      if (result.success) {
        toast.success(
          'If an account exists with this email, you will receive password reset instructions.',
        )
        forgotPasswordForm.reset()
        // Switch back to signin after a delay
        setTimeout(() => {
          setMode('signin')
        }, 3000)
      } else {
        toast.error(result.error || 'Failed to process request')
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to process request')
      }
    } finally {
      setLoading(false)
    }
  }
  const handleSignUp = async (data: SignUpForm) => {
    setLoading(true)
    try {
      // Calculate age from date of birth
      const today = new Date()
      const birthDate = new Date(data.date_of_birth)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      const { error } = await signUp({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        age: age,
        country: data.country,
        state: data.state,
        city: data.city,
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
      className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4 overflow-y-auto animate-in fade-in duration-300"
      onClick={handleOverlayClick}
    >
      <div className="max-w-md w-full my-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <Card className="shadow-2xl border border-orange-100/20 bg-white/98 backdrop-blur-xl rounded-2xl overflow-hidden">
          {/* Gradient Header Bar */}
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"></div>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {mode === 'signin'
                  ? 'Welcome Back'
                  : mode === 'forgot-password'
                    ? 'Reset Password'
                    : 'Join Us'}
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {mode === 'signin'
                  ? 'Continue your learning journey'
                  : mode === 'forgot-password'
                    ? "We'll send you reset instructions"
                    : 'Start your Vedic learning journey'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-400 hover:text-gray-600 hover:rotate-90"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {mode === 'signin' ? (
              <form
                onSubmit={signInForm.handleSubmit(handleSignIn)}
                className="flex flex-col gap-4"
              >
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  className="h-11 text-sm"
                  {...signInForm.register('email')}
                  error={signInForm.formState.errors.email?.message}
                />
                <div>
                  <Input
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    className="h-11 text-sm"
                    {...signInForm.register('password')}
                    error={signInForm.formState.errors.password?.message}
                  />
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 rounded transition-all cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  loading={loading}
                >
                  Sign in
                </Button>
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="font-semibold text-transparent bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text hover:from-orange-700 hover:to-red-700 hover:bg-orange-50 px-2 py-0.5 rounded transition-all cursor-pointer"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            ) : mode === 'forgot-password' ? (
              <form
                onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)}
                className="flex flex-col gap-4"
              >
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                  <p className="text-sm text-gray-700">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  className="h-11 text-sm"
                  placeholder="your@email.com"
                  {...forgotPasswordForm.register('email')}
                  error={forgotPasswordForm.formState.errors.email?.message}
                />
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  loading={loading}
                >
                  Send Reset Instructions
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded transition-all cursor-pointer"
                  >
                    ← Back to sign in
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={signUpForm.handleSubmit(handleSignUp)}
                className="flex flex-col gap-3.5"
              >
                <Input
                  label={
                    <>
                      Full Name <span className="text-red-500">*</span>
                    </>
                  }
                  className="h-10 text-sm"
                  {...signUpForm.register('full_name')}
                  error={signUpForm.formState.errors.full_name?.message}
                />
                <Input
                  label={
                    <>
                      Email address <span className="text-red-500">*</span>
                    </>
                  }
                  type="email"
                  autoComplete="email"
                  className="h-10 text-sm"
                  {...signUpForm.register('email')}
                  error={signUpForm.formState.errors.email?.message}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      label={
                        <>
                          Password <span className="text-red-500">*</span>
                        </>
                      }
                      type="password"
                      autoComplete="new-password"
                      className="h-10 text-sm"
                      {...signUpForm.register('password')}
                      error={signUpForm.formState.errors.password?.message}
                    />
                    <p className="mt-1 text-xs text-gray-500 leading-tight">
                      8+ chars, 1 uppercase, 1 digit, 1 special (!@#$%^&*), no spaces
                    </p>
                  </div>
                  <Input
                    label={
                      <>
                        Confirm <span className="text-red-500">*</span>
                      </>
                    }
                    type="password"
                    autoComplete="new-password"
                    className="h-10 text-sm"
                    {...signUpForm.register('confirmPassword')}
                    error={signUpForm.formState.errors.confirmPassword?.message}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...signUpForm.register('role')}
                      className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                    </select>
                  </div>
                  <Input
                    label="Phone"
                    type="tel"
                    className="h-10 text-sm"
                    {...signUpForm.register('phone')}
                    error={signUpForm.formState.errors.phone?.message}
                  />
                </div>
                <Input
                  label={
                    <>
                      Date of Birth <span className="text-red-500">*</span>
                    </>
                  }
                  type="date"
                  className="h-10 text-sm"
                  {...signUpForm.register('date_of_birth')}
                  error={signUpForm.formState.errors.date_of_birth?.message}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <CountrySelect
                      value={signUpForm.watch('country') || ''}
                      onChange={(value) => {
                        signUpForm.setValue('country', value)
                        signUpForm.setValue('state', '')
                        signUpForm.setValue('city', '')
                      }}
                      required
                      placeholder="Select Country"
                      className="h-10 text-sm"
                    />
                    {signUpForm.formState.errors.country && (
                      <p className="mt-1 text-xs text-red-600">
                        {signUpForm.formState.errors.country.message}
                      </p>
                    )}
                  </div>
                  {signUpForm.watch('country') && countryHasStates(signUpForm.watch('country')) ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <StateSelect
                        countryCode={signUpForm.watch('country') || ''}
                        value={signUpForm.watch('state') || ''}
                        onChange={(value) => signUpForm.setValue('state', value)}
                        placeholder="Select State"
                        className="h-10 text-sm"
                        required
                      />
                      {signUpForm.formState.errors.state && (
                        <p className="mt-1 text-xs text-red-600">
                          {signUpForm.formState.errors.state.message}
                        </p>
                      )}
                    </div>
                  ) : signUpForm.watch('country') ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter city"
                        className="h-10 text-sm"
                        {...signUpForm.register('city')}
                        error={signUpForm.formState.errors.city?.message}
                      />
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-10 mt-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  loading={loading}
                >
                  Create Account
                </Button>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="font-semibold text-transparent bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text hover:from-orange-700 hover:to-red-700 hover:bg-orange-50 px-2 py-0.5 rounded transition-all cursor-pointer"
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
