import React, { useState, useEffect } from 'react'
import ScrollLink from '../components/ui/ScrollLink'
import SEOHead from '../components/seo/SEOHead'
import { generateOrganizationSchema, generateWebsiteSchema } from '../components/seo/StructuredData'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

import {
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  StarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  LightBulbIcon,
  SparklesIcon,
  GlobeAltIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'

import { getGurukulsWithStats } from '../lib/api/gurukuls'
import { getPageSettings } from '../lib/api/pageSettings'
import { Gurukul } from '../types'
import { sanitizeHtml } from '../utils/sanitize'

// Icon mapping function
const getIconComponent = (iconName?: string) => {
  const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    AcademicCapIcon: AcademicCapIcon,
    BookOpenIcon: BookOpenIcon,
    UserGroupIcon: UserGroupIcon,
    StarIcon: StarIcon,
    LightBulbIcon: LightBulbIcon,
    SparklesIcon: SparklesIcon,
    GlobeAltIcon: GlobeAltIcon,
    HeartIcon: HeartIcon,
  }
  return iconMap[iconName || 'AcademicCapIcon'] || AcademicCapIcon
}

interface PageSettings {
  home_hero_badge_text?: string
  home_hero_title?: string
  home_hero_title_highlight?: string
  home_hero_description?: string
  home_hero_image_url?: string
  home_features_title?: string
  home_features_subtitle?: string
  home_features_box_1_title?: string
  home_features_box_1_description?: string
  home_features_box_2_title?: string
  home_features_box_2_description?: string
  home_features_box_3_title?: string
  home_features_box_3_description?: string
  home_features_box_4_title?: string
  home_features_box_4_description?: string
  home_testimonials?: Array<{
    name: string
    role: string
    content: string
    rating: number
    image?: string
  }>
  home_cta_title?: string
  home_cta_description?: string
  home_cta_button_1_text?: string
  home_cta_button_1_link?: string
  home_cta_button_2_text?: string
  home_cta_button_2_link?: string
}

export default function HomePage() {
  const [gurukuls, setGurukuls] = useState<
    Array<Gurukul & { courses: number; students: number; image: string }>
  >([])
  const [pageSettings, setPageSettings] = useState<PageSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gurukulData, settingsData] = await Promise.all([
          getGurukulsWithStats(),
          getPageSettings('home'),
        ])
        setGurukuls(gurukulData)
        setPageSettings(settingsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const structuredData = [
    generateOrganizationSchema(),
    generateWebsiteSchema(),
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'SSH University - Harmonizing Ancient Wisdom with Modern Education',
      description:
        'SSH University harmonizes ancient wisdom with modern education through integrated academic programs that nurture intellect and inner awareness.',
      url: 'https://ssh-university.vercel.app',
      mainEntity: {
        '@type': 'EducationalOrganization',
        name: 'SSH University',
      },
      about: [
        { '@type': 'Thing', name: 'Ancient Wisdom' },
        { '@type': 'Thing', name: 'Modern Education' },
        { '@type': 'Thing', name: 'Integrated Learning' },
        { '@type': 'Thing', name: 'Conscious Leadership' },
        { '@type': 'Thing', name: 'Ethical Education' },
        { '@type': 'Thing', name: 'Transformative Learning' },
      ],
    },
  ]

  // Dynamic features from database
  const features = [
    {
      icon: getIconComponent(pageSettings?.home_features_box_1_icon as string),
      title: pageSettings?.home_features_box_1_title,
      description: pageSettings?.home_features_box_1_description,
    },
    {
      icon: getIconComponent(pageSettings?.home_features_box_2_icon as string),
      title: pageSettings?.home_features_box_2_title,
      description: pageSettings?.home_features_box_2_description,
    },
    {
      icon: getIconComponent(pageSettings?.home_features_box_3_icon as string),
      title: pageSettings?.home_features_box_3_title,
      description: pageSettings?.home_features_box_3_description,
    },
    {
      icon: getIconComponent(pageSettings?.home_features_box_4_icon as string),
      title: pageSettings?.home_features_box_4_title,
      description: pageSettings?.home_features_box_4_description,
    },
  ]

  // Dynamic testimonials from database
  const testimonials = pageSettings?.home_testimonials || []
  return (
    <>
      <SEOHead
        title="SSH University - Harmonizing Ancient Wisdom with Modern Education"
        description="SSH University harmonizes ancient wisdom with modern education through integrated academic programs. Join our transformative learning community that nurtures intellect, inner awareness, and conscious leadership for a balanced approach to knowledge and life."
        keywords={[
          'SSH University',
          'Ancient Wisdom Modern Education',
          'Integrated Academic Programs',
          'Conscious Leadership Development',
          'Ethical Education University',
          'Transformative Learning Community',
          'Intellect Inner Awareness',
          'Balanced Knowledge Approach',
          'Timeless Wisdom Contemporary',
          'Academic Excellence Ethics',
          'Global Education Mission',
          'Purposeful Innovation Learning',
          'Collective Well-being Education',
          'Seva Satya Samskara University',
          'Spiritual Heritage Modern',
          'Indian Education Innovation',
        ]}
        canonicalUrl="/"
        structuredData={structuredData}
      />
      <div>
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
                      {pageSettings?.home_hero_badge_text}
                    </Badge>
                  </div>
                  <h1
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight px-2 sm:px-0"
                    itemProp="headline"
                  >
                    {pageSettings?.home_hero_title}{' '}
                    <span className="gradient-text">{pageSettings?.home_hero_title_highlight}</span>
                  </h1>
                  <p
                    className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed px-2 sm:px-0"
                    itemProp="description"
                  >
                    {pageSettings?.home_hero_description}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:gap-4 px-4 sm:px-0 sm:flex-row justify-center lg:justify-start">
                  {pageSettings?.home_hero_button_1_text && (
                    <ScrollLink
                      to={pageSettings?.home_hero_button_1_link}
                      className="w-full sm:w-auto"
                    >
                      <Button
                        size="lg"
                        className="w-full sm:w-auto min-h-[50px] text-base font-semibold px-6 py-3"
                      >
                        {pageSettings?.home_hero_button_1_text}
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </Button>
                    </ScrollLink>
                  )}
                  {pageSettings?.home_hero_button_2_text && (
                    <ScrollLink
                      to={pageSettings?.home_hero_button_2_link}
                      className="w-full sm:w-auto"
                    >
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full sm:w-auto min-h-[50px] text-base font-semibold px-6 py-3"
                      >
                        {pageSettings?.home_hero_button_2_text}
                      </Button>
                    </ScrollLink>
                  )}
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
                {pageSettings?.home_hero_image_url && (
                  <div>
                    <div className="aspect-square max-w-sm mx-auto lg:max-w-none rounded-2xl overflow-hidden shadow-2xl bg-white/30 backdrop-blur-lg border border-white/40 p-4 relative">
                      {/* Glossy Shine Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl"></div>
                      <img
                        src={pageSettings.home_hero_image_url}
                        alt={pageSettings.home_hero_image_caption || 'Hero image'}
                        className="w-full h-full object-contain logo-pop relative z-10"
                      />
                    </div>
                    {pageSettings.home_hero_image_caption && (
                      <div className="absolute -bottom-4 left-2 sm:-left-4 lg:-bottom-6 lg:-left-6 bg-white/90 backdrop-blur-md rounded-lg shadow-xl p-3 lg:p-4 border border-white/30 hero-certificate-card">
                        {/* Card Gloss Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-lg"></div>
                        <div className="relative z-10 flex gap-3 items-start">
                          {pageSettings.home_hero_image_caption_icon && (
                            <div className="flex-shrink-0 h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                              {React.createElement(
                                getIconComponent(pageSettings.home_hero_image_caption_icon),
                                {
                                  className: 'h-5 w-5 lg:h-6 lg:w-6 text-white',
                                },
                              )}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 text-sm lg:text-base">
                              {pageSettings.home_hero_image_caption}
                            </p>
                            {pageSettings.home_hero_image_caption_description && (
                              <p className="text-gray-600 text-xs lg:text-sm mt-1">
                                {pageSettings.home_hero_image_caption_description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section id="courses" className="section-padding bg-white">
          <div className="container-max">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                {pageSettings?.home_features_title}
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                {pageSettings?.home_features_subtitle}
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
              {pageSettings?.home_gurukuls_title && (
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                  {pageSettings.home_gurukuls_title}
                </h2>
              )}
              {pageSettings?.home_gurukuls_subtitle && (
                <p
                  className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(pageSettings.home_gurukuls_subtitle),
                  }}
                />
              )}
            </div>
            {pageSettings?.home_gurukuls_selected_ids &&
              pageSettings.home_gurukuls_selected_ids.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {gurukuls
                    .filter((g) => pageSettings.home_gurukuls_selected_ids?.includes(g.id))
                    .map((gurukul) => (
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
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(gurukul.description) }}
                          />
                          <div className="flex justify-between items-center mb-4 text-xs lg:text-sm text-gray-500">
                            <span>{gurukul.courses} Integrated Programs</span>
                            <span>{gurukul.students} Conscious Learners</span>
                          </div>
                          <ScrollLink to={`/gurukuls/${gurukul.slug}`}>
                            <Button variant="primary" className="w-full min-h-[44px]">
                              Explore Academic Center
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
              {pageSettings?.home_testimonials_title && (
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {pageSettings.home_testimonials_title}
                </h2>
              )}
              {pageSettings?.home_testimonials_subtitle && (
                <p
                  className="text-xl text-gray-600"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(pageSettings.home_testimonials_subtitle),
                  }}
                />
              )}
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
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(`"${testimonial.content}"`) }}
                    />
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
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
              {pageSettings?.home_cta_title}
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 lg:mb-8 opacity-90 max-w-2xl mx-auto px-4 leading-relaxed">
              {pageSettings?.home_cta_description}
            </p>
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row justify-center max-w-sm sm:max-w-none mx-auto px-4">
              <ScrollLink to={pageSettings?.home_cta_button_1_link} className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-gray-100 w-full sm:w-auto min-h-[50px] font-semibold text-base px-6 py-3"
                >
                  {pageSettings?.home_cta_button_1_text}
                </Button>
              </ScrollLink>
              <ScrollLink to={pageSettings?.home_cta_button_2_link} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-orange-600 w-full sm:w-auto min-h-[50px] font-semibold text-base px-6 py-3"
                >
                  {pageSettings?.home_cta_button_2_text}
                </Button>
              </ScrollLink>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
