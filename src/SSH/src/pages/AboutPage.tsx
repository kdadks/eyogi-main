import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import { generateBreadcrumbSchema } from '../components/seo/StructuredData'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../components/ui/Carousel'
import { getBackgroundStyle } from '../utils/backgroundStyler'
import '../components/styles/quill-preview.css'
import {
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  GlobeAltIcon,
  HeartIcon,
  StarIcon,
  LightBulbIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { AboutPageCMSSettings } from '../lib/api/aboutPageCMS'
import { supabase } from '../lib/supabase'

const iconMap: { [key: string]: React.FC<{ className?: string }> } = {
  StarIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  LightBulbIcon,
  SparklesIcon,
  GlobeAltIcon,
  HeartIcon,
}

function getIcon(iconName: string | undefined) {
  if (!iconName || !iconMap[iconName]) return StarIcon
  return iconMap[iconName]
}

export default function AboutPage() {
  const [cmsData, setCmsData] = useState<AboutPageCMSSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCMSData = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data, error } = await supabase
          .from('about_page_cms')
          .select('*')
          .eq('page_slug', 'about')
          .single()

        if (error) {
          console.error('Error fetching CMS data:', error)
          setError(error.message)
          return
        }

        if (!data) {
          console.warn('No CMS data found for slug: about')
          setError('CMS data not found')
          return
        }

        setCmsData(data as AboutPageCMSSettings)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error('Error fetching CMS data:', errorMsg)
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }
    fetchCMSData()
  }, [])

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )

  if (error || !cmsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading About page content: {error}</p>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const team = (cmsData.team_members || []) as Array<{
    name: string
    role: string
    bio: string
    image_url: string
  }>

  const stats = (cmsData.stats_items || []) as Array<{
    number: string
    label: string
  }>

  const visionItems = (cmsData.vision_items || []) as Array<{
    title: string
    description: string
    icon: string
  }>

  return (
    <>
      <SEOHead
        title="About SSH University - Harmonizing Ancient Wisdom with Modern Education"
        description="Discover SSH University's mission to harmonize ancient wisdom with modern education. Learn about our integrated academic programs, ethical values, and commitment to nurturing conscious leaders who balance intellect with inner awareness."
        keywords={[
          'About SSH University',
          'Ancient Wisdom Modern Education',
          'Integrated Learning Programs',
          'Ethical Education Mission',
          'Conscious Leadership Development',
          'Seva Satya Samskara',
          'Spiritual Heritage Education',
          'Global University Mission',
          'Timeless Wisdom Contemporary',
          'Academic Excellence Ethics',
          'Transformative Education India',
          'Balanced Learning Approach',
          'Inner Awareness Education',
          'Purposeful Innovation Learning',
          'Collective Well-being Education',
        ]}
        canonicalUrl="/about"
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'About SSH University', url: '/about' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About SSH University - Harmonizing Ancient Wisdom with Modern Education',
            description:
              "Learn about SSH University's mission to harmonize ancient wisdom with modern education, creating conscious leaders through integrated learning programs.",
            url: 'https://ssh-university.vercel.app/about',
            mainEntity: {
              '@type': 'EducationalOrganization',
              name: 'SSH University',
              mission:
                'To harmonize ancient wisdom with modern education, nurturing students who balance intellect with inner awareness through integrated academic programs.',
            },
            about: [
              { '@type': 'Thing', name: 'Ancient Wisdom' },
              { '@type': 'Thing', name: 'Modern Education' },
              { '@type': 'Thing', name: 'Integrated Learning' },
              { '@type': 'Thing', name: 'Ethical Education' },
              { '@type': 'Thing', name: 'Conscious Leadership' },
            ],
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

            <div className="relative section-padding z-[4] sunrise-content px-4 md:px-8 lg:px-12">
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                  {cmsData.hero_title}{' '}
                  <span className="gradient-text">{cmsData.hero_title_highlight}</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed mb-8">
                  {cmsData.hero_description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {cmsData.hero_button_1_link && cmsData.hero_button_1_text && (
                    <Link to={cmsData.hero_button_1_link}>
                      <Button size="lg">{cmsData.hero_button_1_text}</Button>
                    </Link>
                  )}
                  {cmsData.hero_button_2_link && cmsData.hero_button_2_text && (
                    <Link to={cmsData.hero_button_2_link}>
                      <Button variant="outline" size="lg">
                        {cmsData.hero_button_2_text}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Mission Section */}
          <section
            className="section-padding bg-white"
            style={getBackgroundStyle(
              cmsData.mission_bg_type,
              cmsData.mission_bg_color,
              cmsData.mission_bg_image_url,
            )}
          >
            <div className="px-4 md:px-8 lg:px-12">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    {cmsData.mission_title}
                  </h2>
                  {cmsData.mission_description && (
                    <div
                      className="text-lg text-gray-600 mb-8 ql-editor ql-blank=false"
                      dangerouslySetInnerHTML={{
                        __html: cmsData.mission_description,
                      }}
                    />
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      {(() => {
                        const IconComponent = getIcon(cmsData.mission_image_caption_icon)
                        return <IconComponent className="h-6 w-6 text-white" />
                      })()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {cmsData.mission_image_caption_title}
                      </h3>
                      <p className="text-gray-600">{cmsData.mission_image_caption_description}</p>
                    </div>
                  </div>
                </div>
                {cmsData.mission_image_url && (
                  <div className="relative">
                    <img
                      src={cmsData.mission_image_url}
                      alt="Mission image"
                      className="rounded-2xl shadow-2xl object-contain bg-white p-6 logo-pop"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Stats Section */}
          {cmsData.stats_visible && (
            <section
              className="section-padding gradient-bg text-white"
              style={getBackgroundStyle(
                cmsData.stats_bg_type,
                cmsData.stats_bg_color,
                cmsData.stats_bg_image_url,
              )}
            >
              <div className="px-4 md:px-8 lg:px-12">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">{cmsData.stats_title}</h2>
                  <p className="text-xl opacity-90">{cmsData.stats_subtitle}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                      <div className="text-lg opacity-90">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Team Section */}
          {cmsData.team_visible && (
            <section
              className="section-padding"
              style={getBackgroundStyle(
                cmsData.team_bg_type,
                cmsData.team_bg_color,
                cmsData.team_bg_image_url,
              )}
            >
              <div className="px-4 md:px-8 lg:px-12">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {cmsData.team_title}
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">{cmsData.team_subtitle}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {team.map((member, index) => (
                    <Card key={index} className="text-center card-hover">
                      <CardContent className="pt-8">
                        {member.image_url && (
                          <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                            <img
                              src={member.image_url}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                        <p className="text-orange-600 font-medium mb-3">{member.role}</p>
                        <p className="text-gray-600 text-sm">{member.bio}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Vision Section */}
          <section
            className="section-padding bg-white"
            style={getBackgroundStyle(
              cmsData.vision_bg_type,
              cmsData.vision_bg_color,
              cmsData.vision_bg_image_url,
            )}
          >
            <div className="px-4 md:px-8 lg:px-12">
              <div className="text-center max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {cmsData.vision_title}
                </h2>
                {cmsData.vision_description && (
                  <div
                    className="text-lg text-gray-600 mb-8"
                    dangerouslySetInnerHTML={{
                      __html: cmsData.vision_description,
                    }}
                  />
                )}

                {visionItems.length <= 4 ? (
                  // Show 4 in one line if 4 or fewer items
                  <div className="grid md:grid-cols-4 gap-8 mt-12">
                    {visionItems.map((item, index) => {
                      const IconComponent = getIcon(item.icon)
                      return (
                        <div key={index} className="text-center">
                          <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-semibold mb-2">{item.title}</h3>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  // Show carousel if more than 4 items
                  <Carousel className="mt-12">
                    <CarouselContent>
                      {visionItems.map((item, index) => {
                        const IconComponent = getIcon(item.icon)
                        return (
                          <CarouselItem key={index} className="md:basis-1/4">
                            <div className="text-center p-4">
                              <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <IconComponent className="h-6 w-6 text-white" />
                              </div>
                              <h3 className="font-semibold mb-2">{item.title}</h3>
                              <p className="text-gray-600 text-sm">{item.description}</p>
                            </div>
                          </CarouselItem>
                        )
                      })}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                )}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          {(cmsData.cta_visible || cmsData.cta_title || cmsData.cta_description) && (
            <section
              className="section-padding gradient-bg text-white"
              style={getBackgroundStyle(
                cmsData.cta_bg_type,
                cmsData.cta_bg_color,
                cmsData.cta_bg_image_url,
              )}
            >
              <div className="px-4 md:px-8 lg:px-12 text-center">
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
                        <Button variant="primary" size="lg">
                          {cmsData.cta_button_2_text}
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="primary" size="lg">
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
