import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { XMarkIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'
import CountrySelect from '../forms/CountrySelect'
import StateSelect from '../forms/StateSelect'
import { countryHasStates } from '../../lib/address-utils'
import { requestPasswordReset } from '../../lib/password-reset-utils'
import { getCourses } from '../../lib/api/courses'
import { requestEnrollmentAtSignup } from '../../lib/api/enrollments'
import { createChild } from '../../lib/api/children'
import { giveConsent } from '../../lib/api/consent'
import ConsentCheckbox from '../consent/ConsentCheckbox'
import type { Course } from '../../types'

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
      .min(1, 'Phone number is required')
      .regex(
        /^\+[1-9]\d{0,3}\s?\d{4,14}$/,
        'Phone must include country code (e.g., +91 9825412563)',
      ),
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
  const [alreadyExistsEmail, setAlreadyExistsEmail] = useState<string | null>(null)
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  // ── Unified registration + enrollment wizard state ──────────────────────
  const [signupStep, setSignupStep] = useState<'details' | 'child' | 'course' | 'complete'>('details')
  const [signupUserId, setSignupUserId] = useState<string | null>(null)
  const [signupRole, setSignupRole] = useState<string | null>(null)
  // Multiple children (parent)
  const [addedChildren, setAddedChildren] = useState<Array<{ id: string; name: string }>>([])
  // Multi-course selection: student → flat list; parent → per-child map
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [childCourseMap, setChildCourseMap] = useState<Record<string, string[]>>({})
  const [activeCourseChildId, setActiveCourseChildId] = useState<string | null>(null)
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [enrollSubmitting, setEnrollSubmitting] = useState(false)
  const [childData, setChildData] = useState({
    full_name: '',
    date_of_birth: '',
    grade: '',
    country: '',
    state: '',
    city: '',
  })
  const [childErrors, setChildErrors] = useState<Record<string, string>>({})
  const [childSubmitting, setChildSubmitting] = useState(false)
  // Participation consent (one-time per signup session). Once true, parent's
  // agreement is applied to every child added in this signup; for students it
  // is applied to themselves.
  const [signupConsent, setSignupConsent] = useState(false)
  const [signupConsentError, setSignupConsentError] = useState<string | null>(null)
  const { signIn, signUp } = useWebsiteAuth()
  const navigate = useNavigate()
  // Reset mode when modal opens with different initialMode
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setAlreadyExistsEmail(null)
      setSignupStep('details')
      setSignupUserId(null)
      setAddedChildren([])
      setSelectedCourseIds([])
      setChildCourseMap({})
      setActiveCourseChildId(null)
      setChildData({ full_name: '', date_of_birth: '', grade: '', country: '', state: '', city: '' })
      setChildErrors({})
      setSignupConsent(false)
      setSignupConsentError(null)
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
  // Load courses when the user reaches the course-selection step
  useEffect(() => {
    if (mode === 'signup' && signupStep === 'course') {
      setCoursesLoading(true)
      getCourses({ limit: 50 })
        .then(({ courses }) => setAvailableCourses(courses.filter((c) => c.is_active)))
        .catch(() => setAvailableCourses([]))
        .finally(() => setCoursesLoading(false))
    }
  }, [mode, signupStep])
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
  // Record participation consent for the given subject (a created child or
  // self-enrolling student). Best-effort — never blocks signup flow.
  const recordConsent = async (subjectId: string, consentedById: string) => {
    try {
      let ip_address: string | undefined
      try {
        const res = await fetch('https://api.ipify.org?format=json')
        if (res.ok) {
          const j = await res.json()
          ip_address = j.ip
        }
      } catch {
        // best effort only
      }
      await giveConsent({
        student_id: subjectId,
        consented_by: consentedById,
        ip_address,
        user_agent: navigator.userAgent,
      })
    } catch (err) {
      console.error('Failed to record consent:', err)
    }
  }

  const handleSignUp = async (data: SignUpForm) => {
    // For self-enrolling students, participation consent is required
    if (data.role === 'student' && !signupConsent) {
      setSignupConsentError('Participation consent is required to create your account')
      return
    }
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

      const { error, userId } = await signUp({
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
        if (error === 'An account with this email already exists') {
          setAlreadyExistsEmail(data.email)
        } else {
          toast.error(error)
        }
        return
      }
      // Advance the wizard instead of closing
      setAlreadyExistsEmail(null)
      signUpForm.reset()
      setSignupRole(data.role)
      setSignupUserId(userId || null)
      if (data.role === 'parent') {
        // Pre-fill child location from parent's account details
        setChildData({
          full_name: '',
          date_of_birth: '',
          grade: '',
          country: data.country || '',
          state: data.state || '',
          city: data.city || '',
        })
        setSignupStep('child')
      } else if (data.role === 'student') {
        // Record participation consent for self-enrolling student (best effort)
        if (signupConsent && userId) {
          recordConsent(userId, userId)
        }
        setSignupStep('course')
      } else {
        // teacher / other roles: no enrollment step
        setSignupStep('complete')
      }
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
  // ── Step 2 (Parent): add one child, accumulate, stay on step ──────────
  const handleChildSubmit = async () => {
    const errors: Record<string, string> = {}
    if (!childData.full_name.trim() || childData.full_name.trim().length < 2) {
      errors.full_name = "Child's full name must be at least 2 characters"
    }
    if (!childData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required'
    }
    if (!childData.country) {
      errors.country = 'Country is required'
    } else if (countryHasStates(childData.country) && !childData.state) {
      errors.state = 'State is required'
    } else if (!countryHasStates(childData.country) && !childData.city) {
      errors.city = 'City is required'
    }
    // Parent must give participation consent before adding any child
    if (!signupConsent) {
      setSignupConsentError('Participation consent is required to add a child')
      if (Object.keys(errors).length === 0) {
        return
      }
    }
    if (Object.keys(errors).length > 0) {
      setChildErrors(errors)
      return
    }
    if (!signupUserId) {
      setSignupStep('course')
      return
    }
    setChildSubmitting(true)
    try {
      const child = await createChild({
        full_name: childData.full_name.trim(),
        date_of_birth: childData.date_of_birth,
        grade: childData.grade || '',
        parent_id: signupUserId,
        country: childData.country,
        state: childData.state || '',
        city: childData.city || '',
      })
      // Record participation consent for the newly added child
      if (signupConsent && signupUserId) {
        recordConsent(child.id, signupUserId)
      }
      setAddedChildren((prev) => [...prev, { id: child.id, name: childData.full_name.trim() }])
      // Reset name/dob/grade but keep location for next sibling
      setChildData((prev) => ({ ...prev, full_name: '', date_of_birth: '', grade: '' }))
      setChildErrors({})
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add child. Please try again.')
    } finally {
      setChildSubmitting(false)
    }
  }
  // ── Step 3 / Last step: multi-course enrollment ─────────────────────
  const toggleStudentCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    )
  }
  const toggleChildCourse = (childId: string, courseId: string) => {
    setChildCourseMap((prev) => {
      const current = prev[childId] || []
      const updated = current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId]
      return { ...prev, [childId]: updated }
    })
  }
  const handleCourseEnroll = async (skip: boolean) => {
    if (skip) {
      setSignupStep('complete')
      return
    }
    setEnrollSubmitting(true)
    try {
      if (signupRole === 'parent') {
        const pairs: Array<{ childId: string; courseId: string }> = []
        for (const [childId, courseIds] of Object.entries(childCourseMap)) {
          for (const courseId of courseIds) {
            pairs.push({ childId, courseId })
          }
        }
        await Promise.allSettled(
          pairs.map(({ childId, courseId }) => requestEnrollmentAtSignup(courseId, childId)),
        )
      } else {
        if (signupUserId && selectedCourseIds.length > 0) {
          await Promise.allSettled(
            selectedCourseIds.map((courseId) =>
              requestEnrollmentAtSignup(courseId, signupUserId),
            ),
          )
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit enrollment requests.')
    } finally {
      setEnrollSubmitting(false)
      setSignupStep('complete')
    }
  }
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md flex items-start sm:items-center justify-center z-[60] px-4 py-6 sm:py-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="max-w-md w-full my-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh] sm:max-h-[95vh] overflow-y-auto">
        <Card className="shadow-2xl border border-orange-100/20 bg-white/98 backdrop-blur-xl rounded-xl sm:rounded-2xl overflow-hidden">
          {/* Gradient Header Bar */}
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"></div>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4 sm:pt-6 px-4 sm:px-6">
            <div className="flex-1 pr-2">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {mode === 'signin'
                  ? 'Welcome Back'
                  : mode === 'forgot-password'
                    ? 'Reset Password'
                    : signupStep === 'child'
                      ? 'Add Your Child'
                      : signupStep === 'course'
                        ? 'Choose a Course'
                        : signupStep === 'complete'
                          ? "You're All Set!"
                          : 'Join Us'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                {mode === 'signin'
                  ? 'Continue your learning journey'
                  : mode === 'forgot-password'
                    ? "We'll send you reset instructions"
                    : signupStep === 'child'
                      ? "Add your child's details (optional)"
                      : signupStep === 'course'
                        ? 'Pre-select a course to enroll in (optional)'
                        : signupStep === 'complete'
                          ? 'Your registration has been submitted'
                          : 'Start your Vedic learning journey'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-400 hover:text-gray-600 hover:rotate-90 cursor-pointer touch-manipulation flex-shrink-0"
              style={{ minWidth: '40px', minHeight: '40px' }}
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {mode === 'signin' ? (
              <form
                onSubmit={signInForm.handleSubmit(handleSignIn)}
                className="flex flex-col gap-3 sm:gap-4"
              >
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  className="h-11 sm:h-12 text-sm"
                  {...signInForm.register('email')}
                  error={signInForm.formState.errors.email?.message}
                />
                <div>
                  <Input
                    label="Password"
                    type={showSignInPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="h-11 sm:h-12 text-sm"
                    {...signInForm.register('password')}
                    error={signInForm.formState.errors.password?.message}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword((v) => !v)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                        aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignInPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    }
                  />
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-xs sm:text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-all cursor-pointer touch-manipulation"
                      style={{ minHeight: '36px' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:from-orange-700 active:to-red-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation text-sm sm:text-base"
                  loading={loading}
                >
                  Sign in
                </Button>
                <div className="text-center space-y-2">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="font-semibold text-transparent bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text hover:from-orange-700 hover:to-red-700 hover:bg-orange-50 px-2 py-1 rounded transition-all cursor-pointer touch-manipulation"
                      style={{ minHeight: '32px' }}
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            ) : mode === 'forgot-password' ? (
              <form
                onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)}
                className="flex flex-col gap-3 sm:gap-4"
              >
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 mb-2">
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  className="h-11 sm:h-12 text-sm"
                  placeholder="your@email.com"
                  {...forgotPasswordForm.register('email')}
                  error={forgotPasswordForm.formState.errors.email?.message}
                />
                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:from-orange-700 active:to-red-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation text-sm sm:text-base"
                  loading={loading}
                >
                  Send Reset Instructions
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded transition-all cursor-pointer touch-manipulation"
                    style={{ minHeight: '40px' }}
                  >
                    ← Back to sign in
                  </button>
                </div>
              </form>
            ) : signupStep === 'details' ? (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Input
                      label={
                        <>
                          Password <span className="text-red-500">*</span>
                        </>
                      }
                      type={showSignUpPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="h-10 sm:h-11 text-sm"
                      {...signUpForm.register('password')}
                      error={signUpForm.formState.errors.password?.message}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowSignUpPassword((v) => !v)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                          aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                        >
                          {showSignUpPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      }
                    />
                    <p className="mt-1 text-[10px] sm:text-xs text-gray-500 leading-tight">
                      8+ chars, 1 uppercase, 1 digit, 1 special (!@#$%^&*), no spaces
                    </p>
                  </div>
                  <Input
                    label={
                      <>
                        Confirm <span className="text-red-500">*</span>
                      </>
                    }
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="h-10 sm:h-11 text-sm"
                    {...signUpForm.register('confirmPassword')}
                    error={signUpForm.formState.errors.confirmPassword?.message}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="role"
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                    >
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...signUpForm.register('role')}
                      className="w-full h-10 sm:h-11 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all touch-manipulation"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                    </select>
                  </div>
                  <Input
                    label={
                      <>
                        Phone Number <span className="text-red-500">*</span>
                      </>
                    }
                    type="tel"
                    placeholder="+91 9825412563"
                    className="h-10 sm:h-11 text-sm"
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
                  className="h-10 sm:h-11 text-xs sm:text-sm"
                  style={{ fontSize: '13px' }}
                  {...signUpForm.register('date_of_birth')}
                  error={signUpForm.formState.errors.date_of_birth?.message}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
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
                      className="h-10 sm:h-11 text-sm"
                    />
                    {signUpForm.formState.errors.country && (
                      <p className="mt-1 text-[10px] sm:text-xs text-red-600">
                        {signUpForm.formState.errors.country.message}
                      </p>
                    )}
                  </div>
                  {signUpForm.watch('country') && countryHasStates(signUpForm.watch('country')) ? (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <StateSelect
                        countryCode={signUpForm.watch('country') || ''}
                        value={signUpForm.watch('state') || ''}
                        onChange={(value) => signUpForm.setValue('state', value)}
                        placeholder="Select State"
                        className="h-10 sm:h-11 text-sm"
                        required
                      />
                      {signUpForm.formState.errors.state && (
                        <p className="mt-1 text-[10px] sm:text-xs text-red-600">
                          {signUpForm.formState.errors.state.message}
                        </p>
                      )}
                    </div>
                  ) : signUpForm.watch('country') ? (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter city"
                        className="h-10 sm:h-11 text-sm"
                        {...signUpForm.register('city')}
                        error={signUpForm.formState.errors.city?.message}
                      />
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
                {alreadyExistsEmail && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-blue-800 font-medium mb-1">
                      You are already registered
                    </p>
                    <p className="text-xs sm:text-sm text-blue-700">
                      An account with <span className="font-semibold">{alreadyExistsEmail}</span>{' '}
                      already exists. If you have forgotten your password, please use the{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAlreadyExistsEmail(null)
                          setMode('forgot-password')
                        }}
                        className="font-semibold underline hover:text-blue-900 cursor-pointer"
                      >
                        Forgot Password
                      </button>{' '}
                      link to reset it.
                    </p>
                  </div>
                )}
                {/* Participation consent — required when self-enrolling as a student */}
                {signUpForm.watch('role') === 'student' && (
                  <ConsentCheckbox
                    checked={signupConsent}
                    onChange={(v) => {
                      setSignupConsent(v)
                      if (v) setSignupConsentError(null)
                    }}
                    subjectLabel="yourself"
                    error={signupConsentError || undefined}
                    disabled={loading}
                  />
                )}
                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 mt-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:from-orange-700 active:to-red-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation text-sm sm:text-base"
                  loading={loading}
                >
                  Create Account &amp; Continue
                </Button>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAlreadyExistsEmail(null)
                        setMode('signin')
                      }}
                      className="font-semibold text-transparent bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text hover:from-orange-700 hover:to-red-700 hover:bg-orange-50 px-2 py-1 rounded transition-all cursor-pointer touch-manipulation"
                      style={{ minHeight: '32px' }}
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            ) : signupStep === 'child' ? (
              /* ── Step 2 (Parent only): Add children ──────────────────────── */
              <div className="flex flex-col gap-3">
                {/* Step progress */}
                <div className="flex items-center gap-1.5 mb-1 text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white font-bold">✓</span>
                  <span className="text-gray-400">Account</span>
                  <div className="h-px flex-1 bg-orange-200" />
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white font-bold">2</span>
                  <span className="font-medium text-orange-600">Children</span>
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 font-bold">3</span>
                  <span className="text-gray-400">Courses</span>
                </div>
                {/* Added children list */}
                {addedChildren.length > 0 && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-2.5 space-y-1">
                    <p className="text-xs font-medium text-green-800">Added children:</p>
                    {addedChildren.map((c, i) => (
                      <div key={c.id} className="flex items-center gap-2 text-xs text-green-700">
                        <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{i + 1}. {c.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {addedChildren.length === 0
                    ? 'Add your children below. You can add more than one.'
                    : 'Add another child, or continue to select courses.'}
                </p>
                <Input
                  label={<>Child's Full Name <span className="text-red-500">*</span></>}
                  value={childData.full_name}
                  onChange={(e) => setChildData((p) => ({ ...p, full_name: e.target.value }))}
                  className="h-10 text-sm"
                  error={childErrors.full_name}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={<>Date of Birth <span className="text-red-500">*</span></>}
                    type="date"
                    value={childData.date_of_birth}
                    onChange={(e) => setChildData((p) => ({ ...p, date_of_birth: e.target.value }))}
                    className="h-10 text-sm"
                    error={childErrors.date_of_birth}
                  />
                  <Input
                    label="Grade (optional)"
                    value={childData.grade}
                    onChange={(e) => setChildData((p) => ({ ...p, grade: e.target.value }))}
                    placeholder="e.g. Grade 5"
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <CountrySelect
                    value={childData.country}
                    onChange={(v) => setChildData((p) => ({ ...p, country: v, state: '', city: '' }))}
                    required
                    placeholder="Select Country"
                    className="h-10 text-sm"
                  />
                  {childErrors.country && (
                    <p className="mt-1 text-xs text-red-600">{childErrors.country}</p>
                  )}
                </div>
                {childData.country && countryHasStates(childData.country) ? (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <StateSelect
                      countryCode={childData.country}
                      value={childData.state}
                      onChange={(v) => setChildData((p) => ({ ...p, state: v }))}
                      placeholder="Select State"
                      className="h-10 text-sm"
                      required
                    />
                    {childErrors.state && (
                      <p className="mt-1 text-xs text-red-600">{childErrors.state}</p>
                    )}
                  </div>
                ) : childData.country ? (
                  <Input
                    label={<>City <span className="text-red-500">*</span></>}
                    value={childData.city}
                    onChange={(e) => setChildData((p) => ({ ...p, city: e.target.value }))}
                    placeholder="Enter city"
                    className="h-10 text-sm"
                    error={childErrors.city}
                  />
                ) : null}
                {/* Participation consent — required once for all children */}
                {addedChildren.length === 0 && (
                  <ConsentCheckbox
                    checked={signupConsent}
                    onChange={(v) => {
                      setSignupConsent(v)
                      if (v) setSignupConsentError(null)
                    }}
                    subjectLabel={
                      childData.full_name.trim() ? childData.full_name.trim() : 'your child'
                    }
                    error={signupConsentError || undefined}
                    disabled={childSubmitting}
                  />
                )}
                {addedChildren.length > 0 && signupConsent && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-800 flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
                    Participation consent recorded for your children.
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={handleChildSubmit}
                    loading={childSubmitting}
                    className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg touch-manipulation text-sm"
                  >
                    {addedChildren.length === 0 ? 'Add Child' : 'Add Another Child'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setActiveCourseChildId(addedChildren[0]?.id || null)
                      setSignupStep('course')
                    }}
                    disabled={childSubmitting}
                    className="w-full h-10 border border-orange-300 text-orange-600 bg-white hover:bg-orange-50 font-medium touch-manipulation text-sm"
                  >
                    {addedChildren.length === 0 ? 'Skip' : 'Continue to Courses →'}
                  </Button>
                </div>
              </div>
            ) : signupStep === 'course' ? (
              /* ── Step: Multi-course selection ───────────────────────────── */
              <div className="flex flex-col gap-3">
                {/* Step progress */}
                <div className="flex items-center gap-1.5 mb-1 text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white font-bold">✓</span>
                  <span className="text-gray-400">Account</span>
                  {signupRole === 'parent' && (
                    <>
                      <div className="h-px flex-1 bg-green-200" />
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white font-bold">✓</span>
                      <span className="text-gray-400">Children</span>
                    </>
                  )}
                  <div className="h-px flex-1 bg-orange-200" />
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white font-bold">
                    {signupRole === 'parent' ? '3' : '2'}
                  </span>
                  <span className="font-medium text-orange-600">Courses</span>
                </div>
                <p className="text-xs text-gray-500">
                  Select one or more courses. Enrollment requests will be reviewed once your account
                  is approved.
                </p>
                {/* Parent: child tabs */}
                {signupRole === 'parent' && addedChildren.length > 1 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {addedChildren.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setActiveCourseChildId(child.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          (activeCourseChildId || addedChildren[0]?.id) === child.id
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
                        }`}
                      >
                        {child.name}
                        {(childCourseMap[child.id]?.length || 0) > 0 && (
                          <span className="ml-1.5 bg-white/30 text-xs rounded-full px-1">
                            {childCourseMap[child.id].length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {signupRole === 'parent' && addedChildren.length === 0 ? (
                  <p className="text-center py-4 text-sm text-gray-500">
                    No children were added. You can enroll children from your dashboard after account
                    approval.
                  </p>
                ) : coursesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                  </div>
                ) : availableCourses.length === 0 ? (
                  <p className="text-center py-6 text-sm text-gray-500">
                    No courses available at the moment.
                  </p>
                ) : (
                  <>
                    {signupRole === 'parent' && addedChildren.length === 1 && (
                      <p className="text-xs font-medium text-gray-700">
                        Courses for <span className="text-orange-600">{addedChildren[0].name}</span>:
                      </p>
                    )}
                    {signupRole === 'parent' && addedChildren.length > 1 && (
                      <p className="text-xs font-medium text-gray-700">
                        Courses for{' '}
                        <span className="text-orange-600">
                          {addedChildren.find((c) => c.id === activeCourseChildId)?.name ||
                            addedChildren[0].name}
                        </span>:
                      </p>
                    )}
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                      {availableCourses.map((course) => {
                        const childId =
                          signupRole === 'parent'
                            ? (activeCourseChildId || addedChildren[0]?.id)
                            : null
                        const isChecked =
                          signupRole === 'parent'
                            ? childId
                              ? (childCourseMap[childId] || []).includes(course.id)
                              : false
                            : selectedCourseIds.includes(course.id)
                        const handleToggle = () => {
                          if (signupRole === 'parent' && childId) {
                            toggleChildCourse(childId, course.id)
                          } else {
                            toggleStudentCourse(course.id)
                          }
                        }
                        return (
                          <label
                            key={course.id}
                            className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                              isChecked
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={handleToggle}
                              className="mt-0.5 accent-orange-500 flex-shrink-0 h-4 w-4"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {course.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(course as any).gurukul?.name
                                  ? `${(course as any).gurukul.name} · `
                                  : ''}
                                {course.level}
                              </p>
                              {course.price > 0 && (
                                <p className="text-xs text-orange-600 font-medium mt-0.5">
                                  {course.currency} {course.price}
                                </p>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                    {/* Summary of selections */}
                    {signupRole === 'parent' && addedChildren.length > 1 && (
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {addedChildren.map((child) => (
                          <div key={child.id}>
                            {child.name}:{' '}
                            <span className="font-medium text-gray-700">
                              {(childCourseMap[child.id]?.length || 0) === 0
                                ? 'no courses selected'
                                : `${childCourseMap[child.id].length} course(s) selected`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={() => handleCourseEnroll(false)}
                    loading={enrollSubmitting}
                    disabled={
                      coursesLoading ||
                      (signupRole === 'parent'
                        ? Object.values(childCourseMap).every((ids) => ids.length === 0)
                        : selectedCourseIds.length === 0)
                    }
                    className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg touch-manipulation text-sm disabled:opacity-50"
                  >
                    Submit Enrollment
                    {signupRole === 'parent'
                      ? ` (${Object.values(childCourseMap).reduce((s, ids) => s + ids.length, 0)} request${
                          Object.values(childCourseMap).reduce((s, ids) => s + ids.length, 0) !== 1
                            ? 's'
                            : ''
                        })`
                      : selectedCourseIds.length > 0
                        ? ` (${selectedCourseIds.length} course${selectedCourseIds.length !== 1 ? 's' : ''})`
                        : ''}
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleCourseEnroll(true)}
                    disabled={enrollSubmitting}
                    className="text-sm text-gray-500 hover:text-gray-700 py-2 touch-manipulation"
                  >
                    Skip for now →
                  </button>
                </div>
              </div>
            ) : (
              /* ── Complete step ────────────────────────────────────────────── */
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircleIcon className="h-10 w-10 text-green-500" />
                </div>
                <div className="text-center space-y-1.5">
                  <h4 className="text-lg font-bold text-gray-800">Registration Submitted!</h4>
                  <p className="text-sm text-gray-600">
                    Your account is pending admin approval. You'll receive an email once it's
                    activated.
                  </p>
                  {signupRole === 'parent' &&
                    addedChildren.length > 0 &&
                    Object.values(childCourseMap).some((ids) => ids.length > 0) && (
                      <p className="text-sm text-gray-600">
                        Enrollment requests have been submitted for your children and will be
                        processed after account approval.
                      </p>
                    )}
                  {signupRole === 'student' && selectedCourseIds.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {selectedCourseIds.length} enrollment request
                      {selectedCourseIds.length !== 1 ? 's have' : ' has'} been submitted and will
                      be processed after account approval.
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={onClose}
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg"
                >
                  Done
                </Button>
                <p className="text-xs text-gray-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin')
                      setSignupStep('details')
                    }}
                    className="font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
