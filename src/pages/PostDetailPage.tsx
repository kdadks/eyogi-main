import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { browserClient } from '@/lib/supabase/browser'
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react'
import { Media } from '@/components/Media'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author_id: string
  author_name?: string
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  published_at?: string
  views?: number
  featured_image_url?: string
  cover_image?: any
}

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    const fetchPost = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await browserClient
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single()

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Post not found')
          } else {
            setError('Failed to load post')
          }
          return
        }

        setPost(data)
        
        // Increment view count (schema is already set in browserClient config)
        if (data?.id) {
          await browserClient
            .rpc('increment_post_views', { post_id: data.id })
            .catch(console.error)
        }
      } catch (err) {
        console.error('Error loading post:', err)
        setError('An error occurred while loading the post')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-4xl font-bold text-gray-900">
          {error === 'Post not found' ? '404 - Post Not Found' : 'Error Loading Post'}
        </h1>
        <p className="text-gray-600 text-center max-w-md">
          {error || 'The post you are looking for does not exist or has been removed.'}
        </p>
        <Link
          to="/hinduism"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hinduism
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section with Featured Image */}
      <div className="relative w-full bg-gradient-to-br from-orange-900 via-orange-700 to-red-800 text-white">
        <div className="absolute inset-0 bg-black/20" />
        
        {post.cover_image && typeof post.cover_image !== 'string' && (
          <div className="absolute inset-0">
            <Media
              resource={post.cover_image}
              imgClassName="w-full h-full object-cover opacity-30"
              className="w-full h-full"
            />
          </div>
        )}

        <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-32">
          <Link
            to="/hinduism"
            className="inline-flex items-center gap-2 text-orange-200 hover:text-white mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Hinduism
          </Link>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-orange-100 mb-8 max-w-3xl">
              {post.excerpt}
            </p>
          )}

          <div className="flex flex-wrap gap-6 text-sm text-orange-200">
            {post.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            )}
            
            {post.author_name && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author_name}</span>
              </div>
            )}

            {post.views !== undefined && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.views} views</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <article className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div
          className="prose prose-lg prose-orange max-w-none
            prose-headings:text-gray-900 prose-headings:font-bold
            prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-blockquote:border-l-4 prose-blockquote:border-orange-500
            prose-blockquote:bg-orange-50 prose-blockquote:p-4
            prose-blockquote:italic prose-blockquote:text-gray-700
            prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1
            prose-code:rounded prose-code:text-sm prose-code:text-gray-800
            prose-pre:bg-gray-900 prose-pre:text-gray-100
            prose-img:rounded-lg prose-img:shadow-lg
            prose-ul:list-disc prose-ol:list-decimal
            prose-li:text-gray-700"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Explore More Teachings</h2>
          <p className="text-orange-100 mb-6">
            Discover more articles about Hinduism and spiritual wisdom
          </p>
          <Link
            to="/hinduism"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 hover:bg-orange-50 rounded-lg font-semibold transition-colors"
          >
            View All Posts
          </Link>
        </div>
      </div>
    </div>
  )
}
