export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'student' | 'teacher' | 'admin'
          age: number | null
          phone: string | null
          country: string | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          parent_guardian_name: string | null
          parent_guardian_email: string | null
          parent_guardian_phone: string | null
          student_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'teacher' | 'admin'
          age?: number | null
          phone?: string | null
          country?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          parent_guardian_name?: string | null
          parent_guardian_email?: string | null
          parent_guardian_phone?: string | null
          student_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'teacher' | 'admin'
          age?: number | null
          phone?: string | null
          country?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          parent_guardian_name?: string | null
          parent_guardian_email?: string | null
          parent_guardian_phone?: string | null
          student_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      gurukuls: {
        Row: {
          id: string
          name: string
          slug: string
          description: string
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description: string
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          gurukul_id: string
          course_number: string
          title: string
          description: string
          level: 'elementary' | 'basic' | 'intermediate' | 'advanced'
          age_group_min: number
          age_group_max: number
          duration_weeks: number
          fee: number
          max_students: number
          delivery_method: 'physical' | 'remote' | 'hybrid'
          entry_requirements: string | null
          learning_outcomes: string[]
          syllabus: Json
          is_active: boolean
          teacher_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          gurukul_id: string
          course_number: string
          title: string
          description: string
          level: 'elementary' | 'basic' | 'intermediate' | 'advanced'
          age_group_min: number
          age_group_max: number
          duration_weeks: number
          fee: number
          max_students: number
          delivery_method: 'physical' | 'remote' | 'hybrid'
          entry_requirements?: string | null
          learning_outcomes: string[]
          syllabus: Json
          is_active?: boolean
          teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gurukul_id?: string
          course_number?: string
          title?: string
          description?: string
          level?: 'elementary' | 'basic' | 'intermediate' | 'advanced'
          age_group_min?: number
          age_group_max?: number
          duration_weeks?: number
          fee?: number
          max_students?: number
          delivery_method?: 'physical' | 'remote' | 'hybrid'
          entry_requirements?: string | null
          learning_outcomes?: string[]
          syllabus?: Json
          is_active?: boolean
          teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          course_id: string
          status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
          enrolled_at: string
          approved_at: string | null
          completed_at: string | null
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_id: string | null
          certificate_issued: boolean
          certificate_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
          enrolled_at?: string
          approved_at?: string | null
          completed_at?: string | null
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_id?: string | null
          certificate_issued?: boolean
          certificate_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
          enrolled_at?: string
          approved_at?: string | null
          completed_at?: string | null
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_id?: string | null
          certificate_issued?: boolean
          certificate_url?: string | null
          created_at?: string
          updated_at?: string
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
          certificate_data: Json
          file_url: string
          created_at: string
        }
        Insert: {
          id?: string
          enrollment_id: string
          student_id: string
          course_id: string
          certificate_number: string
          template_id: string
          issued_at?: string
          issued_by: string
          verification_code: string
          certificate_data: Json
          file_url: string
          created_at?: string
        }
        Update: {
          id?: string
          enrollment_id?: string
          student_id?: string
          course_id?: string
          certificate_number?: string
          template_id?: string
          issued_at?: string
          issued_by?: string
          verification_code?: string
          certificate_data?: Json
          file_url?: string
          created_at?: string
        }
      }
      certificate_templates: {
        Row: {
          id: string
          name: string
          type: 'student' | 'teacher'
          template_data: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'student' | 'teacher'
          template_data: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'student' | 'teacher'
          template_data?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_student_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      user_role: 'student' | 'teacher' | 'admin'
      course_level: 'elementary' | 'basic' | 'intermediate' | 'advanced'
      enrollment_status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
      delivery_method: 'physical' | 'remote' | 'hybrid'
    }
  }
}
