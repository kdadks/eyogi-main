import React, { useState, useEffect } from 'react'
import SEOHead from '../components/seo/SEOHead'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import ScrollLink from '../components/ui/ScrollLink'
import { ArrowRightIcon, BookOpenIcon, LightBulbIcon, SparklesIcon, HeartIcon } from '@heroicons/react/24/outline'
import { getPageBySlug } from '../lib/api/pages'
import { sanitizeHtml } from '../utils/sanitize'

interface PageContent {
  title?: string
  hero_title?: string
  hero_subtitle?: string
  hero_description?: string
  hero_image?: string
  hero_badge?: string
  content?: string
}

export default function HinduismPage() {
  const [pageContent, setPageContent] = useState<PageContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const page = await getPageBySlug('hinduism')
        if (page) {
          setPageContent(page as any)
          document.title = `${page.title || 'Hinduism'} | eYogi Gurukul`
        }
      } catch (error) {
        console.error('Error loading hinduism page:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [])

  const principles = [
    {
      title: 'Dharma',
      description: 'Righteousness and duty - the moral law governing all life',
      icon: BookOpenIcon,
    },
    {
      title: 'Artha',
      description: 'Prosperity and security - the pursuit of livelihood and wealth',
      icon: LightBulbIcon,
    },
    {
      title: 'Kama',
      description: 'Love and fulfillment - the pursuit of pleasure and relationships',
      icon: HeartIcon,
    },
    {
      title: 'Moksha',
      description: 'Liberation - the ultimate spiritual goal and freedom',
      icon: SparklesIcon,
    },
  ]

  return (
    <>
      <SEOHead
        title="Hinduism - Ancient Wisdom - eYogi Gurukul"
        description="Explore the profound teachings of Hinduism, including dharma, yoga, and the path to spiritual enlightenment."
        keywords={[
          'Hinduism',
          'Ancient Wisdom',
          'Yoga',
          'Dharma',
          'Vedic Knowledge',
          'Spirituality',
          'Meditation',
        ]}
        canonicalUrl="/hinduism"
      />
      <div>
        {/* Hero Section */}
        <section
          className="relative overflow-hidden hero-section min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] flex items-center justify-center"
          style={{
            backgroundImage: pageContent?.hero_image
              ? `url(${pageContent.hero_image})`
              : 'linear-gradient(135deg, rgb(249, 115, 22), rgb(220, 38, 38))',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-transparent z-[2]"></div>

          {/* Content */}
          <div className="relative z-[3] container-max px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <Badge variant="info" className="text-xs sm:text-sm px-4 py-2 inline-block">
                {pageContent?.hero_badge || 'Ancient Wisdom'}
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                {pageContent?.hero_title || 'Explore Hinduism'}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed">
                {pageContent?.hero_description || 'Discover the profound wisdom and spiritual teachings of Hinduism that have guided humanity for millennia.'}
              </p>
              <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row justify-center pt-4">
                <ScrollLink to="#principles" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto min-h-[50px] text-base font-semibold px-6 py-3">
                    Learn More
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Button>
                </ScrollLink>
              </div>
            </div>
          </div>
        </section>

        {/* Core Principles Section */}
        <section id="principles" className="section-padding bg-white">
          <div className="container-max">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Four Pillars of Life
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                The fundamental principles that guide all aspects of Hindu philosophy and living
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {principles.map((principle, index) => (
                <Card key={index} className="card-hover text-center glass-card">
                  <CardContent className="pt-6 lg:pt-8 px-4 lg:px-6">
                    <div className="h-12 w-12 lg:h-16 lg:w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <principle.icon className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-semibold mb-2">{principle.title}</h3>
                    <p className="text-gray-600 text-sm lg:text-base">{principle.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Content Section */}
        {pageContent?.content && (
          <section className="section-padding bg-gray-50">
            <div className="container-max max-w-3xl mx-auto">
              <Card className="shadow-xl">
                <CardContent className="p-8 prose prose-lg max-w-none">
                  <div
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(pageContent.content),
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="section-padding gradient-bg text-white">
          <div className="container-max text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-4">
              Deepen Your Understanding
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-8 opacity-90 max-w-2xl mx-auto px-4">
              Join our courses to explore the rich spiritual heritage of Hinduism.
            </p>
            <ScrollLink to="/courses" className="inline-block">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 min-h-[50px] font-semibold text-base px-6 py-3"
              >
                Explore Courses
              </Button>
            </ScrollLink>
          </div>
        </section>
      </div>
    </>
  )
}
