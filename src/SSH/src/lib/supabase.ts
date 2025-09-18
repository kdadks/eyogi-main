import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for regular user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'eyogi-ssh-admin-console-auth', // Very unique storage key
  },
})

// Admin client with service role key (bypasses RLS) - NO AUTH PERSISTENCE
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        // No storageKey to prevent auth conflicts
      },
    })
  : supabase

// Database types (generated from Supabase schema)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          password_hash: string | null
          full_name: string
          role: 'student' | 'teacher' | 'admin' | 'super_admin' | 'parent'
          status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
          date_of_birth: string | null
          phone: string | null
          address: Record<string, any> | null
          emergency_contact: Record<string, any> | null
          preferences: Record<string, any>
          avatar_url: string | null
          student_id: string | null
          teacher_id: string | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          password_hash?: string | null
          full_name: string
          role?: 'student' | 'teacher' | 'admin' | 'super_admin' | 'parent'
          status?: 'active' | 'inactive' | 'suspended' | 'pending_verification'
          date_of_birth?: string | null
          phone?: string | null
          address?: Record<string, any> | null
          emergency_contact?: Record<string, any> | null
          preferences?: Record<string, any>
          avatar_url?: string | null
          student_id?: string | null
          teacher_id?: string | null
          parent_id?: string | null
        }
        Update: {
          email?: string
          full_name?: string
          role?: 'student' | 'teacher' | 'admin' | 'super_admin' | 'parent'
          status?: 'active' | 'inactive' | 'suspended' | 'pending_verification'
          date_of_birth?: string | null
          phone?: string | null
          address?: Record<string, any> | null
          emergency_contact?: Record<string, any> | null
          preferences?: Record<string, any>
          avatar_url?: string | null
          student_id?: string | null
          teacher_id?: string | null
          parent_id?: string | null
        }
      }
      gurukuls: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          cover_image_url: string | null
          brand_colors: any
          is_active: boolean
          sort_order: number
          meta_title: string | null
          meta_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          cover_image_url?: string | null
          brand_colors?: any
          is_active?: boolean
          sort_order?: number
          meta_title?: string | null
          meta_description?: string | null
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          cover_image_url?: string | null
          brand_colors?: any
          is_active?: boolean
          sort_order?: number
          meta_title?: string | null
          meta_description?: string | null
        }
      }
      courses: {
        Row: {
          id: string
          gurukul_id: string
          title: string
          slug: string
          course_number: string
          description: string | null
          detailed_description: string | null
          level: 'elementary' | 'basic' | 'intermediate' | 'advanced'
          age_group_min: number | null
          age_group_max: number | null
          duration_weeks: number
          duration_hours: number | null
          delivery_method: 'physical' | 'remote' | 'hybrid'
          price: number
          currency: string
          max_students: number
          min_students: number
          prerequisites: string[] | null
          learning_outcomes: string[] | null
          includes_certificate: boolean
          certificate_template_id: string | null
          image_url: string | null
          cover_image_url: string | null
          video_preview_url: string | null
          syllabus: any | null
          resources: any
          is_active: boolean
          featured: boolean
          tags: string[] | null
          meta_title: string | null
          meta_description: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          gurukul_id: string
          title: string
          slug: string
          course_number: string
          description?: string | null
          detailed_description?: string | null
          level: 'elementary' | 'basic' | 'intermediate' | 'advanced'
          age_group_min?: number | null
          age_group_max?: number | null
          duration_weeks?: number
          duration_hours?: number | null
          delivery_method?: 'physical' | 'remote' | 'hybrid'
          price?: number
          currency?: string
          max_students?: number
          min_students?: number
          prerequisites?: string[] | null
          learning_outcomes?: string[] | null
          includes_certificate?: boolean
          certificate_template_id?: string | null
          image_url?: string | null
          cover_image_url?: string | null
          video_preview_url?: string | null
          syllabus?: any | null
          resources?: any
          is_active?: boolean
          featured?: boolean
          tags?: string[] | null
          meta_title?: string | null
          meta_description?: string | null
          created_by?: string | null
        }
        Update: {
          gurukul_id?: string
          title?: string
          slug?: string
          course_number?: string
          description?: string | null
          detailed_description?: string | null
          level?: 'elementary' | 'basic' | 'intermediate' | 'advanced'
          age_group_min?: number | null
          age_group_max?: number | null
          duration_weeks?: number
          duration_hours?: number | null
          delivery_method?: 'physical' | 'remote' | 'hybrid'
          price?: number
          currency?: string
          max_students?: number
          min_students?: number
          prerequisites?: string[] | null
          learning_outcomes?: string[] | null
          includes_certificate?: boolean
          certificate_template_id?: string | null
          image_url?: string | null
          cover_image_url?: string | null
          video_preview_url?: string | null
          syllabus?: any | null
          resources?: any
          is_active?: boolean
          featured?: boolean
          tags?: string[] | null
          meta_title?: string | null
          meta_description?: string | null
          created_by?: string | null
        }
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          course_id: string
          teacher_id: string | null
          status: 'pending' | 'approved' | 'rejected' | 'completed' | 'withdrawn'
          enrolled_at: string
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          progress_percentage: number
          final_grade: string | null
          certificate_issued_at: string | null
          certificate_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          student_id: string
          course_id: string
          teacher_id?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'withdrawn'
          enrolled_at?: string
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          progress_percentage?: number
          final_grade?: string | null
          certificate_issued_at?: string | null
          certificate_url?: string | null
          notes?: string | null
        }
        Update: {
          student_id?: string
          course_id?: string
          teacher_id?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'withdrawn'
          enrolled_at?: string
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          progress_percentage?: number
          final_grade?: string | null
          certificate_issued_at?: string | null
          certificate_url?: string | null
          notes?: string | null
        }
      }
      certificates: {
        Row: {
          id: string
          enrollment_id: string
          student_id: string
          course_id: string
          certificate_number: string
          template_id: string
          issued_at: string
          issued_by: string
          verification_code: string
          certificate_data: any
          file_url: string
          created_at: string
        }
        Insert: {
          id: string
          enrollment_id: string
          student_id: string
          course_id: string
          certificate_number: string
          template_id: string
          issued_at: string
          issued_by: string
          verification_code: string
          certificate_data: any
          file_url: string
          created_at: string
        }
        Update: {
          enrollment_id?: string
          student_id?: string
          course_id?: string
          certificate_number?: string
          template_id?: string
          issued_at?: string
          issued_by?: string
          verification_code?: string
          certificate_data?: any
          file_url?: string
        }
      }
      // Add other table types as needed...
    }
  }
}
