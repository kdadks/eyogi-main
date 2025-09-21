import { createClient } from '@supabase/supabase-js'

// Type definitions for complex objects
interface Address {
  street?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
}

interface EmergencyContact {
  name?: string
  relationship?: string
  phone?: string
  email?: string
}

interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  notifications?: {
    email?: boolean
    push?: boolean
    sms?: boolean
  }
  privacy?: {
    profile_visibility?: 'public' | 'private' | 'friends'
    show_email?: boolean
    show_phone?: boolean
  }
}

interface BrandColors {
  primary?: string
  secondary?: string
  accent?: string
  background?: string
  text?: string
}

interface CourseSyllabus {
  modules?: Array<{
    title?: string
    description?: string
    lessons?: string[]
    duration?: string
  }>
  objectives?: string[]
  prerequisites?: string[]
  assessment_criteria?: string[]
}

interface CourseResources {
  videos?: string[]
  documents?: string[]
  links?: string[]
  assignments?: string[]
  quizzes?: string[]
}

interface CertificateData {
  template_id?: string
  student_name?: string
  course_title?: string
  completion_date?: string
  grade?: string
  instructor_name?: string
  certificate_number?: string
  verification_url?: string
}

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
    detectSessionInUrl: false, // Disable URL detection to prevent conflicts
    storageKey: 'eyogi-ssh-app-auth-v2', // Updated unique storage key
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
          role: 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent'
          status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
          date_of_birth: string | null
          phone: string | null
          address: Address | null
          emergency_contact: EmergencyContact | null
          preferences: UserPreferences
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
          role?: 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent'
          status?: 'active' | 'inactive' | 'suspended' | 'pending_verification'
          date_of_birth?: string | null
          phone?: string | null
          address?: Address | null
          emergency_contact?: EmergencyContact | null
          preferences?: UserPreferences
          avatar_url?: string | null
          student_id?: string | null
          teacher_id?: string | null
          parent_id?: string | null
        }
        Update: {
          email?: string
          full_name?: string
          role?: 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent'
          status?: 'active' | 'inactive' | 'suspended' | 'pending_verification'
          date_of_birth?: string | null
          phone?: string | null
          address?: Address | null
          emergency_contact?: EmergencyContact | null
          preferences?: UserPreferences
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
          brand_colors: BrandColors
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
          brand_colors?: BrandColors
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
          brand_colors?: BrandColors
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
          syllabus: CourseSyllabus | null
          resources: CourseResources
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
          syllabus?: CourseSyllabus | null
          resources?: CourseResources
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
          syllabus?: CourseSyllabus | null
          resources?: CourseResources
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
          certificate_data: CertificateData
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
          certificate_data: CertificateData
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
          certificate_data?: CertificateData
          file_url?: string
        }
      }
      course_assignments: {
        Row: {
          id: string
          teacher_id: string
          course_id: string
          assigned_by: string | null
          assigned_at: string
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          teacher_id: string
          course_id: string
          assigned_by?: string | null
          assigned_at?: string
          is_active?: boolean
          notes?: string | null
        }
        Update: {
          teacher_id?: string
          course_id?: string
          assigned_by?: string | null
          assigned_at?: string
          is_active?: boolean
          notes?: string | null
        }
      }
      // Add other table types as needed...
    }
  }
}
