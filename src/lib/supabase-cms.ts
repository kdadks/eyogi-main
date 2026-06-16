// ============================================
// SUPABASE DATABASE UTILITIES
// CRUD operations for CMS entities
// ============================================

import { createClient } from '@supabase/supabase-js'
import type {
  User,
  Page,
  Post,
  Category,
  Form,
  FormSubmission,
  Setting,
  Menu,
  CreatePageDTO,
  UpdatePageDTO,
  CreatePostDTO,
  UpdatePostDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateFormDTO,
  UpdateFormDTO,
  CreateFormSubmissionDTO,
  UpdateFormSubmissionDTO,
  CreateSettingDTO,
  UpdateSettingDTO,
  CreateMenuDTO,
  UpdateMenuDTO,
  PaginatedResponse,
} from '@/types/cms'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// PAGES OPERATIONS
// ============================================

export const pages = {
  async getPublished(limit: number = 10, page: number = 1): Promise<PaginatedResponse<Page>> {
    const from = (page - 1) * limit

    const { data, count, error } = await supabase
      .from('pages')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(from, from + limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    }
  },

  async getBySlug(slug: string): Promise<Page | null> {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async getById(id: string): Promise<Page | null> {
    const { data, error } = await supabase.from('pages').select('*').eq('id', id).single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async create(page: CreatePageDTO, userId: string): Promise<Page> {
    const { data, error } = await supabase
      .from('pages')
      .insert({
        ...page,
        created_by: userId,
        published_at: page.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: UpdatePageDTO, userId: string): Promise<Page> {
    const { data, error } = await supabase
      .from('pages')
      .update({
        ...updates,
        updated_by: userId,
        published_at: updates.status === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('pages').delete().eq('id', id)

    if (error) throw error
  },
}

// ============================================
// POSTS OPERATIONS
// ============================================

export const posts = {
  async getPublished(
    limit: number = 10,
    page: number = 1,
    categoryId?: string,
  ): Promise<PaginatedResponse<Post>> {
    const from = (page - 1) * limit

    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

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

  async getFeatured(limit: number = 5): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .eq('featured', true)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  async getBySlug(slug: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async getById(id: string): Promise<Post | null> {
    const { data, error } = await supabase.from('posts').select('*').eq('id', id).single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async create(post: CreatePostDTO, userId: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...post,
        created_by: userId,
        published_at: post.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: UpdatePostDTO, userId: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .update({
        ...updates,
        updated_by: userId,
        published_at: updates.status === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async incrementViewCount(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_post_views', {
      post_id: id,
    })

    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('posts').delete().eq('id', id)

    if (error) throw error
  },
}

// ============================================
// CATEGORIES OPERATIONS
// ============================================

export const categories = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').order('name')

    if (error) throw error
    return data || []
  },

  async getBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async create(category: CreateCategoryDTO, userId: string): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...category, created_by: userId })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: UpdateCategoryDTO): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (error) throw error
  },
}

// ============================================
// FORMS OPERATIONS
// ============================================

export const forms = {
  async getActive(): Promise<Form[]> {
    const { data, error } = await supabase.from('forms').select('*').eq('status', 'active')

    if (error) throw error
    return data || []
  },

  async getBySlug(slug: string): Promise<Form | null> {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async getById(id: string): Promise<Form | null> {
    const { data, error } = await supabase.from('forms').select('*').eq('id', id).single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async create(form: CreateFormDTO, userId: string): Promise<Form> {
    const { data, error } = await supabase
      .from('forms')
      .insert({ ...form, created_by: userId })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: UpdateFormDTO, userId: string): Promise<Form> {
    const { data, error } = await supabase
      .from('forms')
      .update({ ...updates, updated_by: userId })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('forms').delete().eq('id', id)

    if (error) throw error
  },
}

// ============================================
// FORM SUBMISSIONS OPERATIONS
// ============================================

export const formSubmissions = {
  async getByFormId(
    formId: string,
    limit: number = 20,
    page: number = 1,
  ): Promise<PaginatedResponse<FormSubmission>> {
    const from = (page - 1) * limit

    const { data, count, error } = await supabase
      .from('form_submissions')
      .select('*', { count: 'exact' })
      .eq('form_id', formId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    }
  },

  async create(submission: CreateFormSubmissionDTO): Promise<FormSubmission> {
    const { data, error } = await supabase
      .from('form_submissions')
      .insert(submission)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: UpdateFormSubmissionDTO): Promise<FormSubmission> {
    const { data, error } = await supabase
      .from('form_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('form_submissions').delete().eq('id', id)

    if (error) throw error
  },
}

// ============================================
// SETTINGS OPERATIONS
// ============================================

export const settings = {
  async get(key: string): Promise<any> {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).single()

    if (error && error.code !== 'PGRST116') throw error
    return data?.value ?? null
  },

  async getAll(): Promise<Record<string, any>> {
    const { data, error } = await supabase.from('settings').select('key, value')

    if (error) throw error

    return (data || []).reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {})
  },

  async set(key: string, value: any, description?: string): Promise<Setting> {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ key, value, description }, { onConflict: 'key' })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(key: string): Promise<void> {
    const { error } = await supabase.from('settings').delete().eq('key', key)

    if (error) throw error
  },
}

// ============================================
// MENUS OPERATIONS
// ============================================

export const menus = {
  async getByLocation(location: string): Promise<Menu | null> {
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('location', location)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async getAll(): Promise<Menu[]> {
    const { data, error } = await supabase.from('menus').select('*')

    if (error) throw error
    return data || []
  },

  async create(menu: CreateMenuDTO, userId: string): Promise<Menu> {
    const { data, error } = await supabase
      .from('menus')
      .insert({ ...menu, created_by: userId })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: UpdateMenuDTO, userId: string): Promise<Menu> {
    const { data, error } = await supabase
      .from('menus')
      .update({ ...updates, updated_by: userId })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('menus').delete().eq('id', id)

    if (error) throw error
  },
}
