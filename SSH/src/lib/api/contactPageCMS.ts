import { supabase, supabaseAdmin } from '../supabase'

export interface ContactInfoItem {
  icon: string
  title: string
  details: string
  description: string
}

export interface FAQItem {
  question: string
  answer: string
}

export interface ContactPageCMSSettings {
  id?: string
  page_slug: string
  page_type: string

  // Hero Section
  hero_title: string
  hero_title_highlight: string
  hero_description: string
  hero_bg_type?: 'color' | 'image'
  hero_bg_color?: string
  hero_bg_image_url?: string

  // Contact Info Cards
  contact_info_items: ContactInfoItem[]
  contact_info_bg_type?: 'color' | 'image'
  contact_info_bg_color?: string
  contact_info_bg_image_url?: string

  // Contact Form Section
  form_visible: boolean
  form_title: string
  form_description: string
  form_bg_type?: 'color' | 'image'
  form_bg_color?: string
  form_bg_image_url?: string

  // FAQ Section
  faq_visible: boolean
  faq_title: string
  faq_items: FAQItem[]
  faq_bg_type?: 'color' | 'image'
  faq_bg_color?: string
  faq_bg_image_url?: string

  // Help Card
  help_card_visible: boolean
  help_card_title: string
  help_card_description: string
  help_card_button_text: string
  help_card_button_link: string

  // CTA Section
  cta_visible: boolean
  cta_title: string
  cta_description: string
  cta_button_1_text: string
  cta_button_1_link: string
  cta_button_2_text: string
  cta_button_2_link: string
  cta_bg_type?: 'color' | 'image'
  cta_bg_color?: string
  cta_bg_image_url?: string

  // Metadata
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

/**
 * Fetch contact page CMS settings
 */
export async function getContactPageCMS(
  slug: string = 'contact',
): Promise<ContactPageCMSSettings | null> {
  try {
    const { data, error } = await supabase
      .from('contact_page_cms')
      .select('*')
      .eq('page_slug', slug)
      .single()

    if (error) {
      console.error('Error fetching contact page CMS:', error)
      return null
    }

    return data as ContactPageCMSSettings
  } catch (error) {
    console.error('Error in getContactPageCMS:', error)
    return null
  }
}

/**
 * Update contact page CMS settings (admin only)
 */
export async function updateContactPageCMS(
  settings: Partial<ContactPageCMSSettings>,
  slug: string = 'contact',
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('contact_page_cms')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('page_slug', slug)

    if (error) {
      console.error('Error updating contact page CMS:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateContactPageCMS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create a new contact page CMS record (admin only)
 */
export async function createContactPageCMS(
  settings: Partial<ContactPageCMSSettings>,
): Promise<{ success: boolean; data?: ContactPageCMSSettings; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('contact_page_cms')
      .insert([settings])
      .select()
      .single()

    if (error) {
      console.error('Error creating contact page CMS:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as ContactPageCMSSettings }
  } catch (error) {
    console.error('Error in createContactPageCMS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
