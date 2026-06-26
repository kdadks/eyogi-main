import React, { useState, useEffect } from 'react'
import SEOHead from '../components/seo/SEOHead'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import ScrollLink from '../components/ui/ScrollLink'
import { ArrowRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { getPageBySlug } from '../lib/api/pages'

interface PageContent {
  title?: string
  hero_title?: string
  hero_subtitle?: string
  hero_description?: string
  hero_badge?: string
  content?: string
}

const defaultFAQs = [
  {
    question: 'What is eYogi Gurukul?',
    answer: 'eYogi Gurukul is an integrated educational platform that harmonizes ancient wisdom with modern education, offering courses in yoga, spirituality, and traditional Hindu knowledge.',
  },
  {
    question: 'How do I enroll in courses?',
    answer: 'You can enroll in courses directly through our website by creating an account and selecting the courses you wish to take. Some courses are free, while others require membership.',
  },
  {
    question: 'What is a Gurukul?',
    answer: 'A Gurukul is an ancient Indian residential educational institution where students learn directly from a master (Guru). We recreate this traditional learning model in a modern online environment.',
  },
  {
    question: 'Are the courses accredited?',
    answer: 'Our courses are designed to provide valuable knowledge and skills. Upon completion, you receive a certificate of completion recognized by our community.',
  },
  {
    question: 'What are the membership benefits?',
    answer: 'Membership provides access to premium courses, one-on-one mentoring, exclusive webinars, priority support, and certificates of completion.',
  },
  {
    question: 'Can I cancel my membership anytime?',
    answer: 'Yes, you can cancel your membership at any time. If you cancel, you will retain access to your courses until the end of the current billing period.',
  },
]

export default function FAQPage() {
  const [pageContent, setPageContent] = useState<PageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const page = await getPageBySlug('faq')
        if (page) {
          setPageContent(page as any)
          document.title = `${page.title || 'FAQ'} | eYogi Gurukul`
        }
      } catch (error) {
        console.error('Error loading FAQ page:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [])

  return (
    <>
      <SEOHead
        title="FAQ - Frequently Asked Questions - eYogi Gurukul"
        description="Find answers to common questions about eYogi Gurukul, courses, membership, and more."
        keywords={['FAQ', 'Questions', 'Help', 'Support', 'eYogi Gurukul']}
        canonicalUrl="/faq"
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
                  {pageContent?.hero_badge || 'Have Questions?'}
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  {pageContent?.hero_title || 'Frequently Asked Questions'}
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
                  {pageContent?.hero_description || 'Find answers to common questions about eYogi Gurukul, our courses, and membership.'}
                </p>
                <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row justify-center">
                  <ScrollLink to="#faqs" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto min-h-[50px] text-base font-semibold px-6 py-3">
                      Browse FAQs
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </Button>
                  </ScrollLink>
                  <ScrollLink to="/contact" className="w-full sm:w-auto">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto min-h-[50px] text-base font-semibold px-6 py-3">
                      Contact Us
                    </Button>
                  </ScrollLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section id="faqs" className="section-padding bg-white">
          <div className="container-max max-w-3xl mx-auto">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Common Questions
              </h2>
              <p className="text-lg sm:text-xl text-gray-600">
                Get answers to questions about our platform and services
              </p>
            </div>
            <div className="space-y-4">
              {defaultFAQs.map((faq, index) => (
                <Card
                  key={index}
                  className="card-hover cursor-pointer overflow-hidden transition-all duration-200"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1 text-left">
                        {faq.question}
                      </h3>
                      <ChevronDownIcon
                        className={`h-6 w-6 text-orange-500 flex-shrink-0 transition-transform duration-200 ${
                          expandedIndex === index ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    {expandedIndex === index && (
                      <p className="mt-4 text-gray-600 leading-relaxed">{faq.answer}</p>
                    )}
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
              Didn't Find Your Answer?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-8 opacity-90 max-w-2xl mx-auto px-4">
              We're here to help! Contact our support team and we'll respond as soon as possible.
            </p>
            <ScrollLink to="/contact" className="inline-block">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 min-h-[50px] font-semibold text-base px-6 py-3"
              >
                Get in Touch
              </Button>
            </ScrollLink>
          </div>
        </section>
      </div>
    </>
  )
}
