import { useState, useEffect } from 'react'
import { Users, Target, Book, Award, Heart, Globe } from 'lucide-react'
import { usePageContent } from '@/hooks/usePageContent'

const SECTION_ICONS: Record<string, any> = {
  mission: Target,
  approach: Book,
  history: Globe,
  values: Heart,
  team: Users,
  achievements: Award,
}

const DEFAULT_SECTIONS = [
  { section: 'mission', title: 'Our Mission', content: "eYogi Gurukul is a registered Irish charity (No. 20208551) dedicated to providing authentic Vedic education rooted in Sanatana Dharma for Ireland's community and seekers worldwide.", order_index: 0 },
  { section: 'approach', title: 'Our Approach', content: 'We blend ancient wisdom with modern pedagogy, offering structured courses in Yoga, Meditation, Sanskrit, Mantra, and the broader Indian Knowledge System.', order_index: 1 },
  { section: 'history', title: 'Our History', content: 'Founded in 2018, eYogi Gurukul has grown to serve over 1,000 students across Ireland and internationally through our innovative online and in-person learning programs.', order_index: 2 },
  { section: 'values', title: 'Our Values', content: 'Authenticity, Accessibility, Integration, Excellence — these core values guide everything we do, ensuring quality education that honors tradition while embracing modernity.', order_index: 3 },
]

const DEFAULT_HERO = {
  title: "eYogi Gurukul - Ireland's Vedic School",
  subtitle: 'Authentic Vedic education rooted in Sanatana Dharma',
}

export default function AboutPage() {
  const { content, loading } = usePageContent('about')

  const heroTitle = content?.hero?.title ?? DEFAULT_HERO.title
  const heroSubtitle = content?.hero?.subtitle ?? DEFAULT_HERO.subtitle
  const contentSections: typeof DEFAULT_SECTIONS = content?.sections?.length
    ? content.sections
    : DEFAULT_SECTIONS

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section
        className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden -mt-20 sunrise-hero"
        style={{ animation: 'sunriseGradient 12s ease-in-out infinite' }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />

        <div
          className="absolute top-0 bottom-0 right-0 flex items-center justify-end pointer-events-none select-none"
          aria-hidden="true"
        >
          <div style={{ width: 'clamp(400px, 50vw, 650px)', height: 'clamp(400px, 50vw, 650px)', marginRight: '-8%', opacity: 1 }}>
            <img src="/eyogiTextLess.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(1) saturate(0.7)' }} />
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 30% 45%, rgba(234, 88, 12, 0.12) 0%, transparent 65%)' }} />

        <div className="relative z-10 flex flex-col gap-6 px-6 md:px-12 lg:px-20 pt-32 md:pt-36 pb-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 text-orange-500/90 font-medium text-sm tracking-wide uppercase">
            <div className="w-8 h-[2px] bg-orange-500/60"></div>
            <span>{content?.hero?.eyebrow ?? 'About Us'}</span>
          </div>
          <h1 className="font-sans font-semibold text-white leading-[1.1] tracking-tight" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
            {heroTitle}
          </h1>
          {heroSubtitle && (
            <p className="text-lg md:text-xl text-stone-300 max-w-3xl leading-relaxed font-light">{heroSubtitle}</p>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/12 bg-black/20 backdrop-blur-sm px-6 md:px-12 lg:px-20 py-6 z-10">
          <div className="flex flex-wrap gap-x-10 gap-y-3 max-w-5xl">
            {[{ value: '1,000+', label: 'Students Taught' }, { value: '30+', label: 'Courses' }, { value: '2018', label: 'Est.' }, { value: '#20208551', label: 'Charity No.' }].map((s) => (
              <span key={s.label} className="flex items-baseline gap-2.5">
                <strong className="text-white font-semibold text-base tabular-nums">{s.value}</strong>
                <span className="text-stone-500 text-xs uppercase tracking-[0.15em] font-medium">{s.label}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="bg-stone-50">
        {contentSections.map((section, index) => {
          const Icon = SECTION_ICONS[section.section] ?? Book
          const isEven = index % 2 === 0

          return (
            <section key={section.section || index} className={`py-20 px-6 md:px-12 lg:px-20 ${isEven ? 'bg-white' : 'bg-stone-50'}`}>
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className={isEven ? 'lg:order-1' : 'lg:order-2'}>
                    <div className="inline-flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-orange-600" />
                      </div>
                      <h2 className="font-sans text-2xl md:text-3xl font-semibold text-stone-900">{section.title}</h2>
                    </div>
                    <p className="text-stone-600 text-base leading-relaxed">{section.content}</p>
                  </div>
                  <div className={isEven ? 'lg:order-2' : 'lg:order-1'}>
                    <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-br from-orange-50 to-stone-100 flex items-center justify-center">
                      <Icon className="w-24 h-24 text-orange-200" />
                    </div>
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
