// src/pages/admin/PostEditor.tsx
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Image } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AdminLayout, Button, Input, Select, Textarea } from '@/components/admin'
import { BlockEditor } from '@/components/admin/blocks/BlockEditor'
import { MediaPicker } from '@/components/admin/media/MediaPicker'
import type { Block } from '@/types/blocks'
import type { MediaRecord } from '@/lib/supabase/media'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

interface MediaPickerState {
  isOpen: boolean
  onSelect: ((mediaId: string, publicUrl: string, alt: string) => void) | null
}

export default function PostEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [featuredImage, setFeaturedImage] = useState<{ id: string; publicUrl: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState<string | null>(null)
  const [mediaPicker, setMediaPicker] = useState<MediaPickerState>({ isOpen: false, onSelect: null })

  useEffect(() => {
    if (!isEdit || !id) return
    const supabase = createClient()
    supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setError('Post not found'); return }
        setTitle(data.title)
        setSlug(data.slug)
        setExcerpt(data.excerpt ?? '')
        setStatus((data as any).status ?? 'draft')
        try {
          const parsed = data.content ? JSON.parse(data.content) : []
          setBlocks(Array.isArray(parsed) ? parsed : [])
        } catch {
          setBlocks([])
        }
        if ((data as any).featured_image_id) {
          setFeaturedImage({ id: (data as any).featured_image_id, publicUrl: (data as any).featured_image_url ?? '' })
        }
        setLoading(false)
      })
  }, [id, isEdit])

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!isEdit) setSlug(slugify(val))
  }

  const openMediaPicker = useCallback(
    (onSelect: (mediaId: string, publicUrl: string, alt: string) => void) => {
      setMediaPicker({ isOpen: true, onSelect })
    },
    [],
  )

  const handleMediaPickerSelect = (media: MediaRecord) => {
    if (mediaPicker.onSelect) {
      mediaPicker.onSelect(media.id, media.public_url, media.alt_text ?? '')
    }
    setMediaPicker({ isOpen: false, onSelect: null })
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!slug.trim()) { setError('Slug is required'); return }
    setError(null)
    setSaving(true)
    const supabase = createClient()

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      content: JSON.stringify(blocks),
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      featured_image_id: featuredImage?.id ?? null,
    }

    const { error: saveError } = isEdit && id
      ? await supabase.from('posts').update(payload).eq('id', id)
      : await supabase.from('posts').insert(payload)

    setSaving(false)
    if (saveError) { setError(saveError.message); return }
    navigate('/admin/posts')
  }

  if (loading) {
    return (
      <AdminLayout
        title="Loading…"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Posts', href: '/admin/posts' },
          { label: 'Loading…' },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title={isEdit ? 'Edit Post' : 'New Post'}
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Posts', href: '/admin/posts' },
        { label: isEdit ? 'Edit' : 'New Post' },
      ]}
    >
      <div className="flex gap-6">
        {/* Main editor area */}
        <div className="flex-1 min-w-0 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title"
              required
            />
            <Input
              label="Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="post-slug"
              required
            />
            <Textarea
              label="Excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary shown in post listings"
              rows={3}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Content</h3>
            <BlockEditor
              blocks={blocks}
              onChange={setBlocks}
              onOpenMediaPicker={openMediaPicker}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 shrink-0 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Publishing</h3>
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/admin/posts')}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                isLoading={saving}
                icon={<Save className="w-4 h-4" />}
              >
                {status === 'published' ? 'Publish' : 'Save'}
              </Button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Featured Image</h3>
            {featuredImage ? (
              <div className="space-y-2">
                <img
                  src={featuredImage.publicUrl}
                  alt="Featured"
                  className="w-full aspect-video object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setFeaturedImage(null)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  openMediaPicker((mediaId, publicUrl) =>
                    setFeaturedImage({ id: mediaId, publicUrl }),
                  )
                }
                className="w-full aspect-video border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-orange-300 hover:text-orange-400 transition-colors"
              >
                <Image className="w-6 h-6 mb-1" />
                <span className="text-xs">Set featured image</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <MediaPicker
        isOpen={mediaPicker.isOpen}
        onClose={() => setMediaPicker({ isOpen: false, onSelect: null })}
        onSelect={handleMediaPickerSelect}
      />
    </AdminLayout>
  )
}
