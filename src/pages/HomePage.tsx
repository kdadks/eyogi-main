import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Heart, Target } from 'lucide-react'
import HomeHero, { HomeHeroData } from '@/components/HomeHero/HomeHero'
import HomeMarquee from '@/components/HomeMarquee/HomeMarquee'
import { browserClient } from '@/lib/supabase/browser'
import { usePageContent } from '@/hooks/usePageContent'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  published_at: string | null
}

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
}

// ─── Defaults (fallback when CMS has no data) ─────────────────────────────────

const DEFAULT_MISSION_CARDS = [
  {
    icon: Target,
    title: 'What We Do',
    body: 'We provide authentic Vedic education blending a scientific approach with spiritual wisdom through structured courses and community programs.',
    href: '/about',
    cta: 'About Us',
  },
  {
    icon: BookOpen,
    title: 'How We Do It',
    body: 'Through our Gurukul system with qualified teachers, structured curriculum, and both online and in-person learning options.',
    href: '/membership',
    cta: 'Join Us',
  },
  {
    icon: Heart,
    title: 'Why We Do It',
    body: 'To preserve and propagate the timeless wisdom of Sanatana Dharma while making it accessible and relevant to modern seekers.',
    href: '/about',
    cta: 'Our Mission',
  },
]

const ICON_MAP: Record<string, typeof Target> = { Target, BookOpen, Heart }

const FALLBACK_COURSES = [
  'Indian Knowledge System', 'Yoga & Meditation', 'Sanskrit', 'Mantra Basics',
  'Hinduism Basics', 'Stotram Recitation', 'Itihasa', 'Bhagavad Gita',
  'Upanishads', 'Darshana Shastra', 'Irish Leaving Cert Guide', 'Irish Language',
]

// ─── Section: Mission cards ───────────────────────────────────────────────────

function MissionSection({ data }: { data?: any }) {
  const cards = data?.cards?.length
    ? data.cards.map((c: any) => ({
        icon: ICON_MAP[c.icon] ?? Target,
        title: c.title,
        body: c.body,
        href: c.href,
        cta: c.cta,
      }))
    : DEFAULT_MISSION_CARDS

  return (
    <section className="bg-white py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-600 mb-4">
          {data?.eyebrow ?? 'Our Purpose'}
        </p>
        <h2
          className="font-sans font-semibold text-stone-900 leading-tight mb-16"
          style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}
        >
          {data?.heading ?? 'Education rooted in tradition,'}
          <br />
          <span className="text-orange-600">built for today.</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map(({ icon: Icon, title, body, href, cta }: any) => (
            <Link
              key={title}
              to={href}
              className="group flex flex-col gap-5 p-8 border-2 border-stone-200 rounded-xl hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 bg-white"
            >
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                <Icon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex flex-col gap-3 flex-1">
                <h3 className="font-sans text-xl font-semibold text-stone-900">{title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{body}</p>
              </div>
              <span className="flex items-center gap-2 text-orange-600 text-sm font-semibold uppercase tracking-wide group-hover:gap-3 transition-all duration-200">
                {cta}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section: Story ───────────────────────────────────────────────────────────

function StorySection({ data }: { data?: any }) {
  const paragraphs: string[] = data?.paragraphs?.length ? data.paragraphs : [
    'Gurukul (Sanskrit: गुरुकुल) was the primary education system of ancient India — students living near or with the guru, learning in a shared environment. The Gurukul is the earliest education system of humanity, with origins traceable back over 15,000 years. Modern schools are its evolution.',
    'The “e” in eYogi Gurukul connects ancient Vedic practices of meditation and spirituality to the modern world of science and globalisation. An eYogi practices the inner science of Sanatana Dharma while embracing integration and harmony with all cultures.',
  ]
  const quote = data?.quote ?? 'Preserving ancient wisdom, inspiring young minds. Accessible, values-based education for a brighter future.'
  const attribution = data?.attribution ?? 'eYogi Gurukul — Ireland'

  return (
    <section className="bg-stone-50 py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div className="flex flex-col gap-6">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-600">
            {data?.eyebrow ?? 'Our Story'}
          </p>
          <h2
            className="font-sans font-semibold text-stone-900 leading-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}
          >
            {data?.heading ?? 'What is a Gurukul?'}
          </h2>
          {paragraphs.map((p, i) => (
            <p key={i} className="text-stone-600 leading-relaxed text-base">{p}</p>
          ))}
          <Link
            to="/about"
            className="flex items-center gap-2 text-orange-600 font-semibold text-sm uppercase tracking-wide w-fit group hover:gap-4 transition-all duration-200"
          >
            Read more about us
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="relative p-10 bg-white rounded-xl border-2 border-stone-200 shadow-sm">
          <span
            className="absolute top-6 left-8 font-serif text-orange-200 leading-none select-none"
            style={{ fontSize: '5rem', lineHeight: 1 }}
            aria-hidden="true"
          >
            &ldquo;
          </span>
          <p
            className="font-sans text-stone-700 leading-relaxed pt-12 font-medium"
            style={{ fontSize: 'clamp(1.1rem, 2vw, 1.35rem)' }}
          >
            {quote}
          </p>
          <p className="mt-6 text-xs text-stone-500 tracking-wide uppercase font-semibold">
            {attribution}
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Posts ───────────────────────────────────────────────────────────

function PostsSection({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null

  return (
    <section className="bg-white border-t border-stone-200 py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-600 mb-3">
              Latest
            </p>
            <h2
              className="font-sans font-semibold text-stone-900"
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)' }}
            >
              From Hinduism
            </h2>
          </div>
          <Link
            to="/hinduism"
            className="hidden md:flex items-center gap-1.5 text-sm text-stone-600 hover:text-orange-600 font-semibold uppercase tracking-wide transition-colors duration-200 group"
          >
            View all
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/hinduism/${post.slug}`}
              className="group flex flex-col gap-4 p-6 bg-stone-50 rounded-xl border-2 border-stone-200 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100 transition-all duration-200"
            >
              <div className="flex-1 flex flex-col gap-3">
                <h3 className="font-sans text-lg font-semibold text-stone-900 leading-snug group-hover:text-orange-700 transition-colors duration-200">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-stone-600 text-sm leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                <time className="text-xs text-stone-500 tabular-nums font-medium">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-IE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : ''}
                </time>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section: Courses ─────────────────────────────────────────────────────────

function CoursesSection({ courses, data }: { courses: Course[]; data?: any }) {
  const names = courses.length > 0 ? courses.map((c) => c.title) : (data?.courses ?? FALLBACK_COURSES)

  return (
    <section className="bg-stone-900 text-white py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-500 mb-3">
              {data?.eyebrow ?? 'Curriculum'}
            </p>
            <h2
              className="font-sans font-semibold text-white"
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)' }}
            >
              {data?.heading ?? 'What We Teach'}
            </h2>
          </div>
          <Link
            to="/membership"
            className="hidden md:flex items-center gap-1.5 text-sm text-stone-400 hover:text-orange-400 font-semibold uppercase tracking-wide transition-colors duration-200 group"
          >
            Join a course
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {names.map((name: string) => (
            <span
              key={name}
              className="inline-flex items-center px-5 py-2.5 rounded-lg border-2 border-stone-700 text-stone-300 text-sm font-medium hover:border-orange-600 hover:text-white hover:bg-orange-600/10 transition-all duration-200 cursor-default"
            >
              {name}
            </span>
          ))}
          <span className="inline-flex items-center px-5 py-2.5 rounded-lg text-stone-600 text-sm italic font-medium">
            + more coming soon
          </span>
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { content } = usePageContent('home')
  const [posts, setPosts] = useState<Post[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const [postsRes, coursesRes] = await Promise.allSettled([
        browserClient
          .from('posts')
          .select('id, title, slug, excerpt, published_at')
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .limit(3),
        browserClient
          .from('courses' as any)
          .select('id, title, slug, description')
          .eq('status', 'published')
          .limit(12),
      ])

      if (postsRes.status === 'fulfilled' && postsRes.value.data) {
        setPosts(postsRes.value.data as Post[])
      }
      if (coursesRes.status === 'fulfilled' && coursesRes.value.data) {
        setCourses(coursesRes.value.data as Course[])
      }
    }
    fetchData()
  }, [])

  const heroData: HomeHeroData = content?.hero ?? {}
  const tickerItems = courses.length > 0
    ? courses.map((c) => ({ label: c.title }))
    : (content?.courses?.courses ?? FALLBACK_COURSES).map((name: string) => ({ label: name }))

  return (
    <div className="flex flex-col w-full">
      <HomeHero data={heroData} />
      <HomeMarquee items={tickerItems} />
      <MissionSection data={content?.mission} />
      <StorySection data={content?.story} />
      <PostsSection posts={posts} />
      <CoursesSection courses={courses} data={content?.courses} />
    </div>
  )
}
