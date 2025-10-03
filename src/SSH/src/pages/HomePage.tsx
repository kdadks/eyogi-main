import React, { useState, useEffect } from 'react'
import ScrollLink from '../components/ui/ScrollLink'
import SEOHead from '../components/seo/SEOHead'
import { generateOrganizationSchema, generateWebsiteSchema } from '../components/seo/StructuredData'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import RollingText from '../components/ui/RollingText'
import {
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  StarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import Footer from '../components/layout/Footer'
import { getGurukulsWithStats } from '../lib/api/gurukuls'
import { Gurukul } from '../types'
export default function HomePage() {
  const [gurukuls, setGurukuls] = useState<
    Array<Gurukul & { courses: number; students: number; image: string }>
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGurukuls = async () => {
      try {
        const data = await getGurukulsWithStats()
        setGurukuls(data)
      } catch (error) {
        console.error('Error fetching gurukuls:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGurukuls()
  }, [])

  const structuredData = [
    generateOrganizationSchema(),
    generateWebsiteSchema(),
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Hindu Education & Vedic Learning Platform - eYogi Gurukul',
      description:
        'Discover authentic Hindu traditions, Vedic philosophy, Sanskrit, mantras, and yoga through expert-led online courses. Join our global community of Sanatan Dharma learners.',
      url: 'https://eyogi-gurukul.vercel.app',
      mainEntity: {
        '@type': 'EducationalOrganization',
        name: 'eYogi Gurukul',
      },
      about: [
        { '@type': 'Thing', name: 'Hindu Religion' },
        { '@type': 'Thing', name: 'Hinduism' },
        { '@type': 'Thing', name: 'Vedic Philosophy' },
        { '@type': 'Thing', name: 'Sanatan Dharma' },
        { '@type': 'Thing', name: 'Hindu Culture' },
        { '@type': 'Thing', name: 'Indian Hindu Culture' },
      ],
    },
  ]
  const features = [
    {
      icon: AcademicCapIcon,
      title: 'Expert Teachers',
      description: 'Learn from qualified instructors with deep knowledge of Vedic traditions',
    },
    {
      icon: BookOpenIcon,
      title: 'Comprehensive Curriculum',
      description:
        'Structured courses covering all aspects of ancient wisdom and modern applications',
    },
    {
      icon: UserGroupIcon,
      title: 'Community Learning',
      description: 'Join a global community of learners on the path of spiritual growth',
    },
    {
      icon: StarIcon,
      title: 'Certified Programs',
      description: 'Earn certificates upon completion of courses and showcase your achievements',
    },
  ]
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Student, Philosophy Gurukul',
      content:
        "The depth of knowledge and the way it's presented makes ancient wisdom accessible to modern minds.",
      rating: 5,
    },
    {
      name: 'Raj Patel',
      role: 'Parent',
      content:
        'My daughter has learned so much about our culture and traditions. The teachers are excellent.',
      rating: 5,
    },
    {
      name: 'Maria Garcia',
      role: 'Student, Yoga Gurukul',
      content:
        'The holistic approach to wellness has transformed my daily practice and understanding.',
      rating: 5,
    },
  ]
  return (
    <>
      <SEOHead
        title="Hindu Education & Vedic Learning Platform"
        description="Learn authentic Hindu traditions, Vedic philosophy, Sanskrit, mantras, and yoga through comprehensive online courses. Discover Sanatan Dharma wisdom with expert teachers in our traditional Gurukul system."
        keywords={[
          'Hindu Education Online',
          'Vedic Learning Platform',
          'Sanatan Dharma Courses',
          'Hindu Philosophy Online',
          'Sanskrit Learning Online',
          'Hindu Culture Education',
          'Indian Hindu Traditions',
          'Vedic Wisdom Courses',
          'Hindu Gurukul Online',
          'Traditional Hindu Education',
          'Authentic Hindu Teaching',
          'Hindu Heritage Learning',
          'Vedic Studies Online',
          'Hindu Spiritual Education',
          'Dharma Education Platform',
          'Hindu Values Learning',
          'Vedic Knowledge Online',
          'Hindu Religion Courses',
        ]}
        canonicalUrl="/"
        structuredData={structuredData}
      />
      <div>
        {/* Rolling Text Banner */}
        <RollingText text="🕉️ Spirituality and Science of Hinduism University - Discover Ancient Wisdom Through Modern Learning 🕉️" />
        {/* Hero Section */}
        <section
          id="hero"
          className="relative bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 overflow-hidden hero-section"
        >
          {/* Enhanced Glossy Glass Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/20 to-white/30 backdrop-blur-md"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-orange-100/50 via-orange-50/30 to-red-100/40 backdrop-blur-sm"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-200/30 via-orange-100/20 to-transparent"></div>
          {/* Glossy Shine Effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
          <div className="absolute inset-0 backdrop-blur-[2px] bg-white/15"></div>
          {/* Additional Gloss Layer */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
          <div className="relative container-max section-padding">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
                <div className="space-y-4 px-4 sm:px-0">
                  <div className="flex justify-center lg:justify-start badge-container">
                    <Badge
                      variant="info"
                      className="text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 hero-badge"
                    >
                      🕉️ Authentic Hindu Education & Vedic Learning
                    </Badge>
                  </div>
                  <h1
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight px-2 sm:px-0"
                    itemProp="headline"
                  >
                    Learn Authentic <span className="gradient-text">Hindu Heritage</span> & Vedic
                    Wisdom
                  </h1>
                  <p
                    className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed px-2 sm:px-0"
                    itemProp="description"
                  >
                    Discover authentic Hindu religion, Vedic philosophy, Sanskrit, mantras, and yoga
                    through our comprehensive Sanatan Dharma education platform. Learn traditional
                    Hindu culture from expert teachers in our modern Gurukul system designed for all
                    ages.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:gap-4 px-4 sm:px-0 sm:flex-row justify-center lg:justify-start">
                  <ScrollLink to="/courses" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto min-h-[50px] text-base font-semibold px-6 py-3"
                    >
                      Explore Courses
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </Button>
                  </ScrollLink>
                  <ScrollLink to="/gurukuls" className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto min-h-[50px] text-base font-semibold px-6 py-3"
                    >
                      Browse Gurukuls
                    </Button>
                  </ScrollLink>
                </div>
                <div className="flex flex-col gap-3 sm:gap-2 sm:flex-row sm:items-center sm:space-x-6 lg:space-x-8 text-sm text-gray-600 justify-center lg:justify-start px-2 sm:px-0">
                  <div className="flex items-center space-x-2 justify-center lg:justify-start">
                    <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-sm font-medium">
                      {loading
                        ? '...'
                        : `${gurukuls.reduce((total, g) => total + g.students, 0)}+ Students`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 justify-center lg:justify-start">
                    <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-sm font-medium">
                      {loading
                        ? '...'
                        : `${gurukuls.reduce((total, g) => total + g.courses, 0)}+ Courses`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 justify-center lg:justify-start">
                    <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-sm font-medium">
                      {loading ? '...' : `${gurukuls.length} Gurukuls`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative order-first lg:order-last overflow-visible">
                <div className="aspect-square max-w-sm mx-auto lg:max-w-none rounded-2xl overflow-hidden shadow-2xl bg-white/30 backdrop-blur-lg border border-white/40 p-4 relative">
                  {/* Glossy Shine Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl"></div>
                  <img
                    src="/ssh-app/Images/Logo.png"
                    alt="eYogi Gurukul logo"
                    className="w-full h-full object-contain logo-pop relative z-10"
                  />
                </div>
                <div className="absolute -bottom-4 left-2 sm:-left-4 lg:-bottom-6 lg:-left-6 bg-white/90 backdrop-blur-md rounded-lg shadow-xl p-3 lg:p-4 border border-white/30 hero-certificate-card">
                  {/* Card Gloss Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-lg"></div>
                  <div className="relative z-10 flex items-center space-x-2 lg:space-x-3">
                    <div className="h-10 w-10 lg:h-12 lg:w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                      <AcademicCapIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm lg:text-base">
                        Certified Hindu Education
                      </p>
                      <p className="text-xs lg:text-sm text-gray-600">Authentic Vedic Learning</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section id="courses" className="section-padding bg-white">
          <div className="container-max">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Why Choose eYogi Gurukul for Hindu Education?
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                We bridge the gap between ancient Hindu wisdom and modern learning technology,
                making authentic Vedic knowledge and Sanatan Dharma accessible to everyone,
                everywhere.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="card-hover text-center glass-card">
                  <CardContent className="pt-6 lg:pt-8 px-4 lg:px-6">
                    <div className="h-12 w-12 lg:h-16 lg:w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm lg:text-base">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        {/* Gurukuls Section */}
        <section id="gurukuls" className="section-padding bg-gray-50">
          <div className="container-max">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Explore Our Traditional Hindu Gurukuls
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Each Hindu Gurukul specializes in different aspects of Vedic knowledge and Sanatan
                Dharma, offering comprehensive Hindu education paths for students of all ages.
              </p>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {[...Array(5)].map((_, index) => (
                  <Card
                    key={index}
                    className="card-hover overflow-hidden animate-pulse flex flex-col min-h-[400px]"
                  >
                    <div className="aspect-video overflow-hidden bg-gray-200"></div>
                    <CardContent className="p-4 lg:p-6 flex flex-col flex-grow">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4 flex-grow"></div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {gurukuls.map((gurukul) => (
                  <Card
                    key={gurukul.id}
                    className="card-hover overflow-hidden flex flex-col min-h-[400px]"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={gurukul.image}
                        alt={`${gurukul.name} - Traditional Hindu education and Vedic learning center`}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-4 lg:p-6 flex flex-col flex-grow">
                      <h3 className="text-lg lg:text-xl font-semibold mb-2">{gurukul.name}</h3>
                      <div
                        className="text-gray-600 mb-4 text-sm lg:text-base flex-grow"
                        dangerouslySetInnerHTML={{ __html: gurukul.description }}
                      />
                      <div className="flex justify-between items-center mb-4 text-xs lg:text-sm text-gray-500">
                        <span>{gurukul.courses} Hindu Courses</span>
                        <span>{gurukul.students} Vedic Students</span>
                      </div>
                      <ScrollLink to={`/gurukuls/${gurukul.slug}`}>
                        <Button variant="primary" className="w-full min-h-[44px]">
                          Explore Hindu Gurukul
                        </Button>
                      </ScrollLink>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
        {/* Testimonials Section */}
        <section id="about" className="section-padding bg-white">
          <div className="container-max">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What Our Hindu Education Students Say
              </h2>
              <p className="text-xl text-gray-600">
                Hear from our global community of Hindu and Vedic learning students
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <div
                      className="text-gray-600 mb-4 italic"
                      dangerouslySetInnerHTML={{ __html: `"${testimonial.content}"` }}
                    />
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">Hindu Education {testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section id="contact" className="section-padding gradient-bg text-white">
          <div className="container-max text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-4">
              Begin Your Hindu Education Journey Today
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 lg:mb-8 opacity-90 max-w-2xl mx-auto px-4 leading-relaxed">
              Join thousands of students worldwide in discovering the timeless wisdom of Hindu
              traditions and Vedic philosophy through our comprehensive Sanatan Dharma courses.
            </p>
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row justify-center max-w-sm sm:max-w-none mx-auto px-4">
              <ScrollLink to="/auth/signup" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-gray-100 w-full sm:w-auto min-h-[50px] font-semibold text-base px-6 py-3"
                >
                  Start Hindu Learning Free
                </Button>
              </ScrollLink>
              <ScrollLink to="/courses" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-orange-600 w-full sm:w-auto min-h-[50px] font-semibold text-base px-6 py-3"
                >
                  Browse Hindu Courses
                </Button>
              </ScrollLink>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
