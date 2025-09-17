import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import SEOHead from '../components/seo/SEOHead'
import { generateBreadcrumbSchema } from '../components/seo/StructuredData'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import HeaderNew from '../components/layout/HeaderNew'
import Footer from '../components/layout/Footer'
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  type: z.enum(['general', 'course', 'technical', 'partnership']),
})

type ContactForm = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: 'general',
    },
  })

  const onSubmit = async (data: ContactForm) => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Message sent successfully! We'll get back to you soon.")
      reset()
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      title: 'Email Us',
      details: 'info@eyogigurukul.com',
      description: 'Send us an email anytime',
    },
    {
      icon: PhoneIcon,
      title: 'Call Us',
      details: '+353 1 234 5678',
      description: 'Mon-Fri 9AM-6PM IST',
    },
    {
      icon: MapPinIcon,
      title: 'Visit Us',
      details: 'Dublin, Ireland',
      description: 'European Headquarters',
    },
    {
      icon: ClockIcon,
      title: 'Support Hours',
      details: '24/7 Online',
      description: 'AI chatbot always available',
    },
  ]

  const faqItems = [
    {
      question: 'How do I enroll in a course?',
      answer:
        'Create an account, browse our courses, and click "Enroll Now" on any course page. Payment and approval processes will guide you through the rest.',
    },
    {
      question: 'Are courses suitable for beginners?',
      answer:
        'Yes! We offer courses for all levels, from elementary (ages 4-7) to advanced (ages 16-19). Each course clearly indicates its level and prerequisites.',
    },
    {
      question: 'Do I get a certificate upon completion?',
      answer:
        'Yes, all students receive a digital certificate upon successful completion of their courses. Certificates include verification codes for authenticity.',
    },
    {
      question: 'Can I access courses from anywhere in the world?',
      answer:
        'Absolutely! Our online courses are accessible globally. We also offer some hybrid and in-person options in select locations.',
    },
    {
      question: 'What if I need help during a course?',
      answer:
        'Our teachers and support team are always available. You can message instructors directly, use our AI chatbot, or contact support anytime.',
    },
  ]

  return (
    <>
      <HeaderNew />
      <SEOHead
        title="Contact eYogi Gurukul - Hindu Education Support & Information"
        description="Contact eYogi Gurukul for questions about Hindu courses, Vedic education, enrollment, or Sanatan Dharma learning. Get support for your spiritual education journey."
        keywords={[
          'Contact Hindu Education',
          'eYogi Gurukul Contact',
          'Hindu Course Support',
          'Vedic Learning Help',
          'Sanatan Dharma Questions',
          'Hindu Education Support',
          'Gurukul Contact Information',
          'Hindu Course Enrollment Help',
          'Vedic Education Inquiry',
          'Hindu Learning Support',
          'Traditional Hindu Education Contact',
          'Hindu Culture Questions',
        ]}
        canonicalUrl="/contact"
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Contact Hindu Education Support', url: '/contact' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contact eYogi Gurukul',
            description:
              'Get in touch with eYogi Gurukul for Hindu education support, course information, and Vedic learning assistance.',
            url: 'https://eyogi-gurukul.vercel.app/contact',
            mainEntity: {
              '@type': 'ContactPoint',
              telephone: '+353-1-234-5678',
              email: 'info@eyogigurukul.com',
              contactType: 'Customer Service',
              availableLanguage: ['English', 'Hindi'],
            },
          },
        ]}
      />
      <div className="min-h-screen bg-gray-50 page-with-header">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-orange-50 to-red-50">
          <div className="container-max section-padding">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Get in <span className="gradient-text">Touch</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                Have questions about our courses, need technical support, or want to learn more
                about eYogi Gurukul? We're here to help you on your learning journey.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="section-padding bg-white">
          <div className="container-max">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {contactInfo.map((info, index) => (
                <Card key={index} className="text-center card-hover">
                  <CardContent className="pt-8">
                    <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <info.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
                    <p className="text-orange-600 font-medium mb-1">{info.details}</p>
                    <p className="text-gray-600 text-sm">{info.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & FAQ */}
        <section className="section-padding">
          <div className="container-max">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-orange-600" />
                      <h2 className="text-2xl font-bold">Send us a Message</h2>
                    </div>
                    <p className="text-gray-600">
                      Fill out the form below and we'll get back to you as soon as possible.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          label="Full Name"
                          {...register('name')}
                          error={errors.name?.message}
                        />
                        <Input
                          label="Email Address"
                          type="email"
                          {...register('email')}
                          error={errors.email?.message}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Inquiry Type
                        </label>
                        <select
                          {...register('type')}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="course">Course Information</option>
                          <option value="technical">Technical Support</option>
                          <option value="partnership">Partnership</option>
                        </select>
                        {errors.type && (
                          <p className="text-sm text-red-600">{errors.type.message}</p>
                        )}
                      </div>

                      <Input
                        label="Subject"
                        {...register('subject')}
                        error={errors.subject?.message}
                      />

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Message</label>
                        <textarea
                          {...register('message')}
                          rows={5}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                          placeholder="Tell us how we can help you..."
                        />
                        {errors.message && (
                          <p className="text-sm text-red-600">{errors.message.message}</p>
                        )}
                      </div>

                      <Button type="submit" className="w-full" loading={loading}>
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* FAQ */}
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <QuestionMarkCircleIcon className="h-6 w-6 text-orange-600" />
                  <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-4">
                  {faqItems.map((item, index) => (
                    <Card key={index} className="card-hover">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                        <p className="text-gray-600 text-sm">{item.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Need Immediate Help?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Our AI chatbot is available 24/7 to answer common questions and provide instant
                    support.
                  </p>
                  <Button variant="outline" size="sm">
                    Chat with AI Assistant
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding gradient-bg text-white">
          <div className="container-max text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Don't wait! Join thousands of students worldwide in discovering the timeless wisdom of
              Vedic traditions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100"
              >
                Browse Courses
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-orange-600"
              >
                Create Account
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
