/**
 * Post Editor Page - Dynamic Route
 */

'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { Save, ArrowLeft } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  published_at: string | null
}

export default function PostEditorPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params?.id as string
  const isNew = postId === 'new'

  const [post, setPost] = useState<Post>({
    id: '',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    published_at: null,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew && postId) {
      // Fetch post data
      const fetchPost = async () => {
        try {
          const response = await fetch(`/api/content/posts/${postId}`)
          const data = await response.json()
          if (data.success) {
            setPost(data.data)
          }
        } catch (error) {
          console.error('Error fetching post:', error)
        }
      }

      fetchPost()
    }
  }, [postId, isNew])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setPost((prev) => ({
      ...prev,
      title,
      slug: post.slug || generateSlug(title),
    }))
  }

  const handleSave = async () => {
    if (!post.title.trim()) {
      alert('Please enter a title')
      return
    }

    setSaving(true)
    try {
      const url = isNew ? '/api/content/posts' : `/api/content/posts/${post.id}`
      const method = isNew ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          slug: post.slug || generateSlug(post.title),
          excerpt: post.excerpt,
          content: post.content,
          published_at: post.published_at || new Date().toISOString(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/posts')
      } else {
        alert('Error saving post: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving post:', error)
      alert('Error saving post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-slate-400 transition-colors font-medium"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Post'}
        </button>
      </div>

      {/* Editor */}
      <div className="bg-white p-8 rounded-lg border border-slate-200 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Title</label>
          <input
            type="text"
            value={post.title}
            onChange={handleTitleChange}
            placeholder="Enter post title"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Slug</label>
          <input
            type="text"
            value={post.slug}
            onChange={(e) => setPost((prev) => ({ ...prev, slug: e.target.value }))}
            placeholder="post-slug"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">URL: /blog/{post.slug || 'your-slug'}</p>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Excerpt</label>
          <textarea
            value={post.excerpt}
            onChange={(e) => setPost((prev) => ({ ...prev, excerpt: e.target.value }))}
            placeholder="Enter post excerpt (SEO description)"
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 resize-none"
          />
          <p className="text-xs text-slate-500 mt-1">
            {post.excerpt.length}/160 characters (recommended)
          </p>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Content</label>
          <RichTextEditor
            value={post.content}
            onChange={(content) => setPost((prev) => ({ ...prev, content }))}
            placeholder="Write your post content here..."
          />
        </div>

        {/* Publishing */}
        <div className="pt-4 border-t border-slate-200">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!post.published_at}
              onChange={(e) =>
                setPost((prev) => ({
                  ...prev,
                  published_at: e.target.checked ? new Date().toISOString() : null,
                }))
              }
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-900">Publish this post</span>
          </label>
        </div>
      </div>
    </div>
  )
}
