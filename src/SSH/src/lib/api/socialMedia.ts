import { supabaseAdmin } from '../supabase'

export interface SocialMediaLink {
  id: string
  platform: 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'instagram' | 'tiktok'
  url: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SocialMediaStats {
  total: number
  active: number
}

/**
 * Fetch all social media links from database
 */
export async function getSocialMediaLinksFromDB(): Promise<SocialMediaLink[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('social_media_links')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error(
        'Error fetching social media links:',
        error.message || error.code || JSON.stringify(error),
      )
      return []
    }

    return (data || []) as SocialMediaLink[]
  } catch (error) {
    console.error('Error in getSocialMediaLinksFromDB:', error)
    return []
  }
}

/**
 * Create a new social media link
 */
export async function createSocialMediaLinkInDB(
  linkData: Omit<SocialMediaLink, 'id' | 'created_at' | 'updated_at'>,
): Promise<SocialMediaLink | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('social_media_links')
      .insert({
        platform: linkData.platform,
        url: linkData.url,
        is_active: linkData.is_active,
        sort_order: linkData.sort_order,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating social media link:', error)
      throw error
    }

    return data as SocialMediaLink
  } catch (error) {
    console.error('Error in createSocialMediaLinkInDB:', error)
    throw error
  }
}

/**
 * Update a social media link
 */
export async function updateSocialMediaLinkInDB(
  id: string,
  updates: Partial<Omit<SocialMediaLink, 'id' | 'created_at' | 'updated_at'>>,
): Promise<SocialMediaLink | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('social_media_links')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating social media link:', error)
      throw error
    }

    return data as SocialMediaLink
  } catch (error) {
    console.error('Error in updateSocialMediaLinkInDB:', error)
    throw error
  }
}

/**
 * Delete a social media link
 */
export async function deleteSocialMediaLinkFromDB(id: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('social_media_links').delete().eq('id', id)

    if (error) {
      console.error('Error deleting social media link:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteSocialMediaLinkFromDB:', error)
    throw error
  }
}

/**
 * Update sort order for multiple social media links
 */
export async function updateSocialMediaLinksSortOrder(
  links: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  try {
    for (const link of links) {
      const { error } = await supabaseAdmin
        .from('social_media_links')
        .update({ sort_order: link.sort_order })
        .eq('id', link.id)

      if (error) {
        console.error('Error updating sort order:', error)
        throw error
      }
    }
  } catch (error) {
    console.error('Error in updateSocialMediaLinksSortOrder:', error)
    throw error
  }
}

/**
 * Toggle active status of a social media link
 */
export async function toggleSocialMediaLinkStatus(id: string, isActive: boolean): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('social_media_links')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) {
      console.error('Error toggling social media link status:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in toggleSocialMediaLinkStatus:', error)
    throw error
  }
}

/**
 * Get social media statistics
 */
export async function getSocialMediaStats(): Promise<SocialMediaStats> {
  try {
    const links = await getSocialMediaLinksFromDB()
    return {
      total: links.length,
      active: links.filter((l) => l.is_active).length,
    }
  } catch (error) {
    console.error('Error getting social media stats:', error)
    return { total: 0, active: 0 }
  }
}
