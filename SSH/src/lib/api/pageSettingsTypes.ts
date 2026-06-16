/**
 * Page-specific CMS settings interfaces
 * These are organized by page type to keep PageSettings interface clean
 * Each page type has its own dedicated interface
 */

// ==================== ABOUT PAGE ====================
export interface AboutPageSettings {
  // Hero Section
  about_hero_title?: string
  about_hero_title_highlight?: string
  about_hero_description?: string
  about_hero_button_1_text?: string
  about_hero_button_1_link?: string
  about_hero_button_2_text?: string
  about_hero_button_2_link?: string

  // Mission Section
  about_mission_title?: string
  about_mission_description_1?: string
  about_mission_description_2?: string
  about_mission_image_url?: string
  about_mission_highlight_title?: string
  about_mission_highlight_description?: string

  // Stats Section
  about_stats_visible?: boolean
  about_stats_title?: string
  about_stats_subtitle?: string
  about_stats?: Array<{
    number: string
    label: string
  }>

  // Values Section
  about_values_visible?: boolean
  about_values_title?: string
  about_values_subtitle?: string
  about_values?: Array<{
    title: string
    description: string
    icon: string
  }>

  // Team Section
  about_team_visible?: boolean
  about_team_title?: string
  about_team_subtitle?: string
  about_team_members?: Array<{
    name: string
    role: string
    bio: string
    image_url: string
  }>

  // Vision Section
  about_vision_title?: string
  about_vision_description?: string
  about_vision_items?: Array<{
    title: string
    description: string
    icon: string
  }>

  // CTA Section
  about_cta_visible?: boolean
  about_cta_title?: string
  about_cta_description?: string
  about_cta_button_1_text?: string
  about_cta_button_1_link?: string
  about_cta_button_2_text?: string
  about_cta_button_2_link?: string
}

// ==================== COURSES PAGE ====================
export interface CoursesPageSettings {
  courses_hero_title?: string
  courses_hero_description?: string
  courses_hero_image_url?: string
  courses_filter_visible?: boolean
  courses_sort_visible?: boolean
  courses_display_type?: 'grid' | 'list'
  courses_per_page?: number
  courses_columns_desktop?: number
}

// ==================== GURUKULS PAGE ====================
export interface GurukulPageSettings {
  gurukuls_hero_title?: string
  gurukuls_hero_description?: string
  gurukuls_hero_image_url?: string
  gurukuls_display_type?: 'grid' | 'list'
  gurukuls_per_page?: number
  gurukuls_columns_desktop?: number
}

// ==================== CONTACT PAGE ====================
export interface ContactPageSettings {
  contact_hero_title?: string
  contact_hero_description?: string
  contact_form_visible?: boolean
  contact_form_fields?: Array<{
    name: string
    type: string
    required: boolean
    placeholder?: string
  }>
  contact_office_title?: string
  contact_office_addresses?: Array<{
    location: string
    address: string
    phone: string
    email: string
  }>
  contact_social_links?: Array<{
    platform: string
    url: string
  }>
}

// ==================== Generic Type Union ====================
export type PageSettingsTypeMap = {
  home: Record<string, never> // Home page has its own dedicated fields in PageSettings
  about: AboutPageSettings
  courses: CoursesPageSettings
  gurukuls: GurukulPageSettings
  contact: ContactPageSettings
}

/**
 * Helper type to get the specific settings for a page type
 * Usage: GetPageSettingsType<'about'> returns AboutPageSettings
 */
export type GetPageSettingsType<T extends keyof PageSettingsTypeMap> = PageSettingsTypeMap[T]
