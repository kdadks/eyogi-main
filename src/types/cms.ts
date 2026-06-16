// ============================================
// CMS TYPES & INTERFACES
// Generated from gurukul_main schema
// ============================================

export type UserRole = 'admin' | 'editor' | 'contributor' | 'viewer'
export type UserStatus = 'active' | 'inactive' | 'suspended'
export type ContentStatus = 'draft' | 'published' | 'archived'
export type FormStatus = 'active' | 'inactive' | 'archived'
export type SubmissionStatus = 'new' | 'read' | 'replied'

// ============================================
// USERS
// ============================================
export interface User {
  id: string
  email: string
  full_name?: string
  role: UserRole
  status: UserStatus
  avatar_url?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  last_login_at?: string
}

export interface CreateUserDTO {
  email: string
  full_name?: string
  role?: UserRole
  avatar_url?: string
  metadata?: Record<string, any>
}

export interface UpdateUserDTO {
  full_name?: string
  avatar_url?: string
  status?: UserStatus
  metadata?: Record<string, any>
}

// ============================================
// CATEGORIES
// ============================================
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreateCategoryDTO {
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
}

export interface UpdateCategoryDTO {
  name?: string
  slug?: string
  description?: string
  color?: string
  icon?: string
}

// ============================================
// PAGES
// ============================================
export interface Page {
  id: string
  title: string
  slug: string
  content?: string
  excerpt?: string
  status: ContentStatus
  featured_image_id?: string
  meta_title?: string
  meta_description?: string
  og_image?: string
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
  published_at?: string
}

export interface CreatePageDTO {
  title: string
  slug: string
  content?: string
  excerpt?: string
  status?: ContentStatus
  featured_image_id?: string
  meta_title?: string
  meta_description?: string
  og_image?: string
}

export interface UpdatePageDTO {
  title?: string
  slug?: string
  content?: string
  excerpt?: string
  status?: ContentStatus
  featured_image_id?: string
  meta_title?: string
  meta_description?: string
  og_image?: string
}

// ============================================
// POSTS
// ============================================
export interface Post {
  id: string
  title: string
  slug: string
  content?: string
  excerpt?: string
  status: ContentStatus
  category_id?: string
  featured_image_id?: string
  featured: boolean
  view_count: number
  meta_title?: string
  meta_description?: string
  og_image?: string
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
  published_at?: string
}

export interface CreatePostDTO {
  title: string
  slug: string
  content?: string
  excerpt?: string
  status?: ContentStatus
  category_id?: string
  featured_image_id?: string
  featured?: boolean
  meta_title?: string
  meta_description?: string
  og_image?: string
}

export interface UpdatePostDTO {
  title?: string
  slug?: string
  content?: string
  excerpt?: string
  status?: ContentStatus
  category_id?: string
  featured_image_id?: string
  featured?: boolean
  meta_title?: string
  meta_description?: string
  og_image?: string
}

// ============================================
// FORMS
// ============================================
export interface FormField {
  name: string
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file'
  label: string
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: string }>
  validation?: Record<string, any>
}

export interface Form {
  id: string
  name: string
  slug: string
  title?: string
  description?: string
  schema: FormField[]
  status: FormStatus
  notification_email?: string
  redirect_url?: string
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface CreateFormDTO {
  name: string
  slug: string
  title?: string
  description?: string
  schema: FormField[]
  status?: FormStatus
  notification_email?: string
  redirect_url?: string
}

export interface UpdateFormDTO {
  name?: string
  slug?: string
  title?: string
  description?: string
  schema?: FormField[]
  status?: FormStatus
  notification_email?: string
  redirect_url?: string
}

// ============================================
// FORM SUBMISSIONS
// ============================================
export interface FormSubmission {
  id: string
  form_id: string
  data: Record<string, any>
  submitter_email?: string
  submitter_name?: string
  ip_address?: string
  user_agent?: string
  status: SubmissionStatus
  created_at: string
  updated_at: string
}

export interface CreateFormSubmissionDTO {
  form_id: string
  data: Record<string, any>
  submitter_email?: string
  submitter_name?: string
}

export interface UpdateFormSubmissionDTO {
  status?: SubmissionStatus
}

// ============================================
// SETTINGS
// ============================================
export interface Setting {
  id: string
  key: string
  value?: any
  description?: string
  data_type: 'string' | 'number' | 'boolean' | 'json'
  created_at: string
  updated_at: string
}

export interface CreateSettingDTO {
  key: string
  value?: any
  description?: string
  data_type?: 'string' | 'number' | 'boolean' | 'json'
}

export interface UpdateSettingDTO {
  value?: any
  description?: string
}

// ============================================
// MENUS
// ============================================
export interface MenuItem {
  label: string
  url?: string
  page_id?: string
  children?: MenuItem[]
  target?: '_blank' | '_self'
  title?: string
}

export interface Menu {
  id: string
  name: string
  location: string
  items: MenuItem[]
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface CreateMenuDTO {
  name: string
  location: string
  items: MenuItem[]
}

export interface UpdateMenuDTO {
  name?: string
  items?: MenuItem[]
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}
