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
  role: 'student' | 'teacher' | 'admin' | 'super_admin' | 'parent'
  status?: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  date_of_birth?: string | null
  phone?: string | null
  address?: Address | null
  emergency_contact?: EmergencyContact | null
  preferences?: UserPreferences
  student_id?: string | null
  teacher_id?: string | null
  parent_id?: string | null
  created_at: string
  updated_at: string
}

export interface Gurukul {
  id: string
  name: string
  slug: string
  description: string
  image_url?: string
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
  syllabus: object | null
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
  certificate_issued: boolean
  certificate_url?: string
  created_at: string
  updated_at: string
  course?: Course
  student?: User
}

export interface Certificate {
  id: string
  enrollment_id: string
  student_id: string
  course_id: string
  certificate_number: string
  template_id: string
  issued_at: string
  issued_by: string
  verification_code: string
  certificate_data: object
  file_url: string
  created_at: string
  course?: Course
  student?: User
}

export interface CertificateTemplate {
  id: string
  name: string
  type: 'student' | 'teacher'
  template_data: object
  is_active: boolean
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
