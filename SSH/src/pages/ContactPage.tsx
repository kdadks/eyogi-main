import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import SEOHead from '../components/seo/SEOHead'
import { generateBreadcrumbSchema } from '../components/seo/StructuredData'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { getContactPageCMS, ContactPageCMSSettings } from '../lib/api/contactPageCMS'
import { getBackgroundStyle } from '../utils/backgroundStyler'
import '../components/styles/quill-preview.css'

import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  type: z.enum(['general', 'course', 'technical', 'partnership']),
})
type ContactForm = z.infer<typeof contactSchema>

// Icon mapping
const getIcon = (iconName: string) => {
  const icons: Record<string, typeof EnvelopeIcon> = {
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    QuestionMarkCircleIcon,
    UserGroupIcon,
    GlobeAltIcon,
  }
  return icons[iconName] || EnvelopeIcon
}

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [cmsData, setCmsData] = useState<ContactPageCMSSettings | null>(null)
  const [cmsLoading, setCmsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    const fetchCMSData = async () => {
      try {
        setCmsLoading(true)
        setError(null)
        const data = await getContactPageCMS('contact')

        if (!data) {
          console.warn('No CMS data found for contact page')
          setError('CMS data not found')
          return
        }

        setCmsData(data)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error('Error fetching CMS data:', errorMsg)
        setError(errorMsg)
      } finally {
        setCmsLoading(false)
      }
    }
    fetchCMSData()
  }, [])
  const onSubmit = async (data: ContactForm) => {
    setLoading(true)
    try {
      // Send to the main app's contact form API endpoint
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message')
      }

      toast.success("Message sent successfully! We'll get back to you soon.")
      reset()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send message'
      console.error('Contact form error:', error)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (cmsLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )

  if (error || !cmsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading Contact page content: {error}</p>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const contactInfo = cmsData.contact_info_items || []
  const faqItems = cmsData.faq_items || []
  return (
    <>
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
      <div>
        <div className="min-h-screen bg-gray-50">
          {/* Hero Section */}
          <section
            className="relative bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 overflow-hidden hero-section min-h-[400px]"
            style={getBackgroundStyle(
              cmsData.hero_bg_type,
              cmsData.hero_bg_color,
              cmsData.hero_bg_image_url,
            )}
          >
            {/* Sunrise Effect Background */}
            <div className="sunrise-bg"></div>
            <div className="sunrise-horizon-glow"></div>
            <div className="sunrise-sun"></div>
            <div className="sunrise-rays">
              <div className="sunrise-ray"></div>
              <div className="sunrise-ray"></div>
              <div className="sunrise-ray"></div>
              <div className="sunrise-ray"></div>
              <div className="sunrise-ray"></div>
              <div className="sunrise-ray"></div>
              <div className="sunrise-ray"></div>
              <div className="sunrise-ray"></div>
              <div className="sunrise-ray"></div>
              <div className="sunrise-ray"></div>
              <div className="sunrise-ray"></div>
              <div className="sunrise-ray"></div>
            </div>
            <div className="sunrise-cloud sunrise-cloud-1"></div>
            <div className="sunrise-cloud sunrise-cloud-2"></div>
            <div className="sunrise-cloud sunrise-cloud-3"></div>

            {/* Glossy Glass Background Layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/20 to-white/30 backdrop-blur-md z-[3]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-orange-100/50 via-orange-50/30 to-red-100/40 backdrop-blur-sm z-[3]"></div>

            <div className="relative container-max section-padding z-[4] sunrise-content">
              <div className="text-center max-w-4xl mx-auto px-4">
                {cmsData.hero_title && (
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
                    {cmsData.hero_title}{' '}
                    {cmsData.hero_title_highlight && (
                      <span className="gradient-text">{cmsData.hero_title_highlight}</span>
                    )}
                  </h1>
                )}
                {cmsData.hero_description && (
                  <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed mb-6 sm:mb-8">
                    {cmsData.hero_description}
                  </p>
                )}
              </div>
            </div>
          </section>
          {/* Contact Info */}
          {contactInfo.length > 0 && (
            <section
              className="section-padding bg-white"
              style={getBackgroundStyle(
                cmsData.contact_info_bg_type,
                cmsData.contact_info_bg_color,
                cmsData.contact_info_bg_image_url,
              )}
            >
              <div className="container-max px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
                  {contactInfo.map((info, index) => {
                    const IconComponent = getIcon(info.icon)
                    return (
                      <Card key={index} className="text-center card-hover">
                        <CardContent className="pt-6 sm:pt-8 px-4 pb-4">
                          <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <IconComponent className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold mb-2">{info.title}</h3>
                          <p className="text-orange-600 font-medium mb-1 text-sm sm:text-base">
                            {info.details}
                          </p>
                          <p className="text-gray-600 text-xs sm:text-sm">{info.description}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </section>
          )}
          {/* Contact Form & FAQ */}
          <section
            className="section-padding"
            style={getBackgroundStyle(
              cmsData.form_bg_type,
              cmsData.form_bg_color,
              cmsData.form_bg_image_url,
            )}
          >
            <div className="container-max px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                {/* Contact Form */}
                {cmsData.form_visible && (
                  <div>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <ChatBubbleLeftRightIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 flex-shrink-0" />
                          {cmsData.form_title && (
                            <h2 className="text-xl sm:text-2xl font-bold">{cmsData.form_title}</h2>
                          )}
                        </div>
                        {cmsData.form_description && (
                          <p className="text-sm sm:text-base text-gray-600">
                            {cmsData.form_description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <form
                          onSubmit={handleSubmit(onSubmit)}
                          className="flex flex-col gap-4 sm:gap-6 lg:gap-8"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                            <label className="block text-xs sm:text-sm font-medium text-gray-700">
                              Inquiry Type
                            </label>
                            <select
                              {...register('type')}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-xs sm:text-sm px-2 sm:px-3 py-2 h-9 sm:h-10 touch-manipulation"
                              style={{ fontSize: '13px' }}
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
                            <label className="block text-xs sm:text-sm font-medium text-gray-700">
                              Message
                            </label>
                            <textarea
                              {...register('message')}
                              rows={5}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm px-3 sm:px-4 py-2.5 sm:py-3 touch-manipulation"
                              placeholder="Tell us how we can help you..."
                            />
                            {errors.message && (
                              <p className="text-sm text-red-600">{errors.message.message}</p>
                            )}
                          </div>
                          <Button
                            type="submit"
                            className="w-full min-h-[44px] sm:min-h-[48px] text-sm touch-manipulation"
                            loading={loading}
                          >
                            Send Message
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {/* FAQ */}
                {cmsData.faq_visible && (
                  <div>
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                      <QuestionMarkCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 flex-shrink-0" />
                      {cmsData.faq_title && (
                        <h2 className="text-xl sm:text-2xl font-bold">{cmsData.faq_title}</h2>
                      )}
                    </div>
                    <div className="flex flex-col gap-4 sm:gap-6">
                      {faqItems.map((item, index) => (
                        <Card key={index} className="card-hover">
                          <CardContent className="p-4 sm:p-5 lg:p-6">
                            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                              {item.question}
                            </h3>
                            <p className="text-gray-600 text-xs sm:text-sm">{item.answer}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {cmsData.help_card_visible && (
                      <div className="mt-6 sm:mt-8 p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                        {cmsData.help_card_title && (
                          <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                            {cmsData.help_card_title}
                          </h3>
                        )}
                        {cmsData.help_card_description && (
                          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                            {cmsData.help_card_description}
                          </p>
                        )}
                        {cmsData.help_card_button_text && (
                          <Button variant="outline" size="sm">
                            {cmsData.help_card_button_text}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
          {/* CTA Section */}
          {cmsData.cta_visible && (
            <section
              className="section-padding gradient-bg text-white"
              style={getBackgroundStyle(
                cmsData.cta_bg_type,
                cmsData.cta_bg_color,
                cmsData.cta_bg_image_url,
              )}
            >
              <div className="container-max text-center">
                {cmsData.cta_title && (
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">{cmsData.cta_title}</h2>
                )}
                {cmsData.cta_description && (
                  <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                    {cmsData.cta_description}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {cmsData.cta_button_1_text &&
                    (cmsData.cta_button_1_link ? (
                      <Link to={cmsData.cta_button_1_link}>
                        <Button
                          variant="secondary"
                          size="lg"
                          className="bg-white text-orange-600 hover:bg-gray-100"
                        >
                          {cmsData.cta_button_1_text}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="secondary"
                        size="lg"
                        className="bg-white text-orange-600 hover:bg-gray-100"
                      >
                        {cmsData.cta_button_1_text}
                      </Button>
                    ))}
                  {cmsData.cta_button_2_text &&
                    (cmsData.cta_button_2_link ? (
                      <Link to={cmsData.cta_button_2_link}>
                        <Button
                          variant="outline"
                          size="lg"
                          className="border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-orange-600"
                        >
                          {cmsData.cta_button_2_text}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-orange-600"
                      >
                        {cmsData.cta_button_2_text}
                      </Button>
                    ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
