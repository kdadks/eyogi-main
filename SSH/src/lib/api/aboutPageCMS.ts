import { supabaseAdmin } from '../supabase'
import { queryCache, CACHE_DURATIONS, createCacheKey } from '../cache'

/**
 * About Page CMS Settings - from dedicated about_page_cms table
 */
export interface AboutPageCMSSettings {
  id: string
  page_slug: string
  page_type: string

  // Hero Section
  hero_title?: string
  hero_title_highlight?: string
  hero_description?: string
  hero_button_1_text?: string
  hero_button_1_link?: string
  hero_button_2_text?: string
  hero_button_2_link?: string
  hero_bg_type?: 'color' | 'image'
  hero_bg_color?: string
  hero_bg_image_url?: string

  // Mission Section
  mission_title?: string
  mission_description?: string
  mission_image_url?: string
  mission_image_caption_title?: string
  mission_image_caption_description?: string
  mission_image_caption_icon?: string
  mission_bg_type?: 'color' | 'image'
  mission_bg_color?: string
  mission_bg_image_url?: string

  // Stats Section
  stats_visible?: boolean
  stats_title?: string
  stats_subtitle?: string
  stats_items?: Array<{
    number: string
    label: string
  }>
  stats_bg_type?: 'color' | 'image'
  stats_bg_color?: string
  stats_bg_image_url?: string

  // Values Section
  values_visible?: boolean
  values_title?: string
  values_subtitle?: string
  values_items?: Array<{
    title: string
    description: string
    icon: string
  }>
  values_bg_type?: 'color' | 'image'
  values_bg_color?: string
  values_bg_image_url?: string

  // Team Section
  team_visible?: boolean
  team_title?: string
  team_subtitle?: string
  team_members?: Array<{
    name: string
    role: string
    bio: string
    image_url: string
  }>
  team_bg_type?: 'color' | 'image'
  team_bg_color?: string
  team_bg_image_url?: string

  // Vision Section
  vision_title?: string
  vision_description?: string
  vision_items?: Array<{
    title: string
    description: string
    icon: string
  }>
  vision_bg_type?: 'color' | 'image'
  vision_bg_color?: string
  vision_bg_image_url?: string

  // CTA Section
  cta_visible?: boolean
  cta_title?: string
  cta_description?: string
  cta_button_1_text?: string
  cta_button_1_link?: string
  cta_button_2_text?: string
  cta_button_2_link?: string
  cta_bg_type?: 'color' | 'image'
  cta_bg_color?: string
  cta_bg_image_url?: string

  // Audit
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

/**
 * Get About Page CMS settings
 */
export async function getAboutPageCMS(
  slug: string = 'about',
): Promise<AboutPageCMSSettings | null> {
  const cacheKey = createCacheKey('about-page-cms', slug)

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('about_page_cms')
          .select('*')
          .eq('page_slug', slug)

        if (error) {
          console.error('Failed to fetch about page CMS:', error)
          return null
        }

        if (!data || data.length === 0) {
          return null
        }

        return data[0]
      } catch (err) {
        console.error('Error in getAboutPageCMS:', err)
        return null
      }
    },
    CACHE_DURATIONS.COURSES, // 1 day cache
  )
}

/**
 * Update About Page CMS settings
 */
export async function updateAboutPageCMS(
  updates: Partial<AboutPageCMSSettings>,
  slug: string = 'about',
  userId?: string,
): Promise<AboutPageCMSSettings> {
  try {
    // First, verify the record exists
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('about_page_cms')
      .select('*')
      .eq('page_slug', slug)

    if (fetchError || !existingData || existingData.length === 0) {
      throw new Error(`About page CMS record not found for slug: ${slug}`)
    }

    // Prepare update payload - exclude id, created_at, created_by
    const updatePayload: Record<string, unknown> = {}

    // Copy all fields except system fields and old deprecated fields
    const systemFields = ['id', 'page_slug', 'page_type', 'created_at', 'created_by']
    const deprecatedFields = [
      'mission_description_1',
      'mission_description_2',
      'mission_highlight_title',
      'mission_highlight_description',
    ] // Old column names that were dropped

    for (const [key, value] of Object.entries(updates)) {
      if (!systemFields.includes(key) && !deprecatedFields.includes(key) && value !== undefined) {
        updatePayload[key] = value
      }
    }

    // Add audit fields
    if (userId) {
      updatePayload.updated_by = userId
    }
    updatePayload.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('about_page_cms')
      .update(updatePayload)
      .eq('page_slug', slug)
      .select()

    if (error) {
      console.error('Supabase update error:', { error, updatePayload, slug })
      throw new Error(`Failed to update about page CMS: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('No about page CMS record found to update')
    }

    // Invalidate cache
    queryCache.invalidatePattern(`about-page-cms:${slug}`)

    return data[0]
  } catch (error) {
    console.error('Error updating about page CMS:', error)
    throw error
  }
}

/**
 * Create About Page CMS settings
 */
export async function createAboutPageCMS(
  settings: Omit<AboutPageCMSSettings, 'id' | 'created_at' | 'updated_at'>,
  userId?: string,
): Promise<AboutPageCMSSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from('about_page_cms')
      .insert({
        ...settings,
        created_by: userId,
        updated_by: userId,
      })
      .select()

    if (error) {
      throw new Error(`Failed to create about page CMS: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to create about page CMS: no data returned')
    }

    // Invalidate cache
    queryCache.invalidatePattern('about-page-cms:.*')

    return data[0]
  } catch (error) {
    console.error('Error creating about page CMS:', error)
    throw error
  }
}

/**
 * Get all about page CMS records
 */
export async function getAllAboutPageCMS(): Promise<AboutPageCMSSettings[]> {
  try {
    const { data, error } = await supabaseAdmin.from('about_page_cms').select('*')

    if (error) {
      console.error('Failed to fetch all about page CMS:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error in getAllAboutPageCMS:', err)
    return []
  }
}

/**
 * Delete About Page CMS settings
 */
export async function deleteAboutPageCMS(slug: string = 'about'): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('about_page_cms').delete().eq('page_slug', slug)

    if (error) {
      throw new Error(`Failed to delete about page CMS: ${error.message}`)
    }

    // Invalidate cache
    queryCache.invalidatePattern(`about-page-cms:${slug}`)

    return true
  } catch (error) {
    console.error('Error deleting about page CMS:', error)
    throw error
  }
}

/**
 * Reset about page CMS to defaults
 */
export async function resetAboutPageCMS(userId?: string): Promise<AboutPageCMSSettings> {
  const defaults: Partial<AboutPageCMSSettings> = {
    page_slug: 'about',
    page_type: 'about',
    hero_title: 'About Us',
    hero_title_highlight: 'Our Mission & Vision',
    hero_description: 'Discover our story, values, and commitment to excellence.',
    stats_visible: true,
    stats_title: 'Our Impact',
    stats_subtitle: 'Numbers that speak volumes',
    values_visible: true,
    values_title: 'Our Core Values',
    values_subtitle: 'What drives us forward',
    team_visible: true,
    team_title: 'Our Team',
    team_subtitle: 'Meet the people behind our mission',
    vision_title: 'Our Vision',
    vision_description: 'A world where education transforms lives.',
    cta_visible: true,
    cta_title: 'Join Our Journey',
    cta_description: 'Be part of something meaningful',
  }

  return updateAboutPageCMS(defaults, 'about', userId)
}
