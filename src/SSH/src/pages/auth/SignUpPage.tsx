import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'
import CountrySelect from '../../components/forms/CountrySelect'
import StateSelect from '../../components/forms/StateSelect'
import { countryHasStates } from '../../lib/address-utils'

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
type SignUpForm = z.infer<typeof signUpSchema>
export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  // Note: This page is no longer used - replaced by AuthRedirect + Modal
  const { signUp } = useWebsiteAuth()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      role: 'student',
      country: '',
      state: '',
      city: '',
    },
  })
  const onSubmit = async (data: SignUpForm) => {
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
        role: data.role as 'student' | 'teacher' | 'parent',
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        age: age,
        country: data.country,
        state: data.state,
        city: data.city,
      })
      if (error) {
        // Check if it's actually a success message that needs email confirmation
        if (error.includes('Account created! Please check your email')) {
          toast.success(error)
          navigate('/auth/signin')
        } else {
          toast.error(error)
        }
        return
      }
      toast.success('Account created successfully! You can now sign in.')
      navigate('/auth/signin')
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 page-with-header">
      <div className="max-w-4xl w-full space-y-8">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Our Community</h1>
          <p className="text-lg text-gray-600 mb-6">
            Begin your journey of Vedic learning and spiritual growth
          </p>
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/auth/signin"
              className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Sign Up Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <h2 className="text-2xl font-semibold text-gray-800">Create Your Account</h2>
            <p className="text-gray-600 mt-1">Join the eYogi Gurukul community</p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={<>Full Name <span className="text-red-500">*</span></>}
                    placeholder="Enter your full name"
                    className="h-12 text-base"
                    {...register('full_name')}
                    error={errors.full_name?.message}
                  />
                  <Input
                    label={<>Email Address <span className="text-red-500">*</span></>}
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    className="h-12 text-base"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                  <Input
                    label={<>Date of Birth <span className="text-red-500">*</span></>}
                    type="date"
                    className="h-12 text-base"
                    {...register('date_of_birth')}
                    error={errors.date_of_birth?.message}
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('role')}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3 h-12 bg-white"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                    </select>
                    {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
                  </div>
                  <Input
                    label="Phone Number (Optional)"
                    type="tel"
                    placeholder="Your phone number"
                    className="h-12 text-base"
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <CountrySelect
                      value={watch('country') || ''}
                      onChange={(value) => {
                        setValue('country', value)
                        setValue('state', '')
                        setValue('city', '')
                      }}
                      required
                      placeholder="Select Country"
                      className="h-12"
                    />
                    {errors.country && (
                      <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                    )}
                  </div>
                  {watch('country') && countryHasStates(watch('country')) ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State/Province <span className="text-red-500">*</span>
                      </label>
                      <StateSelect
                        countryCode={watch('country') || ''}
                        value={watch('state') || ''}
                        onChange={(value) => setValue('state', value)}
                        placeholder="Select State/Province"
                        className="h-12"
                        required
                      />
                      {errors.state && (
                        <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                      )}
                    </div>
                  ) : watch('country') ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter your city"
                        className="h-12 text-base"
                        {...register('city')}
                        error={errors.city?.message}
                      />
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              </div>

              {/* Password Section */
              <div className="space-y-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label={<>Password <span className="text-red-500">*</span></>}
                      type="password"
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      className="h-12 text-base"
                      {...register('password')}
                      error={errors.password?.message}
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      Must be 8+ characters with 1 uppercase, 1 digit, 1 special character (!@#$%^&*), no spaces
                    </p>
                  </div>
                  <div>
                    <Input
                      label={<>Confirm Password <span className="text-red-500">*</span></>}
                      type="password"
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      className="h-12 text-base"
                      {...register('confirmPassword')}
                      error={errors.confirmPassword?.message}
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <div className="flex items-start">
                  <input
                    id="agree-terms"
                    name="agree-terms"
                    type="checkbox"
                    required
                    className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mt-0.5"
                  />
                  <label htmlFor="agree-terms" className="ml-3 block text-sm text-gray-700">
                    I agree to the{' '}
                    <Link
                      to="/terms"
                      className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      to="/privacy"
                      className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200"
                loading={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
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
                Having trouble creating an account?{' '}
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
            "Education is the most powerful weapon which you can use to change the world"
          </blockquote>
          <cite className="text-xs text-gray-400 mt-1">- Nelson Mandela</cite>
        </div>
      </div>
    </div>
  )
}
