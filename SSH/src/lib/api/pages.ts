import { supabaseAdmin } from '../supabase'
import { Page, PageAnalytics } from '../../types'

// Get all pages with optional filtering
export async function getPages(filters?: {
  page_type?: string
  is_published?: boolean
  gurukul_id?: string
  limit?: number
}): Promise<Page[]> {
  try {
    let query = supabaseAdmin
      .from('pages')
      .select(
        `
        *,
        created_by_user:profiles!pages_created_by_fkey(id, full_name, email),
        published_by_user:profiles!pages_published_by_fkey(id, full_name, email),
        gurukul:gurukuls(id, name, slug)
      `,
      )
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (filters?.page_type) {
      query = query.eq('page_type', filters.page_type)
    }

    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published)
    }

    if (filters?.gurukul_id) {
      query = query.eq('gurukul_id', filters.gurukul_id)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching pages:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getPages:', error)
    throw error
  }
}

// Get published pages by type (for public consumption)
export async function getPublishedPages(page_type?: string): Promise<Page[]> {
  try {
    let query = supabaseAdmin
      .from('pages')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (page_type) {
      query = query.eq('page_type', page_type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching published pages:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getPublishedPages:', error)
    return []
  }
}

// Get a single page by ID
export async function getPageById(id: string): Promise<Page | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('pages')
      .select(
        `
        *,
        created_by_user:profiles!pages_created_by_fkey(id, full_name, email),
        published_by_user:profiles!pages_published_by_fkey(id, full_name, email),
        gurukul:gurukuls(id, name, slug)
      `,
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching page by ID:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getPageById:', error)
    return null
  }
}

// Get a single page by slug (for public URLs)
export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('pages')
      .select(
        `
        *,
        created_by_user:profiles!pages_created_by_fkey(id, full_name, email),
        published_by_user:profiles!pages_published_by_fkey(id, full_name, email),
        gurukul:gurukuls(id, name, slug)
      `,
      )
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (error) {
      console.error('Error fetching page by slug:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getPageBySlug:', error)
    return null
  }
}

// Create a new page
export async function createPage(pageData: {
  title: string
  slug: string
  content: Record<string, unknown>
  page_type?: string
  gurukul_id?: string
  is_published?: boolean
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  featured_image_url?: string
  template?: string
  sort_order?: number
  created_by?: string
}): Promise<Page> {
  try {
    const { data, error } = await supabaseAdmin
      .from('pages')
      .insert({
        title: pageData.title,
        slug: pageData.slug,
        content: pageData.content,
        page_type: pageData.page_type || 'page',
        gurukul_id: pageData.gurukul_id,
        is_published: pageData.is_published || false,
        seo_title: pageData.seo_title,
        seo_description: pageData.seo_description,
        seo_keywords: pageData.seo_keywords,
        featured_image_url: pageData.featured_image_url,
        template: pageData.template || 'default',
        sort_order: pageData.sort_order || 0,
        created_by: pageData.created_by,
      })
      .select(
        `
        *,
        created_by_user:profiles!pages_created_by_fkey(id, full_name, email),
        published_by_user:profiles!pages_published_by_fkey(id, full_name, email),
        gurukul:gurukuls(id, name, slug)
      `,
      )
      .single()

    if (error) {
      console.error('Error creating page:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createPage:', error)
    throw error
  }
}

// Update an existing page
export async function updatePage(
  id: string,
  pageData: {
    title?: string
    slug?: string
    content?: Record<string, unknown>
    page_type?: string
    gurukul_id?: string
    is_published?: boolean
    seo_title?: string
    seo_description?: string
    seo_keywords?: string[]
    featured_image_url?: string
    template?: string
    sort_order?: number
    published_by?: string
  },
): Promise<Page> {
  try {
    const updateData: Record<string, unknown> = { ...pageData }

    // Set published_at if is_published is being set to true
    if (pageData.is_published === true) {
      const now = new Date()
      // Format as "YYYY-MM-DD HH:MM:SS"
      const year = now.getFullYear()
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const day = now.getDate().toString().padStart(2, '0')
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const seconds = now.getSeconds().toString().padStart(2, '0')

      updateData.published_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    const { data, error } = await supabaseAdmin
      .from('pages')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        created_by_user:profiles!pages_created_by_fkey(id, full_name, email),
        published_by_user:profiles!pages_published_by_fkey(id, full_name, email),
        gurukul:gurukuls(id, name, slug)
      `,
      )
      .single()

    if (error) {
      console.error('Error updating page:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in updatePage:', error)
    throw error
  }
}

// Delete a page
export async function deletePage(id: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('pages').delete().eq('id', id)

    if (error) {
      console.error('Error deleting page:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deletePage:', error)
    throw error
  }
}

// Generate unique slug based on title
export async function generatePageSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  let slug = baseSlug
  let counter = 1

  while (true) {
    let query = supabaseAdmin.from('pages').select('id').eq('slug', slug)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query

    if (!data || data.length === 0) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

// Page Analytics Functions
export async function trackPageView(analyticsData: {
  page_path: string
  user_id?: string
  session_id?: string
  referrer?: string
  device_type?: string
  browser?: string
  country?: string
  duration_seconds?: number
}): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('page_analytics').insert(analyticsData)

    if (error) {
      console.error('Error tracking page view:', error)
      // Don't throw error for analytics - fail silently
    }
  } catch (error) {
    console.error('Error in trackPageView:', error)
    // Don't throw error for analytics - fail silently
  }
}

export async function getPageAnalytics(filters?: {
  page_path?: string
  start_date?: string
  end_date?: string
  limit?: number
}): Promise<{ data: PageAnalytics[]; total_views: number }> {
  try {
    let query = supabaseAdmin
      .from('page_analytics')
      .select(
        `
        *,
        user:profiles(id, full_name, email)
      `,
      )
      .order('created_at', { ascending: false })

    if (filters?.page_path) {
      query = query.eq('page_path', filters.page_path)
    }

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date)
    }

    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching page analytics:', error)
      throw error
    }

    return {
      data: data || [],
      total_views: count || 0,
    }
  } catch (error) {
    console.error('Error in getPageAnalytics:', error)
    throw error
  }
}
