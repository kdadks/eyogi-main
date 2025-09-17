import React from 'react'
import { Link } from 'react-router-dom'
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

export default function HomePage() {
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

  const gurukuls = [
    {
      name: 'Hinduism Gurukul',
      description: 'Explore Hindu traditions, philosophy, and practices',
      image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=300&fit=crop',
      courses: 12,
      students: 450,
      slug: 'hinduism',
    },
    {
      name: 'Mantra Gurukul',
      description: 'Learn sacred mantras and their transformative power',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      courses: 8,
      students: 320,
      slug: 'mantra',
    },
    {
      name: 'Philosophy Gurukul',
      description: 'Dive deep into ancient philosophical traditions',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
      courses: 15,
      students: 280,
      slug: 'philosophy',
    },
    {
      name: 'Sanskrit Gurukul',
      description: 'Master the sacred language of Sanskrit',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop',
      courses: 10,
      students: 380,
      slug: 'sanskrit',
    },
    {
      name: 'Yoga & Wellness',
      description: 'Integrate physical, mental, and spiritual wellness',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
      courses: 18,
      students: 520,
      slug: 'yoga-wellness',
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
        {/* Header Navigation */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo */}
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">🕉️</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-gray-900">eYogi Gurukul</span>
                    <span className="text-xs text-gray-500">Hindu Education Platform</span>
                  </div>
                </Link>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/gurukuls"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Gurukuls
                </Link>
                <Link
                  to="/courses"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Courses
                </Link>
                <Link
                  to="/about"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Contact
                </Link>
              </nav>

              {/* Auth Buttons */}
              <div className="hidden md:flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
                <Button variant="primary" size="sm">
                  Sign Up
                </Button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button className="text-gray-700 hover:text-orange-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Rolling Text Banner */}
        <RollingText
          text="🕉️ Spirituality and Science of Hinduism University - Discover Ancient Wisdom Through Modern Learning 🕉️"
          className="first-element"
        />

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
                    <span className="text-sm sm:text-sm font-medium">1,950+ Students</span>
                  </div>
                  <div className="flex items-center space-x-2 justify-center lg:justify-start">
                    <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-sm font-medium">63+ Courses</span>
                  </div>
                  <div className="flex items-center space-x-2 justify-center lg:justify-start">
                    <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-sm font-medium">5 Gurukuls</span>
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
                <div className="absolute -bottom-4 left-2 sm:left-0 sm:-left-4 lg:-bottom-6 lg:-left-6 bg-white/90 backdrop-blur-md rounded-lg shadow-xl p-3 lg:p-4 border border-white/30 relative hero-certificate-card">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {gurukuls.map((gurukul, index) => (
                <Card key={index} className="card-hover overflow-hidden">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={gurukul.image}
                      alt={`${gurukul.name} - Traditional Hindu education and Vedic learning center`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-4 lg:p-6">
                    <h3 className="text-lg lg:text-xl font-semibold mb-2">{gurukul.name}</h3>
                    <p className="text-gray-600 mb-4 text-sm lg:text-base">{gurukul.description}</p>

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
                    <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
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
                  className="border-white text-white hover:bg-white hover:text-orange-600 w-full sm:w-auto min-h-[50px] font-semibold text-base px-6 py-3"
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
