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

const signUpSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    age: z.number().min(4, 'Age must be at least 4').max(100, 'Age must be less than 100'),
    role: z.enum(['student', 'teacher']),
    phone: z.string().optional(),
    parent_guardian_name: z.string().optional(),
    parent_guardian_email: z.string().email().optional().or(z.literal('')),
    parent_guardian_phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.age < 18 && data.role === 'student') {
        return data.parent_guardian_name && data.parent_guardian_email
      }
      return true
    },
    {
      message: 'Parent/Guardian information is required for students under 18',
      path: ['parent_guardian_name'],
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
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: 'student',
    },
  })

  const watchAge = watch('age')
  const watchRole = watch('role')

  const onSubmit = async (data: SignUpForm) => {
    setLoading(true)
    try {
      const { error } = await signUp({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: data.role as 'student' | 'teacher',
        phone: data.phone,
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 page-with-header">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">eY</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/auth/signin" className="font-medium text-orange-600 hover:text-orange-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Join eYogi Gurukul</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  {...register('full_name')}
                  error={errors.full_name?.message}
                />

                <Input
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  error={errors.email?.message}
                />

                <Input
                  label="Age"
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                  error={errors.age?.message}
                />

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    {...register('role')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                  {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
                </div>

                <Input
                  label="Phone Number (Optional)"
                  type="tel"
                  {...register('phone')}
                  error={errors.phone?.message}
                />
              </div>

              {/* Parent/Guardian Information for Minors */}
              {watchAge < 18 && watchRole === 'student' && (
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Parent/Guardian Information (Required for students under 18)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Parent/Guardian Name"
                      {...register('parent_guardian_name')}
                      error={errors.parent_guardian_name?.message}
                    />

                    <Input
                      label="Parent/Guardian Email"
                      type="email"
                      {...register('parent_guardian_email')}
                      error={errors.parent_guardian_email?.message}
                    />

                    <Input
                      label="Parent/Guardian Phone"
                      type="tel"
                      {...register('parent_guardian_phone')}
                      error={errors.parent_guardian_phone?.message}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  error={errors.password?.message}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                  I agree to the{' '}
                  <Link to="/terms" className="text-orange-600 hover:text-orange-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-orange-600 hover:text-orange-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                Create Account
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
