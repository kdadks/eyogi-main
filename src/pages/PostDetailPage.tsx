import { useState, useEffect } from 'react'
import type React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { browserClient } from '@/lib/supabase/browser'
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react'
import { Media } from '@/components/Media'
import type { Block } from '@/types/blocks'

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

function renderBlock(block: Block, index: number): React.ReactNode {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3'
      const sizes: Record<1 | 2 | 3, string> = { 1: 'text-4xl', 2: 'text-3xl', 3: 'text-2xl' }
      return <Tag key={block.id ?? index} className={`${sizes[block.level]} font-bold my-4`}>{block.text}</Tag>
    }
    case 'text':
      try {
        const parsed = JSON.parse(block.lexicalState)
        const text = parsed?.root?.children?.map((p: any) =>
          p?.children?.map((n: any) => n?.text ?? '').join('')
        ).join('\n') ?? ''
        return <div key={block.id ?? index} className="prose prose-stone max-w-none my-4"><p>{text}</p></div>
      } catch {
        return null
      }
    case 'image':
      return block.publicUrl ? (
        <figure key={block.id ?? index} className="my-6">
          <img src={block.publicUrl} alt={block.alt} className="rounded-lg max-w-full" />
          {block.caption && <figcaption className="text-sm text-stone-500 mt-2 text-center">{block.caption}</figcaption>}
        </figure>
      ) : null
    case 'video': {
      const ytId = block.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1]
      return ytId ? (
        <div key={block.id ?? index} className="my-6 aspect-video">
          <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full rounded-lg" allowFullScreen />
          {block.caption && <p className="text-sm text-stone-500 mt-2 text-center">{block.caption}</p>}
        </div>
      ) : null
    }
    case 'quote':
      return (
        <blockquote key={block.id ?? index} className="border-l-4 border-amber-500 pl-6 my-6 italic text-stone-600">
          <p>{block.text}</p>
          {block.attribution && <cite className="text-sm not-italic mt-2 block">— {block.attribution}</cite>}
        </blockquote>
      )
    case 'callout': {
      const styles: Record<'info' | 'warning' | 'tip', string> = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        tip: 'bg-green-50 border-green-200 text-green-800',
      }
      return <div key={block.id ?? index} className={`border rounded-lg p-4 my-4 ${styles[block.variant]}`}>{block.text}</div>
    }
    case 'divider':
      return <hr key={block.id ?? index} className="my-8 border-stone-200" />
    case 'html':
      // Sanitize: strip script tags before rendering
      return <div key={block.id ?? index} dangerouslySetInnerHTML={{ __html: block.code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') }} />
    case 'columns':
      return (
        <div key={block.id ?? index} className="grid grid-cols-2 gap-8 my-6">
          <div>{block.left.map((b, i) => renderBlock(b, i))}</div>
          <div>{block.right.map((b, i) => renderBlock(b, i))}</div>
        </div>
      )
    default:
      return null
  }
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
        
        // Increment view count — fire-and-forget, never block page load
        if (data?.id) {
          browserClient.rpc('increment_post_views', { post_id: data.id }).then(() => {})
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
        {(() => {
          try {
            const blocks: Block[] = JSON.parse(post.content ?? '[]')
            return Array.isArray(blocks) ? blocks.map((b, i) => renderBlock(b, i)) : null
          } catch {
            // Legacy plain-text content fallback
            return <div className="prose prose-stone max-w-none">{post.content}</div>
          }
        })()}
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
