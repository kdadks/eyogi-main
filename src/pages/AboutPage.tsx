import { useState, useEffect } from 'react'
import { Users, Target, Book, Award, Heart, Globe } from 'lucide-react'
import { browserClient } from '@/lib/supabase/browser'

interface AboutSection {
  id: string
  section: string
  title: string | null
  content: string | null
  image_url: string | null
  order_index: number
  metadata: any
}

const SECTION_ICONS: Record<string, any> = {
  mission: Target,
  approach: Book,
  history: Globe,
  values: Heart,
  team: Users,
  achievements: Award,
}

const DEFAULT_SECTIONS = [
  {
    section: 'hero',
    title: 'eYogi Gurukul - Ireland\'s Vedic School',
    content: 'Authentic Vedic education rooted in Sanatana Dharma',
    order_index: 0,
  },
  {
    section: 'mission',
    title: 'Our Mission',
    content:
      'eYogi Gurukul is a registered Irish charity (No. 20208551) dedicated to providing authentic Vedic education rooted in Sanatana Dharma for Ireland\'s community and seekers worldwide.',
    order_index: 1,
  },
  {
    section: 'approach',
    title: 'Our Approach',
    content:
      'We blend ancient wisdom with modern pedagogy, offering structured courses in Yoga, Meditation, Sanskrit, Mantra, and the broader Indian Knowledge System.',
    order_index: 2,
  },
  {
    section: 'history',
    title: 'Our History',
    content:
      'Founded in 2018, eYogi Gurukul has grown to serve over 1,000 students across Ireland and internationally through our innovative online and in-person learning programs.',
    order_index: 3,
  },
  {
    section: 'values',
    title: 'Our Values',
    content:
      'Authenticity, Accessibility, Integration, Excellence — these core values guide everything we do, ensuring quality education that honors tradition while embracing modernity.',
    order_index: 4,
  },
]

export default function AboutPage() {
  const [sections, setSections] = useState<AboutSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAboutContent()
  }, [])

  const fetchAboutContent = async () => {
    try {
      const { data, error } = await browserClient
        .from('about_content')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        setSections(data)
      } else {
        // Use default sections if no CMS content
        setSections(DEFAULT_SECTIONS as any)
      }
    } catch (err) {
      console.error('Error fetching about content:', err)
      // Fallback to default sections
      setSections(DEFAULT_SECTIONS as any)
    } finally {
      setLoading(false)
    }
  }

  const heroSection = sections.find((s) => s.section === 'hero')
  const contentSections = sections.filter((s) => s.section !== 'hero')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section - Matching Home Page Theme */}
      <section 
        className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden -mt-20 sunrise-hero"
        style={{ animation: 'sunriseGradient 12s ease-in-out infinite' }}
      >
        {/* Saffron top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />

        {/* Logo as background watermark */}
        <div
          className="absolute top-0 bottom-0 right-0 flex items-center justify-end pointer-events-none select-none"
          aria-hidden="true"
        >
          <div
            style={{
              width: 'clamp(400px, 50vw, 650px)',
              height: 'clamp(400px, 50vw, 650px)',
              marginRight: '-8%',
              opacity: 1,
            }}
          >
            <img
              src="/eyogiTextLess.png"
              alt=""
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                filter: 'brightness(1) saturate(0.7)',
              }}
            />
          </div>
        </div>

        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 30% 45%, rgba(234, 88, 12, 0.12) 0%, transparent 65%)',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col gap-6 px-6 md:px-12 lg:px-20 pt-32 md:pt-36 pb-10 max-w-5xl">
          {/* Professional brand label */}
          <div className="inline-flex items-center gap-2 text-orange-500/90 font-medium text-sm tracking-wide uppercase">
            <div className="w-8 h-[2px] bg-orange-500/60"></div>
            <span>About Us</span>
          </div>

          {/* Headline */}
          <h1
            className="font-sans font-semibold text-white leading-[1.1] tracking-tight"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
          >
            {heroSection?.title || DEFAULT_SECTIONS[0].title}
          </h1>

          {/* Subtext */}
          {heroSection?.content && (
            <p className="text-lg md:text-xl text-stone-300 max-w-3xl leading-relaxed font-light">
              {heroSection.content}
            </p>
          )}
        </div>

        {/* Bottom bar with stats */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/12 bg-black/20 backdrop-blur-sm px-6 md:px-12 lg:px-20 py-6 z-10">
          <div className="flex flex-wrap gap-x-10 gap-y-3 max-w-5xl">
            <span className="flex items-baseline gap-2.5">
              <strong className="text-white font-semibold text-base tabular-nums">1,000+</strong>
              <span className="text-stone-500 text-xs uppercase tracking-[0.15em] font-medium">Students Taught</span>
            </span>
            <span className="flex items-baseline gap-2.5">
              <strong className="text-white font-semibold text-base tabular-nums">30+</strong>
              <span className="text-stone-500 text-xs uppercase tracking-[0.15em] font-medium">Courses</span>
            </span>
            <span className="flex items-baseline gap-2.5">
              <strong className="text-white font-semibold text-base tabular-nums">2018</strong>
              <span className="text-stone-500 text-xs uppercase tracking-[0.15em] font-medium">Est.</span>
            </span>
            <span className="flex items-baseline gap-2.5">
              <strong className="text-white font-semibold text-base tabular-nums">#20208551</strong>
              <span className="text-stone-500 text-xs uppercase tracking-[0.15em] font-medium">Charity No.</span>
            </span>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="bg-stone-50">
        {contentSections.map((section, index) => {
          const Icon = SECTION_ICONS[section.section] || Book
          const isEven = index % 2 === 0

          return (
            <section
              key={section.id}
              className={`py-20 px-6 md:px-12 lg:px-20 ${
                isEven ? 'bg-white' : 'bg-stone-50'
              }`}
            >
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Content */}
                  <div className={isEven ? 'lg:order-1' : 'lg:order-2'}>
                    <div className="inline-flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-orange-600" />
                      </div>
                      <h2 className="font-sans text-2xl md:text-3xl font-semibold text-stone-900">
                        {section.title}
                      </h2>
                    </div>
                    <div className="prose prose-stone max-w-none">
                      <p className="text-stone-600 text-base leading-relaxed">
                        {section.content}
                      </p>
                    </div>

                    {/* Additional metadata content */}
                    {section.metadata?.points && Array.isArray(section.metadata.points) && (
                      <ul className="mt-6 space-y-3">
                        {section.metadata.points.map((point: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                            </span>
                            <span className="text-stone-600 text-sm">{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Image or placeholder */}
                  <div className={isEven ? 'lg:order-2' : 'lg:order-1'}>
                    {section.image_url ? (
                      <img
                        src={section.image_url}
                        alt={section.title || ''}
                        className="w-full h-auto rounded-xl shadow-lg"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-br from-orange-50 to-stone-100 flex items-center justify-center">
                        <Icon className="w-24 h-24 text-orange-200" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
