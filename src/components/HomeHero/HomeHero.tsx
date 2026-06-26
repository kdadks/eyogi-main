import { Facebook, Linkedin, Twitter, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDonationModal } from '@/contexts/DonationModalContext'

export interface HomeHeroData {
  headline?: string
  subheadline?: string
  subtext?: string
  ctaPrimary?: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
  stats?: { value: string; label: string }[]
}

const DEFAULTS: Required<HomeHeroData> = {
  headline: 'Ancient Wisdom,',
  subheadline: 'Modern Minds.',
  subtext:
    'Authentic Vedic education for Ireland’s community and seekers worldwide — grounded in Sanatana Dharma, built for the modern world.',
  ctaPrimary: { label: 'Learn More', href: '/about' },
  ctaSecondary: { label: 'Donate', href: '/donation' },
  stats: [
    { value: '1,000+', label: 'Students Taught' },
    { value: '30+', label: 'Courses' },
    { value: '2018', label: 'Est.' },
    { value: '#20208551', label: 'Charity No.' },
  ],
}

const SOCIALS = [
  { href: 'http://www.linkedin.com/in/eyogi-gurukul-7a63a91a0', Icon: Linkedin, label: 'LinkedIn' },
  { href: 'http://www.twitter.com/@eyogigurukul', Icon: Twitter, label: 'Twitter' },
  { href: 'https://www.facebook.com/allfestivesireland#', Icon: Facebook, label: 'Facebook' },
  { href: 'https://www.youtube.com/channel/UCTytB2My0xSvNmtKBRIJnIg?', Icon: Youtube, label: 'YouTube' },
]

export default function HomeHero({ data }: { data?: HomeHeroData }) {
  const { openModal } = useDonationModal()
  const headline = data?.headline ?? DEFAULTS.headline
  const subheadline = data?.subheadline ?? DEFAULTS.subheadline
  const subtext = data?.subtext ?? DEFAULTS.subtext
  const cta1 = data?.ctaPrimary ?? DEFAULTS.ctaPrimary
  const stats = data?.stats ?? DEFAULTS.stats

  return (
    <div
      className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden -mt-20 sunrise-hero"
      style={{ animation: 'sunriseGradient 12s ease-in-out infinite' }}
    >
      {/* Saffron top accent line - sacred color in Hinduism */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />

      {/* Logo as background watermark */}
      <div
        className="absolute top-0 bottom-0 right-0 flex items-center justify-end pointer-events-none select-none"
        style={{ paddingBottom: '80px' }}
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

      {/* Subtle radial glow behind text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 30% 45%, rgba(234, 88, 12, 0.12) 0%, transparent 65%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col gap-6 px-6 md:px-12 lg:px-20 pt-32 md:pt-36 pb-10 max-w-5xl">
        {/* Professional brand label */}
        <div className="inline-flex items-center gap-2 text-orange-500/90 font-medium text-sm tracking-wide uppercase">
          <div className="w-8 h-[2px] bg-orange-500/60"></div>
          <span>eYogi Gurukul</span>
        </div>

        {/* Professional headline with better typography */}
        <h1
          className="font-sans font-semibold text-white leading-[1.1] tracking-tight"
          style={{ fontSize: 'clamp(2.75rem, 5.5vw, 5rem)' }}
        >
          {headline}
          <br />
          <span className="text-orange-400 font-medium">{subheadline}</span>
        </h1>

        {/* Mission copy with better readability */}
        <p className="text-base md:text-lg text-stone-300 max-w-2xl leading-relaxed font-light">{subtext}</p>

        {/* CTAs with professional styling */}
        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            to={cta1.href}
            className="inline-flex items-center justify-center px-8 py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-md font-semibold text-sm tracking-wide uppercase transition-all duration-200 shadow-lg shadow-orange-900/30 hover:shadow-xl hover:shadow-orange-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            {cta1.label}
          </Link>
          <button
            onClick={openModal}
            className="inline-flex items-center justify-center px-8 py-3.5 text-white border-2 border-white/25 hover:border-orange-500/50 hover:bg-orange-500/10 rounded-md font-semibold text-sm tracking-wide uppercase transition-all duration-200"
          >
            Donate
          </button>
        </div>
      </div>

      {/* Bottom bar — trust + socials */}
      <div className="relative z-10 border-t border-white/12 bg-black/20 backdrop-blur-sm px-6 md:px-12 lg:px-20 py-6">
        {/* Stats row with professional styling */}
        <div className="flex flex-wrap gap-x-10 gap-y-3 mb-5">
          {stats.map(({ value, label }) => (
            <span key={label} className="flex items-baseline gap-2.5">
              <strong className="text-white font-semibold text-base tabular-nums">{value}</strong>
              <span className="text-stone-500 text-xs uppercase tracking-[0.15em] font-medium">{label}</span>
            </span>
          ))}
        </div>

        {/* Socials + scroll */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2.5">
            <p className="text-stone-400 text-sm font-medium">office@eyogigurukul.com</p>
            <div className="flex gap-4">
              {SOCIALS.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-stone-500 hover:text-orange-500 transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 animate-bounce [animation-duration:1800ms]">
            <span className="hidden md:block text-[10px] text-stone-600 font-semibold tracking-[0.2em] uppercase">
              Scroll
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="border border-stone-600 rounded-full w-7 h-7 p-1.5 text-stone-500"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
