export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'student' | 'teacher' | 'admin'
  age?: number
  phone?: string
  address?: string
  parent_guardian_name?: string
  parent_guardian_email?: string
  parent_guardian_phone?: string
  student_id?: string
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
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  gurukul_id: string
  course_number: string
  title: string
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
  issue_date: string
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
