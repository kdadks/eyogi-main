import { supabaseAdmin } from '../supabase'
import { queryCache, CACHE_DURATIONS, createCacheKey } from '../cache'

export interface PageSettings {
  id: string
  page_slug: string
  page_type: 'gurukuls' | 'courses' | 'home' | 'about' | 'contact'
  hero_title?: string
  hero_subtitle?: string
  hero_description?: string
  hero_image_url?: string
  hero_background_color?: string
  hero_text_color?: string
  hero_cta_button_text?: string
  hero_cta_button_link?: string
  hero_cta_button_color?: string
  stats_visible?: boolean
  stats_items?: Array<{
    label: string
    value: string
    icon?: string
  }>
  features_visible?: boolean
  features_title?: string
  features_subtitle?: string
  features_items?: Array<{
    title: string
    description: string
    icon?: string
  }>
  cta_visible?: boolean
  cta_title?: string
  cta_description?: string
  cta_background_color?: string
  cta_buttons?: Array<{
    text: string
    link: string
    variant: 'primary' | 'secondary' | 'outline'
  }>
  section_order?: string[]
  theme_primary_color?: string
  theme_secondary_color?: string
  show_breadcrumbs?: boolean
  seo_title?: string
  seo_description?: string
  seo_keywords?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

/**
 * Get page settings by slug
 */
export async function getPageSettings(slug: string): Promise<PageSettings | null> {
  const cacheKey = createCacheKey('page-settings', slug)

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('page_settings')
          .select('*')
          .eq('page_slug', slug)
          .single()

        if (error) {
          return null
        }
        return data
      } catch {
        return null
      }
    },
    CACHE_DURATIONS.COURSES, // 1 day (same as courses)
  )
}

/**
 * Get all page settings
 */
export async function getAllPageSettings(): Promise<PageSettings[]> {
  const cacheKey = createCacheKey('page-settings', 'all')

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabaseAdmin.from('page_settings').select('*')

        if (error) {
          return []
        }
        return data || []
      } catch {
        return []
      }
    },
    CACHE_DURATIONS.COURSES, // 1 day (same as courses)
  )
}

/**
 * Update page settings
 */
export async function updatePageSettings(
  slug: string,
  updates: Partial<PageSettings>,
  userId?: string,
): Promise<PageSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from('page_settings')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('page_slug', slug)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update page settings: ${error.message}`)
    }

    // Invalidate cache
    queryCache.invalidatePattern(`page-settings:${slug}`)

    return data
  } catch (error) {
    console.error('Error updating page settings:', error)
    throw error
  }
}

/**
 * Create new page settings
 */
export async function createPageSettings(
  settings: Omit<PageSettings, 'id' | 'created_at' | 'updated_at'>,
  userId?: string,
): Promise<PageSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from('page_settings')
      .insert({
        ...settings,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create page settings: ${error.message}`)
    }

    // Invalidate cache
    queryCache.invalidatePattern('page-settings:.*')

    return data
  } catch (error) {
    console.error('Error creating page settings:', error)
    throw error
  }
}

/**
 * Get page settings with audit history
 */
export async function getPageSettingsWithAudit(slug: string) {
  try {
    const [settings, audit] = await Promise.all([
      supabaseAdmin.from('page_settings').select('*').eq('page_slug', slug).single(),
      supabaseAdmin
        .from('page_settings_audit')
        .select(
          `
        *,
        changed_by_user:profiles!changed_by(id, full_name, email)
      `,
        )
        .eq(
          'page_settings_id',
          (await supabaseAdmin.from('page_settings').select('id').eq('page_slug', slug).single())
            .data?.id || '',
        )
        .order('changed_at', { ascending: false })
        .limit(50),
    ])

    return {
      settings: settings.data,
      audit: audit.data || [],
    }
  } catch (error) {
    console.error('Error fetching page settings with audit:', error)
    throw error
  }
}

/**
 * Duplicate page settings
 */
export async function duplicatePageSettings(
  sourceSlug: string,
  targetSlug: string,
  userId?: string,
): Promise<PageSettings> {
  try {
    const source = await getPageSettings(sourceSlug)
    if (!source) {
      throw new Error(`Source page settings not found: ${sourceSlug}`)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, created_by, updated_by, ...settingsData } = source

    return createPageSettings(
      {
        ...settingsData,
        page_slug: targetSlug,
      },
      userId,
    )
  } catch (error) {
    console.error('Error duplicating page settings:', error)
    throw error
  }
}

/**
 * Reset page settings to defaults
 */
export async function resetPageSettings(slug: string, userId?: string): Promise<PageSettings> {
  const defaults: Record<string, Partial<PageSettings>> = {
    gurukuls: {
      hero_title: 'Explore Our Gurukuls',
      hero_description:
        'Each Gurukul specializes in different aspects of Vedic knowledge, offering comprehensive learning paths designed for students of all ages.',
      features_title: 'Why Choose Our Gurukuls?',
      features_subtitle:
        'Our specialized approach ensures deep, authentic learning in each domain of Vedic knowledge.',
      cta_title: 'Ready to Begin Your Journey?',
      cta_description:
        'Choose your path of learning and connect with the timeless wisdom of Vedic traditions.',
    },
  }

  const defaultSettings = defaults[slug] || {}

  return updatePageSettings(slug, defaultSettings, userId)
}

export { CACHE_DURATIONS }
