'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { CollectionArchive } from '@/components/CollectionArchive'
import Hero from '@/components/Hero/page'
import { Search } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: { schema: 'gurukul_main' },
  },
)

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
        const { data: postsData, error: fetchError } = await supabase
          .from('posts')
          .select('*')
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })

        if (fetchError) {
          console.error('Error fetching posts:', fetchError)
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
      } catch (err) {
        console.error('Error loading posts:', err)
        setError('An error occurred while loading posts')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  useEffect(() => {
    const searchLower = search.toLowerCase()
    const filtered = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchLower) ||
        post.description.toLowerCase().includes(searchLower),
    )
    setFilteredPosts(filtered)
  }, [search, posts])

  return (
    <div className="flex flex-col gap-16 w-full">
      <Hero />
      <div className="px-4 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-8">Hinduism</h1>

        {/* Search Bar */}
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

        {/* Content */}
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

        {/* Results Count */}
        {!loading && filteredPosts.length > 0 && (
          <div className="mt-8 text-sm text-gray-600">
            Showing {filteredPosts.length} of {posts.length} posts
          </div>
        )}
      </div>
    </div>
  )
}
