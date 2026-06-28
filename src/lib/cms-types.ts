/**
 * TypeScript type definitions for the Comprehensive CMS Module
 */

// ============================================================================
// ENUMS
// ============================================================================

export type CMSContentType = 'page' | 'section' | 'component' | 'block'

export type CMSPageType =
  | 'home'
  | 'about'
  | 'faq'
  | 'membership'
  | 'contact'
  | 'donation'
  | 'hinduism'
  | 'forms'
  | 'custom'

export type CMSStatus = 'draft' | 'pending_review' | 'scheduled' | 'published' | 'archived'

export type CMSFileType = 'image' | 'video' | 'document' | 'audio' | 'other'

export type CMSMenuLocation = 'header' | 'footer' | 'mobile' | 'sidebar'

// ============================================================================
// CORE TYPES
// ============================================================================

export interface CMSLanguage {
  id: string
  code: string
  name: string
  native_name?: string
  is_default: boolean
  is_active: boolean
  direction: 'ltr' | 'rtl'
  created_at: string
  updated_at: string
}

export interface CMSMedia {
  id: string
  title?: string
  filename: string
  file_path: string
  file_url: string
  file_size?: number
  mime_type?: string
  file_type?: CMSFileType
  width?: number
  height?: number
  alt_text?: string
  caption?: string
  description?: string
  metadata: Record<string, any>
  uploaded_by?: string
  folder?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface CMSContent {
  id: string
  content_type: CMSContentType
  page_type?: CMSPageType
  slug: string
  title: string
  content: Record<string, any>
  
  // SEO
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  og_image_id?: string
  og_title?: string
  og_description?: string
  canonical_url?: string
  
  // Status
  status: CMSStatus
  published_at?: string
  scheduled_at?: string
  archived_at?: string
  
  // Language
  language_id: string
  parent_id?: string
  
  // Hierarchy
  parent_content_id?: string
  sort_order: number
  
  // Metadata
  metadata: Record<string, any>
  template?: string
  
  // Versioning
  version_number: number
  is_latest_version: boolean
  
  // Authors
  created_by?: string
  updated_by?: string
  published_by?: string
  
  // Analytics
  views: number
  last_viewed_at?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations (populated)
  language?: CMSLanguage
  og_image?: CMSMedia
}

export interface CMSContentVersion {
  id: string
  content_id: string
  version_number: number
  title: string
  content: Record<string, any>
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  metadata: Record<string, any>
  change_summary?: string
  changed_by?: string
  changed_at: string
  diff?: Record<string, any>
}

export interface CMSMenuItem {
  id: string
  menu_location: CMSMenuLocation | string
  label: string
  url?: string
  content_id?: string
  target: '_self' | '_blank'
  icon?: string
  parent_id?: string
  sort_order: number
  is_active: boolean
  language_id: string
  css_class?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  
  // Relations
  content?: CMSContent
  children?: CMSMenuItem[]
}

export interface CMSRedirect {
  id: string
  from_path: string
  to_path: string
  redirect_type: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CMSRole {
  id: string
  name: string
  display_name: string
  description?: string
  permissions: Record<string, string[]>
  created_at: string
  updated_at: string
}

export interface CMSUserRole {
  id: string
  user_id: string
  role_id: string
  assigned_by?: string
  assigned_at: string
  expires_at?: string
}

export interface CMSWorkflowHistory {
  id: string
  content_id: string
  from_status?: CMSStatus
  to_status: CMSStatus
  action: string
  comment?: string
  performed_by?: string
  performed_at: string
}

export interface CMSContentComment {
  id: string
  content_id: string
  parent_comment_id?: string
  comment: string
  is_resolved: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateCMSContentDTO {
  content_type: CMSContentType
  page_type?: CMSPageType
  slug: string
  title: string
  content: Record<string, any>
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  og_image_id?: string
  og_title?: string
  og_description?: string
  canonical_url?: string
  status?: CMSStatus
  scheduled_at?: string
  language_id: string
  parent_id?: string
  parent_content_id?: string
  sort_order?: number
  metadata?: Record<string, any>
  template?: string
}

export interface UpdateCMSContentDTO {
  title?: string
  slug?: string
  content?: Record<string, any>
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  og_image_id?: string
  og_title?: string
  og_description?: string
  canonical_url?: string
  status?: CMSStatus
  scheduled_at?: string
  parent_content_id?: string
  sort_order?: number
  metadata?: Record<string, any>
  template?: string
}

export interface CMSContentFilters {
  content_type?: CMSContentType
  page_type?: CMSPageType
  status?: CMSStatus
  language_id?: string
  search?: string
  is_latest_version?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface CMSStats {
  total_content: number
  published: number
  drafts: number
  scheduled: number
  archived: number
  total_views: number
  total_media: number
  total_media_size: number
}

// ============================================================================
// CONTENT BLOCK TYPES (for flexible page building)
// ============================================================================

export interface ContentBlock {
  id: string
  type: string
  data: Record<string, any>
  settings?: Record<string, any>
}

// Common block types
export interface HeroBlock extends ContentBlock {
  type: 'hero'
  data: {
    title: string
    subtitle?: string
    description?: string
    background_image?: string
    cta_primary?: {
      text: string
      url: string
      action?: string
    }
    cta_secondary?: {
      text: string
      url: string
    }
    overlay_opacity?: number
  }
}

export interface TextBlock extends ContentBlock {
  type: 'text'
  data: {
    content: string
    format?: 'html' | 'markdown' | 'plain'
  }
}

export interface ImageBlock extends ContentBlock {
  type: 'image'
  data: {
    image_id: string
    image_url: string
    alt_text: string
    caption?: string
    link?: string
    size?: 'small' | 'medium' | 'large' | 'full'
    alignment?: 'left' | 'center' | 'right'
  }
}

export interface VideoBlock extends ContentBlock {
  type: 'video'
  data: {
    video_url: string
    video_id?: string
    provider?: 'youtube' | 'vimeo' | 'self-hosted'
    thumbnail?: string
    autoplay?: boolean
    controls?: boolean
  }
}

export interface FeatureGridBlock extends ContentBlock {
  type: 'feature_grid'
  data: {
    title?: string
    features: Array<{
      icon?: string
      title: string
      description: string
      link?: string
    }>
    columns?: number
  }
}

export interface TestimonialBlock extends ContentBlock {
  type: 'testimonial'
  data: {
    quote: string
    author: string
    role?: string
    avatar?: string
    rating?: number
  }
}

export interface CTABlock extends ContentBlock {
  type: 'cta'
  data: {
    title: string
    description?: string
    button_text: string
    button_url: string
    background_color?: string
    text_color?: string
  }
}

export interface FAQBlock extends ContentBlock {
  type: 'faq'
  data: {
    title?: string
    items: Array<{
      question: string
      answer: string
    }>
  }
}

export interface FormBlock extends ContentBlock {
  type: 'form'
  data: {
    form_id: string
    title?: string
    description?: string
  }
}

export interface CarouselBlock extends ContentBlock {
  type: 'carousel'
  data: {
    slides: Array<{
      image: string
      title?: string
      description?: string
      link?: string
    }>
    autoplay?: boolean
    interval?: number
  }
}

// Union type of all block types
export type AnyContentBlock =
  | HeroBlock
  | TextBlock
  | ImageBlock
  | VideoBlock
  | FeatureGridBlock
  | TestimonialBlock
  | CTABlock
  | FAQBlock
  | FormBlock
  | CarouselBlock
  | ContentBlock

// ============================================================================
// PAGE TEMPLATE TYPES
// ============================================================================

export interface PageTemplate {
  id: string
  name: string
  description?: string
  thumbnail?: string
  structure: AnyContentBlock[]
  metadata?: Record<string, any>
}

export interface HomePageContent {
  hero: HeroBlock
  features?: FeatureGridBlock
  about?: TextBlock
  testimonials?: TestimonialBlock[]
  cta?: CTABlock
  [key: string]: any
}

export interface AboutPageContent {
  hero?: HeroBlock
  mission?: TextBlock
  vision?: TextBlock
  values?: FeatureGridBlock
  team?: Array<{
    name: string
    role: string
    bio: string
    image?: string
    social?: Record<string, string>
  }>
  history?: TextBlock
  [key: string]: any
}

export interface FAQPageContent {
  hero?: HeroBlock
  categories: Array<{
    name: string
    faqs: Array<{
      question: string
      answer: string
    }>
  }>
  [key: string]: any
}

// ============================================================================
// COMPONENT TYPES (Header, Footer, etc.)
// ============================================================================

export interface HeaderContent {
  logo?: {
    image_url: string
    text: string
    link: string
  }
  navigation: CMSMenuItem[]
  cta_button?: {
    text: string
    url: string
    style?: string
  }
  search_enabled?: boolean
  sticky?: boolean
  theme?: 'light' | 'dark' | 'auto'
}

export interface FooterContent {
  logo?: {
    image_url: string
    text: string
  }
  description?: string
  columns: Array<{
    title: string
    links: Array<{
      text: string
      url: string
    }>
  }>
  social_links?: Array<{
    platform: string
    url: string
    icon: string
  }>
  copyright?: string
  newsletter?: {
    enabled: boolean
    title?: string
    description?: string
    button_text?: string
  }
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Re-export for convenience
  CMSLanguage as Language,
  CMSMedia as Media,
  CMSContent as Content,
  CMSContentVersion as ContentVersion,
  CMSMenuItem as MenuItem,
  CMSRedirect as Redirect,
  CMSRole as Role,
  CMSUserRole as UserRole,
  CMSWorkflowHistory as WorkflowHistory,
  CMSContentComment as ContentComment,
}
