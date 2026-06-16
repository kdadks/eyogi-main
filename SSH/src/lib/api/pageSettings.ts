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

  // HomePage Hero Section
  home_hero_section_description?: string
  home_hero_badge_text?: string
  home_hero_badge_icon?: string
  home_hero_title?: string
  home_hero_title_highlight?: string
  home_hero_description?: string
  home_hero_image_url?: string
  home_hero_image_caption?: string
  home_hero_image_caption_description?: string
  home_hero_image_caption_icon?: string
  home_hero_background_type?: 'gradient' | 'image'
  home_hero_background_color?: string
  home_hero_background_image_url?: string
  home_hero_button_1_text?: string
  home_hero_button_1_link?: string
  home_hero_button_1_variant?: string
  home_hero_button_2_text?: string
  home_hero_button_2_link?: string
  home_hero_button_2_variant?: string
  home_hero_stats?: Array<{
    label: string
    value: string
    icon?: string
    color?: string
  }>
  home_hero_image_display_type?: string
  home_hero_image_border_radius?: number
  home_hero_layout?: string
  home_hero_title_font_size?: number
  home_hero_title_color?: string
  home_hero_description_font_size?: number
  home_hero_description_color?: string

  // HomePage Features Section
  home_features_section_description?: string
  home_features_visible?: boolean
  home_features_title?: string
  home_features_subtitle?: string
  home_features_background_color?: string
  home_features_box_1_title?: string
  home_features_box_1_description?: string
  home_features_box_1_image_url?: string
  home_features_box_1_icon?: string
  home_features_box_2_title?: string
  home_features_box_2_description?: string
  home_features_box_2_image_url?: string
  home_features_box_2_icon?: string
  home_features_box_3_title?: string
  home_features_box_3_description?: string
  home_features_box_3_image_url?: string
  home_features_box_3_icon?: string
  home_features_box_4_title?: string
  home_features_box_4_description?: string
  home_features_box_4_image_url?: string
  home_features_box_4_icon?: string
  home_features?: Array<{
    title: string
    description: string
    icon: string
    color?: string
  }>

  // HomePage Gurukuls Section
  home_gurukuls_section_description?: string
  home_gurukuls_visible?: boolean
  home_gurukuls_title?: string
  home_gurukuls_subtitle?: string
  home_gurukuls_background_color?: string
  home_gurukuls_item_type?: 'gurukuls' | 'courses'
  home_gurukuls_display_type?: 'all' | 'selected' | 'count'
  home_gurukuls_selected_ids?: string[]
  home_gurukuls_limit?: number
  home_gurukuls_columns_desktop?: number
  home_gurukuls_columns_tablet?: number
  home_gurukuls_columns_mobile?: number
  home_gurukuls_show_stats?: boolean
  home_gurukuls_button_text?: string
  home_gurukuls_button_link?: string

  // HomePage Testimonials Section
  home_testimonials_section_description?: string
  home_testimonials_visible?: boolean
  home_testimonials_title?: string
  home_testimonials_subtitle?: string
  home_testimonials_background_color?: string
  home_testimonials?: Array<{
    name: string
    role: string
    content: string
    rating: number
    image?: string
  }>
  home_testimonials_columns_desktop?: number
  home_testimonials_columns_tablet?: number

  // HomePage CTA Section
  home_cta_section_description?: string
  home_cta_visible?: boolean
  home_cta_title?: string
  home_cta_description?: string
  home_cta_background_type?: 'gradient' | 'image'
  home_cta_background_color?: string
  home_cta_background_image_url?: string
  home_cta_button_1_text?: string
  home_cta_button_1_link?: string
  home_cta_button_1_variant?: string
  home_cta_button_2_text?: string
  home_cta_button_2_link?: string
  home_cta_button_2_variant?: string
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

        if (error && error.code === 'PGRST116') {
          // Record doesn't exist, return empty object
          return { page_slug: slug, page_type: slug }
        }

        if (error) {
          console.error(
            'Failed to fetch page settings:',
            error.message || error.code || JSON.stringify(error),
          )
          return null
        }
        return data
      } catch (err) {
        console.error('Error in getPageSettings:', err)
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
    // First, get the current settings to ensure the record exists
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('page_settings')
      .select('*')
      .eq('page_slug', slug)

    if (fetchError || !existingData || existingData.length === 0) {
      throw new Error(`Page settings record not found for slug: ${slug}`)
    }

    // Filter updates to only include actual database columns
    const dbUpdates: Record<string, any> = {}

    // Copy base fields if they exist
    const baseFields = [
      'page_slug',
      'page_type',
      'hero_title',
      'hero_subtitle',
      'hero_description',
      'hero_image_url',
      'hero_background_color',
      'hero_text_color',
      'hero_cta_button_text',
      'hero_cta_button_link',
      'hero_cta_button_color',
      'stats_visible',
      'stats_items',
      'features_visible',
      'features_title',
      'features_subtitle',
      'features_items',
      'cta_visible',
      'cta_title',
      'cta_description',
      'cta_background_color',
      'cta_buttons',
      'section_order',
      'theme_primary_color',
      'theme_secondary_color',
      'show_breadcrumbs',
      'seo_title',
      'seo_description',
      'seo_keywords',
      'about_page_content', // JSONB column for about page
    ]

    // Add home page fields (all prefixed with home_)
    const homePageFields = Object.keys(updates).filter((key) => key.startsWith('home_'))

    for (const field of baseFields) {
      if (field in updates && updates[field as keyof PageSettings] !== undefined) {
        dbUpdates[field] = updates[field as keyof PageSettings]
      }
    }

    for (const field of homePageFields) {
      if (updates[field as keyof PageSettings] !== undefined) {
        dbUpdates[field] = updates[field as keyof PageSettings]
      }
    }

    // Only include timestamp if explicitly provided
    const updatePayload: Record<string, any> = { ...dbUpdates }
    if (userId) {
      updatePayload.updated_by = userId
    }
    updatePayload.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('page_settings')
      .update(updatePayload)
      .eq('page_slug', slug)
      .select()

    if (error) {
      console.error('Supabase update error:', { error, dbUpdates, updatePayload, slug })
      throw new Error(`Failed to update page settings: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('No page settings found to update')
    }

    // Invalidate cache
    queryCache.invalidatePattern(`page-settings:${slug}`)

    return data[0]
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

    if (error) {
      throw new Error(`Failed to create page settings: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to create page settings: no data returned')
    }

    // Invalidate cache
    queryCache.invalidatePattern('page-settings:.*')

    return data[0]
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

/**
 * Get gurukuls for HomePage with CMS display settings
 */
export async function getHomePageGurukuls(settings: PageSettings) {
  try {
    let query = supabaseAdmin.from('gurukuls').select('*')

    if (
      settings.home_gurukuls_display_type === 'selected' &&
      settings.home_gurukuls_selected_ids?.length
    ) {
      query = query.in('id', settings.home_gurukuls_selected_ids)
    } else if (settings.home_gurukuls_display_type === 'count') {
      query = query.limit(settings.home_gurukuls_limit || 6)
    }
    // 'all' displays all without limit

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching home page gurukuls:', error)
    return []
  }
}

/**
 * Add/remove gurukul from home page display
 */
export async function toggleGurukulInHome(
  gurukulId: string,
  add: boolean,
  slug: string = 'home',
  userId?: string,
) {
  try {
    const settings = await getPageSettings(slug)
    if (!settings) throw new Error('Page settings not found')

    const selectedIds = settings.home_gurukuls_selected_ids || []
    let updatedIds: string[]

    if (add) {
      updatedIds = [...new Set([...selectedIds, gurukulId])] // Avoid duplicates
    } else {
      updatedIds = selectedIds.filter((id) => id !== gurukulId)
    }

    return updatePageSettings(
      slug,
      {
        home_gurukuls_selected_ids: updatedIds,
        home_gurukuls_display_type: 'selected',
      },
      userId,
    )
  } catch (error) {
    console.error('Error toggling gurukul in home page:', error)
    throw error
  }
}

/**
 * Update home page feature items
 */
export async function updateHomeFeatures(
  features: PageSettings['home_features'],
  slug: string = 'home',
  userId?: string,
) {
  return updatePageSettings(slug, { home_features: features }, userId)
}

/**
 * Update home page testimonials
 */
export async function updateHomeTestimonials(
  testimonials: PageSettings['home_testimonials'],
  slug: string = 'home',
  userId?: string,
) {
  return updatePageSettings(slug, { home_testimonials: testimonials }, userId)
}

/**
 * Update home page hero stats
 */
export async function updateHomeHeroStats(
  stats: PageSettings['home_hero_stats'],
  slug: string = 'home',
  userId?: string,
) {
  return updatePageSettings(slug, { home_hero_stats: stats }, userId)
}

/**
 * Get formatted home page settings with dynamic sections
 */
export async function getFormattedHomePageSettings(slug: string = 'home') {
  const settings = await getPageSettings(slug)
  if (!settings) return null

  return {
    ...settings,
    gurukuls: settings.home_gurukuls_visible ? await getHomePageGurukuls(settings) : [],
  }
}

export { CACHE_DURATIONS }
