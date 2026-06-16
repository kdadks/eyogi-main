import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { supabaseAdmin } from '@/lib/supabase'
import toast from 'react-hot-toast'

const QuizAnswerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
})

type FormSchema = z.infer<typeof QuizAnswerFormSchema>

export default function QuizAnswerPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(QuizAnswerFormSchema),
  })

  const onSubmit = async (values: FormSchema) => {
    setLoading(true)
    try {
      const { error } = await supabaseAdmin
        .from('quiz_answers')
        .insert([
          {
            name: values.name.trim(),
            email: values.email.trim().toLowerCase(),
            phone: values.phone.trim(),
          },
        ])

      if (error) throw error

      toast.success('Information saved successfully!')
      setSubmitted(true)
    } catch (error) {
      console.error('Error saving information:', error)
      toast.error('Failed to save information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-4">
              Quiz Answers
            </h1>
            <p className="text-gray-600 text-lg">
              Thank you for providing your information! Here are the answers to the quizzes:
            </p>
          </div>

          <div className="space-y-8">
            {/* Quiz Answers Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">General Knowledge Quiz Answers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-900">1. Who gave the teachings of the Bhagavad Gita?</span>
                    <span className="text-green-600 font-semibold mt-1 sm:mt-0">C. Lord Krishna</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-900">2. Which epic tells the story of Lord Rama?</span>
                    <span className="text-green-600 font-semibold mt-1 sm:mt-0">B. Ramayana</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-900">3. Which Indian festival symbolizing the victory of light over darkness and good over evil?</span>
                    <span className="text-green-600 font-semibold mt-1 sm:mt-0">B. Diwali</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-900">4. Who composed the Mahabharata?</span>
                    <span className="text-green-600 font-semibold mt-1 sm:mt-0">B. Vyasa</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-900">5. What is the meaning of the sacred mantra "Gayatri Mantra" in essence?</span>
                    <span className="text-green-600 font-semibold mt-1 sm:mt-0">C. Prayer for intellect</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Section */}
            <div className="mt-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Ready to Learn More?
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/courses"
                  className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  Explore Our Courses
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                <Link
                  to="/gurukuls"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  Learn About Gurukuls
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Pictionary Quiz Answers Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Pictionary Quiz Answers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">1</div>
                    <div className="font-medium text-gray-900">Mahatma Gandhi</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">2</div>
                    <div className="font-medium text-gray-900">Veena</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">3</div>
                    <div className="font-medium text-gray-900">Kedarnath</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">4</div>
                    <div className="font-medium text-gray-900">Lotus</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">5</div>
                    <div className="font-medium text-gray-900">Gautam Buddha</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-4">
            Quiz Answer Access
          </h1>
          <p className="text-gray-600 text-lg">
            Please provide your information to view the quiz answer
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Information Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  {...register('phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Access Quiz Answer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}