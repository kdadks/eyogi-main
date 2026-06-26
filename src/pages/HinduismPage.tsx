import { useState, useEffect } from 'react'
import { CollectionArchive } from '@/components/CollectionArchive'
import { Search } from 'lucide-react'
import { browserClient } from '@/lib/supabase/browser'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  published_at: string
  created_at: string
  updated_at: string
  created_by: string
}

interface MappedPost {
  id: string
  title: string
  slug: string
  description: string
  body: Array<{ type: string; text: string }>
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export default function HinduismPage() {
  const [posts, setPosts] = useState<MappedPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<MappedPost[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const { data: postsData, error: fetchError } = await browserClient
          .from('posts')
          .select('*')
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })

        if (fetchError) {
          setError('Failed to load posts')
          return
        }

        const mapped = (postsData || []).map((post: Post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          description: post.excerpt,
          body: [{ type: 'text', text: post.content }],
          publishedAt: post.published_at,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
        }))

        setPosts(mapped)
        setFilteredPosts(mapped)
      } catch {
        setError('An error occurred while loading posts')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  useEffect(() => {
    const searchLower = search.toLowerCase()
    setFilteredPosts(
      posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.description.toLowerCase().includes(searchLower),
      ),
    )
  }, [search, posts])

  return (
    <div className="flex flex-col gap-0 w-full">
      {/* Hero Section with Sunrise Animation */}
      <section className="relative w-full min-h-screen flex flex-col justify-center overflow-hidden -mt-20 sunrise-hero"
        style={{ animation: 'sunriseGradient 12s ease-in-out infinite' }}
      >
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
          <div className="max-w-3xl">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-orange-400 font-medium text-sm tracking-wide uppercase">
                <div className="w-8 h-[2px] bg-orange-500/60"></div>
                <span>Ancient Wisdom</span>
              </div>
              <h1 className="font-sans font-semibold text-white leading-[1.1] tracking-tight"
                style={{ fontSize: 'clamp(2.75rem, 5.5vw, 5rem)' }}
              >
                Explore<br />
                <span className="text-orange-400 font-medium">Hinduism</span>
              </h1>
              <p className="text-base md:text-lg text-stone-300 max-w-2xl leading-relaxed font-light">
                Discover the profound wisdom and spiritual teachings of Hinduism that have guided humanity for millennia.
              </p>
              <div className="pt-4">
                <a
                  href="#posts-section"
                  onClick={(e) => {
                    e.preventDefault()
                    const element = document.getElementById('posts-section')
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-md font-semibold text-sm tracking-wide uppercase transition-all duration-200 shadow-lg shadow-orange-900/30 hover:shadow-xl hover:shadow-orange-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Posts Section */}
      <section className="w-full" id="posts-section">
        <div className="px-4 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-8">Hinduism</h1>
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {search ? 'No posts match your search.' : 'No published posts yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <CollectionArchive posts={filteredPosts} />
            </div>
          )}

          {!loading && filteredPosts.length > 0 && (
            <div className="mt-8 text-sm text-gray-600">
              Showing {filteredPosts.length} of {posts.length} posts
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
