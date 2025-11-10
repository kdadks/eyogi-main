export interface Address {
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}
export interface EmergencyContact {
  name?: string
  relationship?: string
  phone?: string
  email?: string
}
export interface UserPreferences {
  language?: string
  notifications?: {
    email?: boolean
    sms?: boolean
    push?: boolean
  }
  accessibility?: {
    large_text?: boolean
    high_contrast?: boolean
    reduced_motion?: boolean
  }
}
export interface User {
  id: string
  email: string
  password_hash?: string | null
  full_name?: string | null
  avatar_url?: string | null
  role: 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent'
  status?: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  date_of_birth?: string | null
  phone?: string | null
  address_line_1?: string | null
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
  emergency_contact?: EmergencyContact | null
  preferences?: UserPreferences
  age?: number | null
  student_id?: string | null
  teacher_id?: string | null
  parent_id?: string | null
  parent_guardian_name?: string | null
  parent_guardian_email?: string | null
  parent_guardian_phone?: string | null
  created_at: string
  updated_at: string
}
export interface Gurukul {
  id: string
  name: string
  slug: string
  description: string
  image_url?: string
  cover_image_url?: string
  is_active: boolean
  sort_order?: number
  created_at: string
  updated_at: string
}
export interface Course {
  id: string
  gurukul_id: string
  course_number: string
  title: string
  slug?: string // Unique URL slug for the course
  description: string
  detailed_description?: string
  level: 'elementary' | 'basic' | 'intermediate' | 'advanced'
  age_group_min: number
  age_group_max: number
  duration_weeks: number
  duration_hours?: number
  price: number
  currency: string
  max_students: number
  min_students?: number
  delivery_method: 'physical' | 'remote' | 'hybrid'
  prerequisites?: string | null
  prerequisite_courses?: string[] // Array of course IDs that must be completed
  prerequisite_skills?: string[] // Array of skill requirements
  prerequisite_level?: 'elementary' | 'basic' | 'intermediate' | 'advanced' // Minimum level required
  learning_outcomes: string[]
  includes_certificate?: boolean
  certificate_template_id?: string
  image_url?: string
  cover_image_url?: string
  video_preview_url?: string
  syllabus: Syllabus | null
  resources?: Array<{ name: string; url: string; type: string }>
  is_active: boolean
  featured?: boolean
  tags?: string[]
  meta_title?: string
  meta_description?: string
  created_by?: string
  teacher_id?: string
  created_at: string
  updated_at: string
  gurukul?: Gurukul
  teacher?: User
  enrolled_count?: number
}
export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  enrolled_at: string
  approved_at?: string
  completed_at?: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_id?: string
  // certificate_issued: boolean  // Moved to certificates table
  // certificate_url?: string  // Moved to certificates table
  progress_percentage?: number
  final_grade?: string
  created_at: string
  updated_at: string
  course?: Course
  student?: User
}
export interface Certificate {
  id: string
  certificate_number: string
  student_id: string
  course_id: string
  template_id?: string | null
  teacher_id?: string | null
  title: string
  completion_date: string
  issue_date?: string | null
  certificate_data?: object | null
  file_url?: string | null
  verification_code?: string | null
  is_verified?: boolean | null
  downloaded_at?: string | null
  shared_count?: number | null
  metadata?: object | null
  created_at: string
  updated_at: string
  is_active?: boolean | null
  // Extended properties for UI compatibility
  enrollment_id?: string // For backward compatibility
  issued_at?: string // Alias for issue_date for backward compatibility
  issued_by?: string // For backward compatibility
  course?: Course
  student?: User
  teacher?: User
}
export interface CertificateTemplate {
  id: string
  name: string
  type: 'student' | 'teacher'
  template_data: {
    design?: {
      colors?: {
        primary?: string
        secondary?: string
        text?: string
      }
      layout?: {
        orientation?: 'portrait' | 'landscape'
        size?: 'a4' | 'letter'
      }
    }
    logos?: {
      eyogi_logo_url?: string
      eyogi_logo_data?: string // Base64 image data
      ssh_logo_url?: string
      ssh_logo_data?: string // Base64 image data
    }
    signatures?: {
      vice_chancellor_signature_url?: string
      vice_chancellor_signature_data?: string // Base64 image data
      president_signature_url?: string
      president_signature_data?: string // Base64 image data
    }
    seal?: {
      official_seal_url?: string
      official_seal_data?: string // Base64 image data
    }
    placeholders?: {
      student_name?: boolean
      student_id?: boolean
      course_name?: boolean
      course_id?: boolean
      gurukul_name?: boolean
      completion_date?: boolean
      certificate_number?: boolean
      verification_code?: boolean
    }
    custom_text?: {
      title?: string
      subtitle?: string
      header_text?: string
      footer_text?: string
    }
    assignments?: {
      gurukul_id?: string
      course_id?: string
      assigned_at?: string
    }
  }
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}
export interface DashboardStats {
  total_students: number
  total_courses: number
  total_enrollments: number
  total_certificates: number
  recent_enrollments: Enrollment[]
  popular_courses: Course[]
}
export interface PrerequisiteCheckResult {
  canEnroll: boolean
  missingPrerequisites: {
    courses: Array<{
      id: string
      title: string
      completion_status: 'not_enrolled' | 'pending' | 'in_progress' | 'not_completed'
    }>
    skills: string[]
    level: {
      required: string
      current: string
    } | null
  }
  message: string
}
export interface CourseProgress {
  course_id: string
  student_id: string
  progress_percentage: number
  completed_modules: string[]
  total_modules: number
  last_accessed: string
  completion_status: 'not_started' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}
export interface CourseAssignment {
  id: string
  teacher_id: string
  course_id: string
  assigned_by?: string
  assigned_at: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
  course?: Course
  teacher?: User
  assigned_by_user?: User
}
// Database profile type (from Supabase)
export type Profile = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  date_of_birth: string | null
  address: Address | null
  emergency_contact: EmergencyContact | null
  preferences: UserPreferences | null
  role: 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent'
  student_id: string | null
  teacher_id: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
}
export interface Syllabus {
  classes?: Array<{
    number: number
    title: string
    topics: string[]
    duration: string
  }>
}

// Batch Management Interfaces
export interface Batch {
  id: string
  name: string
  description?: string | null
  gurukul_id: string
  teacher_id?: string | null
  course_id?: string | null
  start_date?: string | null
  end_date?: string | null
  max_students?: number | null
  status: 'not_started' | 'active' | 'in_progress' | 'completed' | 'archived'
  certificates_issued?: boolean
  progress_percentage?: number // Calculated percentage based on completed weeks
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Extended properties for UI
  gurukul?: Gurukul
  teacher?: User
  students?: User[]
  courses?: Course[]
  course?: Course
  student_count?: number
  course_count?: number
  progress?: BatchProgress[] // Weekly progress records
}

export interface BatchStudent {
  id: string
  batch_id: string
  student_id: string
  assigned_by: string
  assigned_at: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Extended properties for UI
  student?: User
  batch?: Batch
  assigned_by_user?: User
}

export interface BatchCourse {
  id: string
  batch_id: string
  course_id: string
  assigned_by: string
  assigned_at: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Extended properties for UI
  course?: Course
  batch?: Batch
  assigned_by_user?: User
}

export interface BatchProgress {
  id: string
  batch_id: string
  week_number: number
  is_completed: boolean
  updated_by?: string
  completed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface BatchStudentWithInfo extends BatchStudent {
  name: string
  email: string
  batch_name: string
  course_title: string
  progress_percentage?: number
}

export interface StudentBatchProgress {
  batch: {
    id: string
    name: string
    description?: string
    status: string
    start_date?: string
    end_date?: string
    progress_percentage?: number
    gurukul?: {
      id: string
      name: string
      slug: string
    }
  }
  assigned_at: string
  progress: BatchProgress[]
  courses: {
    course_id: string
    courses: Course
  }[]
  total_weeks: number
  completed_weeks: number
  progress_percentage: number
}

export interface Permission {
  id: string
  name: string
  description?: string | null
  resource: string
  action: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  // Extended properties for UI
  created_by_user?: User
}

export interface UserPermission {
  id: string
  user_id: string
  permission_id: string
  granted_by: string
  granted_at: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Extended properties for UI
  user?: User
  permission?: Permission
  granted_by_user?: User
}

export interface Page {
  id: string
  title: string
  slug: string
  content: Record<string, unknown> // JSONB content from database
  page_type: string
  gurukul_id?: string
  is_published: boolean
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  featured_image_url?: string
  template?: string
  sort_order?: number
  created_by?: string
  published_by?: string
  published_at?: string
  created_at: string
  updated_at: string
  // Extended properties for UI
  created_by_user?: User
  published_by_user?: User
  gurukul?: {
    id: string
    name: string
    slug: string
  }
}

export interface PageAnalytics {
  id: string
  page_path: string
  user_id?: string
  session_id?: string
  referrer?: string
  device_type?: string
  browser?: string
  country?: string
  duration_seconds?: number
  created_at: string
  // Extended properties for UI
  user?: User
}
