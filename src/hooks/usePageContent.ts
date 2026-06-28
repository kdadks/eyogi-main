import { useEffect, useState, useCallback } from 'react'
import { browserClient } from '@/lib/supabase/browser'

export function usePageContent(slug: string) {
  const [content, setContent] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await browserClient
        .from('cms_content')
        .select('content')
        .eq('slug', slug)
        .eq('status', 'published')
        .eq('content_type', 'page')
        .single()

      if (!error && data?.content) {
        setContent(data.content as Record<string, any>)
      }
    } catch {
      // fall through to defaults in the consuming component
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetch() }, [fetch])

  return { content, loading, refetch: fetch }
}

// Admin version — fetches draft or published (for editing)
export function usePageContentAdmin(slug: string) {
  const [content, setContent] = useState<Record<string, any> | null>(null)
  const [contentId, setContentId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('draft')
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await browserClient
        .from('cms_content')
        .select('id, content, status')
        .eq('slug', slug)
        .eq('content_type', 'page')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        setContent(data.content as Record<string, any>)
        setContentId(data.id)
        setStatus(data.status)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetch() }, [fetch])

  const updateSection = async (sectionKey: string, sectionData: Record<string, any>) => {
    if (!contentId) return false
    const merged = { ...(content ?? {}), [sectionKey]: sectionData }
    const { error } = await browserClient
      .from('cms_content')
      .update({ content: merged, updated_at: new Date().toISOString() })
      .eq('id', contentId)
    if (!error) {
      setContent(merged)
      return true
    }
    return false
  }

  // Merges all top-level keys from newData into the existing content object.
  // Use this when the drawer saves the entire page as a flat object.
  const updatePageContent = async (newData: Record<string, any>) => {
    if (!contentId) return false
    const merged = { ...(content ?? {}), ...newData }
    const { error } = await browserClient
      .from('cms_content')
      .update({ content: merged, updated_at: new Date().toISOString() })
      .eq('id', contentId)
    if (!error) {
      setContent(merged)
      return true
    }
    return false
  }

  const publish = async () => {
    if (!contentId) return false
    const { error } = await browserClient
      .from('cms_content')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', contentId)
    if (!error) { setStatus('published'); return true }
    return false
  }

  const unpublish = async () => {
    if (!contentId) return false
    const { error } = await browserClient
      .from('cms_content')
      .update({ status: 'draft' })
      .eq('id', contentId)
    if (!error) { setStatus('draft'); return true }
    return false
  }

  return { content, contentId, status, loading, refetch: fetch, updateSection, updatePageContent, publish, unpublish }
}
