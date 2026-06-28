/**
 * Comprehensive CMS API Service
 * Provides full CRUD operations for the CMS module with version control, SEO, and multilingual support
 */

import { createBrowserClient } from '@supabase/ssr'
import type {
  CMSContent,
  CMSContentVersion,
  CMSLanguage,
  CMSMedia,
  CMSMenuItem,
  CMSRole,
  CMSUserRole,
  CMSWorkflowHistory,
  CMSContentComment,
  CMSRedirect,
  CreateCMSContentDTO,
  UpdateCMSContentDTO,
  CMSContentFilters,
  PaginatedResponse,
} from './cms-types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const cmsClient = createBrowserClient(supabaseUrl, supabaseKey, {
  db: { schema: 'gurukul_main' },
})

// ============================================================================
// CMS CONTENT OPERATIONS
// ============================================================================

export const cmsContent = {
  /**
   * Get all content with filters and pagination
   */
  async getAll(
    filters: CMSContentFilters = {},
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<CMSContent>> {
    const from = (page - 1) * limit

    let query = cmsClient
      .from('cms_content')
      .select('*, language:cms_languages(*), og_image:cms_media(*)', { count: 'exact' })

    // Apply filters
    if (filters.content_type) query = query.eq('content_type', filters.content_type)
    if (filters.page_type) query = query.eq('page_type', filters.page_type)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.language_id) query = query.eq('language_id', filters.language_id)
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
    }
    if (filters.is_latest_version !== undefined) {
      query = query.eq('is_latest_version', filters.is_latest_version)
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at'
    const sortOrder = filters.sort_order || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const { data, count, error } = await query.range(from, from + limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    }
  },

  /**
   * Get published content (public-facing)
   */
  async getPublished(
    filters: CMSContentFilters = {},
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<CMSContent>> {
    return this.getAll(
      {
        ...filters,
        status: 'published',
        is_latest_version: true,
      },
      page,
      limit
    )
  },

  /**
   * Get content by ID
   */
  async getById(id: string): Promise<CMSContent | null> {
    const { data, error } = await cmsClient
      .from('cms_content')
      .select('*, language:cms_languages(*), og_image:cms_media(*)')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  /**
   * Get content by slug (for public pages)
   */
  async getBySlug(slug: string, languageCode = 'en'): Promise<CMSContent | null> {
    // First get the language ID
    const { data: language } = await cmsClient
      .from('cms_languages')
      .select('id')
      .eq('code', languageCode)
      .single()

    if (!language) throw new Error(`Language ${languageCode} not found`)

    const { data, error } = await cmsClient
      .from('cms_content')
      .select('*, language:cms_languages(*), og_image:cms_media(*)')
      .eq('slug', slug)
      .eq('language_id', language.id)
      .eq('status', 'published')
      .eq('is_latest_version', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    // Increment view count if found
    if (data) {
      await this.incrementViews(data.id)
    }

    return data || null
  },

  /**
   * Get content by page type (e.g., 'home', 'about')
   */
  async getByPageType(pageType: string, languageCode = 'en'): Promise<CMSContent | null> {
    const { data: language } = await cmsClient
      .from('cms_languages')
      .select('id')
      .eq('code', languageCode)
      .single()

    if (!language) throw new Error(`Language ${languageCode} not found`)

    const { data, error } = await cmsClient
      .from('cms_content')
      .select('*, language:cms_languages(*), og_image:cms_media(*)')
      .eq('page_type', pageType)
      .eq('language_id', language.id)
      .eq('status', 'published')
      .eq('is_latest_version', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  /**
   * Create new content
   */
  async create(content: CreateCMSContentDTO, userId: string): Promise<CMSContent> {
    const { data, error } = await cmsClient
      .from('cms_content')
      .insert({
        ...content,
        created_by: userId,
        updated_by: userId,
        published_at: content.status === 'published' ? new Date().toISOString() : null,
        version_number: 1,
        is_latest_version: true,
      })
      .select('*, language:cms_languages(*), og_image:cms_media(*)')
      .single()

    if (error) throw error

    // Create initial version history
    if (data) {
      await this.createVersion(data.id, data, userId, 'Initial version')
    }

    return data
  },

  /**
   * Update content
   */
  async update(id: string, updates: UpdateCMSContentDTO, userId: string): Promise<CMSContent> {
    const updateData: any = {
      ...updates,
      updated_by: userId,
    }

    // Update published_at if status changes to published
    if (updates.status === 'published') {
      updateData.published_at = new Date().toISOString()
      updateData.published_by = userId
    }

    const { data, error } = await cmsClient
      .from('cms_content')
      .update(updateData)
      .eq('id', id)
      .select('*, language:cms_languages(*), og_image:cms_media(*)')
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete content
   */
  async delete(id: string): Promise<void> {
    const { error } = await cmsClient.from('cms_content').delete().eq('id', id)
    if (error) throw error
  },

  /**
   * Publish content
   */
  async publish(id: string, userId: string): Promise<CMSContent> {
    const { data, error } = await cmsClient
      .from('cms_content')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: userId,
      })
      .eq('id', id)
      .select('*, language:cms_languages(*), og_image:cms_media(*)')
      .single()

    if (error) throw error

    // Log workflow history
    await cmsWorkflow.logAction(id, 'draft', 'published', 'published', userId)

    return data
  },

  /**
   * Unpublish content
   */
  async unpublish(id: string, userId: string): Promise<CMSContent> {
    const { data, error } = await cmsClient
      .from('cms_content')
      .update({
        status: 'draft',
      })
      .eq('id', id)
      .select('*, language:cms_languages(*), og_image:cms_media(*)')
      .single()

    if (error) throw error

    // Log workflow history
    await cmsWorkflow.logAction(id, 'published', 'draft', 'unpublished', userId)

    return data
  },

  /**
   * Schedule content for future publication
   */
  async schedule(id: string, scheduledAt: string, userId: string): Promise<CMSContent> {
    const { data, error } = await cmsClient
      .from('cms_content')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledAt,
        updated_by: userId,
      })
      .eq('id', id)
      .select('*, language:cms_languages(*), og_image:cms_media(*)')
      .single()

    if (error) throw error
    return data
  },

  /**
   * Increment view count
   */
  async incrementViews(id: string): Promise<void> {
    const { error } = await cmsClient.rpc('cms_increment_views', {
      p_content_id: id,
    })
    if (error) console.error('Failed to increment views:', error)
  },

  /**
   * Duplicate content
   */
  async duplicate(id: string, userId: string): Promise<CMSContent> {
    // Get original content
    const original = await this.getById(id)
    if (!original) throw new Error('Content not found')

    // Create duplicate with modified title and slug
    const duplicate: CreateCMSContentDTO = {
      content_type: original.content_type,
      page_type: original.page_type,
      slug: `${original.slug}-copy`,
      title: `${original.title} (Copy)`,
      content: original.content,
      seo_title: original.seo_title,
      seo_description: original.seo_description,
      seo_keywords: original.seo_keywords,
      language_id: original.language_id,
      status: 'draft',
      metadata: original.metadata,
      template: original.template,
    }

    return this.create(duplicate, userId)
  },

  /**
   * Create version history
   */
  async createVersion(
    contentId: string,
    content: CMSContent,
    userId: string,
    changeSummary: string
  ): Promise<void> {
    const { error } = await cmsClient.from('cms_content_versions').insert({
      content_id: contentId,
      version_number: content.version_number,
      title: content.title,
      content: content.content,
      seo_title: content.seo_title,
      seo_description: content.seo_description,
      seo_keywords: content.seo_keywords,
      metadata: content.metadata,
      change_summary: changeSummary,
      changed_by: userId,
    })

    if (error) throw error
  },

  /**
   * Get version history for content
   */
  async getVersionHistory(contentId: string): Promise<CMSContentVersion[]> {
    const { data, error } = await cmsClient
      .from('cms_content_versions')
      .select('*')
      .eq('content_id', contentId)
      .order('version_number', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Restore content from a specific version
   */
  async restoreVersion(
    contentId: string,
    versionNumber: number,
    userId: string
  ): Promise<CMSContent> {
    // Get the version
    const { data: version, error: versionError } = await cmsClient
      .from('cms_content_versions')
      .select('*')
      .eq('content_id', contentId)
      .eq('version_number', versionNumber)
      .single()

    if (versionError) throw versionError

    // Update content with version data
    return this.update(
      contentId,
      {
        title: version.title,
        content: version.content,
        seo_title: version.seo_title,
        seo_description: version.seo_description,
        seo_keywords: version.seo_keywords,
        metadata: version.metadata,
      },
      userId
    )
  },
}

// ============================================================================
// CMS MEDIA OPERATIONS
// ============================================================================

export const cmsMedia = {
  /**
   * Get all media with filters
   */
  async getAll(
    filters: {
      file_type?: string
      folder?: string
      search?: string
      tags?: string[]
    } = {},
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<CMSMedia>> {
    const from = (page - 1) * limit

    let query = cmsClient.from('cms_media').select('*', { count: 'exact' })

    if (filters.file_type) query = query.eq('file_type', filters.file_type)
    if (filters.folder) query = query.eq('folder', filters.folder)
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,filename.ilike.%${filters.search}%,alt_text.ilike.%${filters.search}%`
      )
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }

    query = query.order('created_at', { ascending: false })

    const { data, count, error } = await query.range(from, from + limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    }
  },

  /**
   * Get media by ID
   */
  async getById(id: string): Promise<CMSMedia | null> {
    const { data, error } = await cmsClient.from('cms_media').select('*').eq('id', id).single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  /**
   * Upload media (metadata only - actual upload handled separately)
   */
  async create(media: Partial<CMSMedia>, userId: string): Promise<CMSMedia> {
    const { data, error } = await cmsClient
      .from('cms_media')
      .insert({
        ...media,
        uploaded_by: userId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update media metadata
   */
  async update(id: string, updates: Partial<CMSMedia>): Promise<CMSMedia> {
    const { data, error } = await cmsClient
      .from('cms_media')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete media
   */
  async delete(id: string): Promise<void> {
    const { error } = await cmsClient.from('cms_media').delete().eq('id', id)
    if (error) throw error
  },

  /**
   * Get folders
   */
  async getFolders(): Promise<string[]> {
    const { data, error } = await cmsClient
      .from('cms_media')
      .select('folder')
      .not('folder', 'is', null)

    if (error) throw error

    const folders = [...new Set(data.map((item) => item.folder).filter(Boolean))]
    return folders as string[]
  },
}

// ============================================================================
// CMS MENU OPERATIONS
// ============================================================================

export const cmsMenu = {
  /**
   * Get menu items by location
   */
  async getByLocation(location: string, languageCode = 'en'): Promise<CMSMenuItem[]> {
    const { data: language } = await cmsClient
      .from('cms_languages')
      .select('id')
      .eq('code', languageCode)
      .single()

    if (!language) return []

    const { data, error } = await cmsClient
      .from('cms_menu_items')
      .select('*, content:cms_content(*)')
      .eq('menu_location', location)
      .eq('language_id', language.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create menu item
   */
  async create(menuItem: Partial<CMSMenuItem>): Promise<CMSMenuItem> {
    const { data, error } = await cmsClient
      .from('cms_menu_items')
      .insert(menuItem)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update menu item
   */
  async update(id: string, updates: Partial<CMSMenuItem>): Promise<CMSMenuItem> {
    const { data, error } = await cmsClient
      .from('cms_menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete menu item
   */
  async delete(id: string): Promise<void> {
    const { error } = await cmsClient.from('cms_menu_items').delete().eq('id', id)
    if (error) throw error
  },

  /**
   * Reorder menu items
   */
  async reorder(items: Array<{ id: string; sort_order: number }>): Promise<void> {
    const promises = items.map((item) =>
      cmsClient.from('cms_menu_items').update({ sort_order: item.sort_order }).eq('id', item.id)
    )

    await Promise.all(promises)
  },
}

// ============================================================================
// CMS LANGUAGE OPERATIONS
// ============================================================================

export const cmsLanguages = {
  /**
   * Get all languages
   */
  async getAll(): Promise<CMSLanguage[]> {
    const { data, error } = await cmsClient
      .from('cms_languages')
      .select('*')
      .eq('is_active', true)
      .order('code')

    if (error) throw error
    return data || []
  },

  /**
   * Get default language
   */
  async getDefault(): Promise<CMSLanguage | null> {
    const { data, error } = await cmsClient
      .from('cms_languages')
      .select('*')
      .eq('is_default', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },
}

// ============================================================================
// CMS WORKFLOW OPERATIONS
// ============================================================================

export const cmsWorkflow = {
  /**
   * Log workflow action
   */
  async logAction(
    contentId: string,
    fromStatus: string | null,
    toStatus: string,
    action: string,
    userId: string,
    comment?: string
  ): Promise<void> {
    const { error } = await cmsClient.from('cms_workflow_history').insert({
      content_id: contentId,
      from_status: fromStatus,
      to_status: toStatus,
      action,
      comment,
      performed_by: userId,
    })

    if (error) throw error
  },

  /**
   * Get workflow history for content
   */
  async getHistory(contentId: string): Promise<CMSWorkflowHistory[]> {
    const { data, error } = await cmsClient
      .from('cms_workflow_history')
      .select('*')
      .eq('content_id', contentId)
      .order('performed_at', { ascending: false })

    if (error) throw error
    return data || []
  },
}

// ============================================================================
// CMS COMMENTS OPERATIONS
// ============================================================================

export const cmsComments = {
  /**
   * Get comments for content
   */
  async getForContent(contentId: string): Promise<CMSContentComment[]> {
    const { data, error } = await cmsClient
      .from('cms_content_comments')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Add comment
   */
  async create(
    contentId: string,
    comment: string,
    userId: string,
    parentId?: string
  ): Promise<CMSContentComment> {
    const { data, error } = await cmsClient
      .from('cms_content_comments')
      .insert({
        content_id: contentId,
        comment,
        created_by: userId,
        parent_comment_id: parentId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Resolve comment
   */
  async resolve(id: string): Promise<void> {
    const { error } = await cmsClient
      .from('cms_content_comments')
      .update({ is_resolved: true })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Delete comment
   */
  async delete(id: string): Promise<void> {
    const { error } = await cmsClient.from('cms_content_comments').delete().eq('id', id)
    if (error) throw error
  },
}

// Export all as a single API object
export const cmsAPI = {
  content: cmsContent,
  media: cmsMedia,
  menu: cmsMenu,
  languages: cmsLanguages,
  workflow: cmsWorkflow,
  comments: cmsComments,
}

export default cmsAPI
