import React, { useState, useEffect } from 'react'
import SEOHead from '../components/seo/SEOHead'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import ScrollLink from '../components/ui/ScrollLink'
import {
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  BookOpenIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import { getPageBySlug } from '../lib/api/pages'

interface PageContent {
  title?: string
  hero_title?: string
  hero_subtitle?: string
  hero_description?: string
  hero_image?: string
  hero_badge?: string
  benefits?: Array<{
    title: string
    description: string
    icon?: string
  }>
}

export default function MembershipPage() {
  const [pageContent, setPageContent] = useState<PageContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const page = await getPageBySlug('membership')
        if (page) {
          setPageContent(page as any)
          document.title = `${page.title || 'Membership'} | eYogi Gurukul`
        }
      } catch (error) {
        console.error('Error loading membership page:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [])

  const membershipBenefits = [
    {
      title: 'Premium Course Access',
      description: 'Access to all premium courses and exclusive content',
      icon: BookOpenIcon,
    },
    {
      title: 'Expert Guidance',
      description: 'One-on-one mentoring from experienced teachers',
      icon: UserGroupIcon,
    },
    {
      title: 'Certification',
      description: 'Earn recognized certificates upon course completion',
      icon: AcademicCapIcon,
    },
    {
      title: 'Community Support',
      description: 'Join our exclusive community of learners',
      icon: SparklesIcon,
    },
  ]

  return (
    <>
      <SEOHead
        title="Membership - eYogi Gurukul"
        description="Join our membership program and unlock premium courses, expert guidance, and exclusive benefits."
        canonicalUrl="/membership"
      />
      <div>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 overflow-hidden hero-section min-h-[600px] lg:min-h-[700px]">
          {/* Sunrise Effect Background */}
          <div className="sunrise-bg"></div>
          <div className="sunrise-horizon-glow"></div>
          <div className="sunrise-sun"></div>
          <div className="sunrise-rays">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="sunrise-ray"></div>
            ))}
          </div>
          <div className="sunrise-cloud sunrise-cloud-1"></div>
          <div className="sunrise-cloud sunrise-cloud-2"></div>
          <div className="sunrise-cloud sunrise-cloud-3"></div>

          {/* Glossy Glass Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/20 to-white/30 backdrop-blur-md z-[3]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-orange-100/50 via-orange-50/30 to-red-100/40 backdrop-blur-sm z-[3]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-200/30 via-orange-100/20 to-transparent z-[3]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 via-transparent to-transparent z-[3]"></div>
          <div className="absolute inset-0 backdrop-blur-[2px] bg-white/15 z-[3]"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 z-[3]"></div>

          <div className="relative container-max section-padding z-[4] sunrise-content px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="space-y-6">
                <Badge variant="info" className="text-xs sm:text-sm px-4 py-2">
                  {pageContent?.hero_badge || 'Premium Membership'}
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  {pageContent?.hero_title || 'Unlock Premium Learning'}
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
                  {pageContent?.hero_description || 'Join our membership program and gain access to exclusive courses, expert guidance, and a thriving community of learners.'}
                </p>
                <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row justify-center">
                  <ScrollLink to="#benefits" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto min-h-[50px] text-base font-semibold px-6 py-3">
                      Explore Benefits
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </Button>
                  </ScrollLink>
                  <ScrollLink to="#pricing" className="w-full sm:w-auto">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto min-h-[50px] text-base font-semibold px-6 py-3">
                      View Plans
                    </Button>
                  </ScrollLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Membership Benefits Section */}
        <section id="benefits" className="section-padding bg-white">
          <div className="container-max">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Membership Benefits
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Get access to everything you need for your learning journey
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {membershipBenefits.map((benefit, index) => (
                <Card key={index} className="card-hover text-center glass-card">
                  <CardContent className="pt-6 lg:pt-8 px-4 lg:px-6">
                    <div className="h-12 w-12 lg:h-16 lg:w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm lg:text-base">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="section-padding bg-gray-50">
          <div className="container-max">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Membership Plans
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Choose the plan that best fits your learning goals
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: 'Monthly',
                  price: '$29',
                  period: '/month',
                  features: ['Full course access', '1:1 mentoring', 'Monthly webinars', 'Certificate on completion'],
                },
                {
                  name: 'Annual',
                  price: '$299',
                  period: '/year',
                  features: ['Full course access', '1:1 mentoring', 'Monthly webinars', 'Priority support', 'Certificate on completion'],
                  highlighted: true,
                },
                {
                  name: 'Lifetime',
                  price: '$999',
                  period: 'one-time',
                  features: ['Lifetime course access', 'Unlimited mentoring', 'Priority support', 'All future courses included', 'Certificate on completion'],
                },
              ].map((plan, index) => (
                <Card
                  key={index}
                  className={`overflow-hidden ${plan.highlighted ? 'ring-2 ring-orange-500 shadow-lg' : ''}`}
                >
                  <CardContent className="p-6 lg:p-8">
                    {plan.highlighted && (
                      <div className="mb-4 text-center">
                        <Badge variant="info" className="text-xs">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-2 text-center">{plan.name}</h3>
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold text-orange-600">{plan.price}</span>
                      <span className="text-gray-600 ml-2">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.highlighted ? 'default' : 'primary'}
                      className="w-full"
                      size="lg"
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding gradient-bg text-white">
          <div className="container-max text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-4">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-8 opacity-90 max-w-2xl mx-auto px-4">
              Join thousands of learners who are transforming their lives through our membership program.
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100 min-h-[50px] font-semibold text-base px-6 py-3"
            >
              Start Your Membership
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}
