import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ScrollLink from '../components/ui/ScrollLink'
import SEOHead from '../components/seo/SEOHead'
import { generateBreadcrumbSchema } from '../components/seo/StructuredData'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Gurukul } from '../types'
import { getGurukuls } from '../lib/api/gurukuls'
import { getCourses } from '../lib/api/courses'
import { getPageSettings, PageSettings } from '../lib/api/pageSettings'
import { DEFAULT_IMAGES } from '../lib/constants/images'
import { sanitizeHtml } from '../utils/sanitize'
import {
  BookOpenIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
export default function GurukulPage() {
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [courseCounts, setCourseCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [pageSettings, setPageSettings] = useState<PageSettings | null>(null)
  useEffect(() => {
    loadData()
  }, [])
  const loadData = async () => {
    try {
      const [gurukulData, coursesData, cmsData] = await Promise.all([
        getGurukuls(),
        getCourses(),
        getPageSettings('gurukuls'),
      ])
      setGurukuls(gurukulData)
      // Count courses per gurukul
      const counts: Record<string, number> = {}
      coursesData.forEach((course) => {
        counts[course.gurukul_id] = (counts[course.gurukul_id] || 0) + 1
      })
      setCourseCounts(counts)
      setPageSettings(cmsData)
    } catch {
      // Error loading data - silent fail
    } finally {
      setLoading(false)
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Gurukuls...</p>
        </div>
      </div>
    )
  }
  return (
    <>
      <SEOHead
        title="Hindu Gurukuls - Traditional Vedic Learning Centers"
        description="Explore our 5 specialized Hindu Gurukuls offering authentic Vedic education: Hinduism, Mantra, Philosophy, Sanskrit, and Yoga & Wellness. Traditional Gurukul system meets modern online learning."
        keywords={[
          'Hindu Gurukul Online',
          'Vedic Learning Centers',
          'Traditional Hindu Education',
          'Sanatan Dharma Gurukuls',
          'Hindu Philosophy Gurukul',
          'Sanskrit Gurukul Online',
          'Mantra Gurukul',
          'Yoga Gurukul',
          'Hindu Culture Gurukul',
          'Vedic Education Centers',
          'Authentic Hindu Gurukul',
          'Indian Gurukul System',
          'Hindu Heritage Centers',
          'Vedic Wisdom Gurukuls',
          'Hindu Spiritual Centers',
          'Traditional Hindu Schools',
        ]}
        canonicalUrl="/gurukuls"
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Hindu Gurukuls', url: '/gurukuls' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Hindu Gurukuls - Traditional Vedic Learning Centers',
            description:
              'Collection of specialized Hindu Gurukuls offering authentic Vedic education in Hinduism, Sanskrit, Philosophy, Mantras, and Yoga.',
            url: 'https://eyogi-gurukul.vercel.app/gurukuls',
            mainEntity: {
              '@type': 'ItemList',
              name: 'Hindu Gurukuls',
              numberOfItems: 5,
              itemListElement: [
                { '@type': 'EducationalOrganization', name: 'Hinduism Gurukul' },
                { '@type': 'EducationalOrganization', name: 'Mantra Gurukul' },
                { '@type': 'EducationalOrganization', name: 'Philosophy Gurukul' },
                { '@type': 'EducationalOrganization', name: 'Sanskrit Gurukul' },
                { '@type': 'EducationalOrganization', name: 'Yoga & Wellness Gurukul' },
              ],
            },
          },
        ]}
      />
      <div>
        <div className="min-h-screen bg-gray-50">
          {/* Hero Section (with Quick Navigation) */}
          <section
            className="bg-gradient-to-r from-orange-50 to-red-50"
            style={{ backgroundColor: pageSettings?.hero_background_color || undefined }}
          >
            <div className="container-max section-padding">
              <div
                className="text-center max-w-4xl mx-auto"
                style={{ color: pageSettings?.hero_text_color || undefined }}
              >
                <h1
                  className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
                  style={{ color: pageSettings?.hero_text_color || undefined }}
                >
                  {pageSettings?.hero_title || 'Explore Our'}{' '}
                  <span className="gradient-text">Gurukuls</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed mb-8">
                  {pageSettings?.hero_description ||
                    'Each Gurukul specializes in different aspects of Vedic knowledge, offering comprehensive learning paths designed for students of all ages. Discover ancient wisdom through modern, interactive education.'}
                </p>
                <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <BookOpenIcon className="h-5 w-5 text-orange-500" />
                    <span>5 Specialized Gurukuls</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AcademicCapIcon className="h-5 w-5 text-orange-500" />
                    <span>63+ Courses</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-5 w-5 text-orange-500" />
                    <span>1,950+ Students</span>
                  </div>
                </div>
                {/* Quick Navigation (inside hero) */}
                <div className="mt-8">
                  <p className="text-sm text-gray-700 mb-3"></p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {gurukuls.map((gurukul) => (
                      <ScrollLink key={gurukul.id} to={`/gurukuls/${gurukul.slug}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          aria-label={`Explore ${gurukul.name} Gurukul`}
                          className="shadow-sm"
                        >
                          {gurukul.name}
                        </Button>
                      </ScrollLink>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Gurukuls Grid */}
          <section className="section-padding">
            <div className="container-max">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {gurukuls.map((gurukul) => (
                  <Card key={gurukul.id} className="card-hover overflow-hidden">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={
                          gurukul.cover_image_url ||
                          gurukul.image_url ||
                          DEFAULT_IMAGES.GURUKUL_COVER
                        }
                        alt={gurukul.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{gurukul.name}</h3>
                      <div
                        className="text-gray-600 mb-4 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(gurukul.description) }}
                      />
                      <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <BookOpenIcon className="h-4 w-4" />
                          <span>{courseCounts[gurukul.id] || 0} Courses</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <UserGroupIcon className="h-4 w-4" />
                          <span>Active Learning</span>
                        </div>
                      </div>
                      <ScrollLink to={`/gurukuls/${gurukul.slug}`}>
                        <Button className="w-full">
                          Explore Gurukul
                          <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </Button>
                      </ScrollLink>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
          {/* Features Section */}
          {pageSettings?.features_visible !== false && (
            <section className="section-padding bg-white">
              <div className="container-max">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {pageSettings?.features_title || 'Why Choose Our Gurukuls?'}
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    {pageSettings?.features_subtitle ||
                      'Our specialized approach ensures deep, authentic learning in each domain of Vedic knowledge.'}
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {pageSettings?.features_items && pageSettings.features_items.length > 0 ? (
                    pageSettings.features_items.map((feature, idx) => (
                      <div key={idx} className="text-center">
                        <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BookOpenIcon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="text-center">
                        <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BookOpenIcon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Specialized Curriculum</h3>
                        <p className="text-gray-600">
                          Each Gurukul offers focused, in-depth study of specific aspects of Vedic
                          knowledge.
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <UserGroupIcon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Expert Teachers</h3>
                        <p className="text-gray-600">
                          Learn from qualified instructors with deep knowledge and authentic
                          understanding.
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AcademicCapIcon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Certified Learning</h3>
                        <p className="text-gray-600">
                          Earn certificates upon completion and showcase your achievements in Vedic
                          studies.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}
          {/* CTA Section */}
          {pageSettings?.cta_visible !== false && (
            <section
              className="section-padding gradient-bg text-white"
              style={{ backgroundColor: pageSettings?.cta_background_color || undefined }}
            >
              <div className="container-max text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {pageSettings?.cta_title || 'Ready to Begin Your Journey?'}
                </h2>
                <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                  {pageSettings?.cta_description ||
                    'Choose your path of learning and connect with the timeless wisdom of Vedic traditions.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {pageSettings?.cta_buttons && pageSettings.cta_buttons.length > 0 ? (
                    pageSettings.cta_buttons.map((btn, idx) => (
                      <Link key={idx} to={btn.link}>
                        <Button variant={btn.variant as any} size="lg">
                          {btn.text}
                        </Button>
                      </Link>
                    ))
                  ) : (
                    <>
                      <Link to="/courses">
                        <Button
                          variant="secondary"
                          size="lg"
                          className="bg-white text-orange-600 hover:bg-gray-100"
                        >
                          Browse All Courses
                        </Button>
                      </Link>
                      <Link to="/auth/signup">
                        <Button
                          variant="outline"
                          size="lg"
                          className="border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-orange-600"
                        >
                          Create Account
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
