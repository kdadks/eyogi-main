// =========================================================================
// PARENTS DASHBOARD DATABASE TYPES
// =========================================================================
// TypeScript interfaces for the new parent dashboard database tables
// =========================================================================

import type {
  Course,
  Gurukul,
  Enrollment,
  Certificate,
  Address,
  EmergencyContact,
  UserPreferences,
} from './index'

// JSON data types for metadata
export type ActivityMetadata = Record<string, string | number | boolean | null>
export type AchievementCriteria = Record<string, string | number | boolean | null>
export type StudySessionActivity = {
  type: string
  duration_minutes?: number
  content?: string
}

export interface ParentChildRelationship {
  id: string
  parent_id: string
  child_id: string
  relationship_type: 'parent' | 'guardian' | 'authorized_user'
  permissions: {
    view_progress: boolean
    manage_courses: boolean
    view_assignments: boolean
    contact_teachers: boolean
  }
  is_primary_contact: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChildLearningActivity {
  id: string
  child_id: string
  course_id?: string
  activity_type:
    | 'course_enrollment'
    | 'lesson_completion'
    | 'assignment_submission'
    | 'quiz_completion'
    | 'certificate_earned'
    | 'achievement_unlocked'
    | 'login'
    | 'study_session'
    | 'homework_completed'
  activity_title: string
  activity_description?: string
  points_earned: number
  duration_minutes?: number
  metadata: ActivityMetadata
  created_at: string
}

export interface ChildAssignment {
  id: string
  child_id: string
  course_id: string
  assignment_title: string
  assignment_description?: string
  assignment_type:
    | 'homework'
    | 'project'
    | 'quiz'
    | 'exam'
    | 'presentation'
    | 'reading'
    | 'practice'
  due_date?: string
  assigned_date: string
  submitted_date?: string
  status: 'pending' | 'in_progress' | 'submitted' | 'graded' | 'overdue' | 'excused'
  grade?: number
  teacher_feedback?: string
  submission_url?: string
  estimated_duration_minutes?: number
  difficulty_level: 'easy' | 'medium' | 'hard'
  tags: string[]
  created_at: string
  updated_at: string
}

export interface ChildAchievement {
  id: string
  child_id: string
  course_id?: string
  achievement_type:
    | 'certificate'
    | 'badge'
    | 'milestone'
    | 'streak'
    | 'perfect_score'
    | 'improvement'
    | 'participation'
    | 'leadership'
    | 'creativity'
  achievement_title: string
  achievement_description?: string
  icon_url?: string
  points_value: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  criteria_met?: AchievementCriteria
  earned_date: string
  is_public: boolean
  metadata: ActivityMetadata
  created_at: string
}

export interface ChildStudySession {
  id: string
  child_id: string
  course_id?: string
  session_start: string
  session_end?: string
  duration_minutes?: number
  activities: StudySessionActivity[]
  focus_score?: number
  notes?: string
  created_at: string
}

export interface ParentDashboardStats {
  parent_id: string
  child_id: string
  child_name: string
  student_id: string
  avatar_url?: string
  total_enrolled_courses: number
  completed_courses: number
  active_courses: number
  total_assignments: number
  pending_assignments: number
  submitted_assignments: number
  overdue_assignments: number
  total_achievements: number
  certificates_earned: number
  badges_earned: number
  total_points: number
  active_learning_days: number
  last_activity_date?: string
  average_grade?: number
  total_study_minutes: number
}

// Enhanced child profile with dashboard data
export interface ChildProfile {
  // Basic profile information
  id: string
  email: string
  full_name: string
  student_id: string
  avatar_url?: string
  date_of_birth?: string
  age?: number
  phone?: string
  address?: Address
  emergency_contact?: EmergencyContact
  preferences?: UserPreferences
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  parent_id?: string
  created_at: string
  updated_at: string

  // Dashboard-specific data
  relationship?: ParentChildRelationship
  stats?: ParentDashboardStats
  recent_activities?: ChildLearningActivity[]
  pending_assignments?: ChildAssignment[]
  recent_achievements?: ChildAchievement[]
  current_courses?: (Course & { progress?: number })[]
  study_streak?: number
  weekly_study_minutes?: number
}

// API response types for parent dashboard
export interface ParentDashboardData {
  parent: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  children: ChildProfile[]
  summary: {
    total_children: number
    total_active_courses: number
    total_pending_assignments: number
    total_recent_achievements: number
    combined_study_minutes: number
    average_grade_across_children: number
  }
}

// Request types for managing children
export interface AddChildRequest {
  child_email: string
  relationship_type?: 'parent' | 'guardian' | 'authorized_user'
  is_primary_contact?: boolean
  permissions?: {
    view_progress?: boolean
    manage_courses?: boolean
    view_assignments?: boolean
    contact_teachers?: boolean
  }
}

export interface CreateChildAssignmentRequest {
  child_id: string
  course_id: string
  assignment_title: string
  assignment_description?: string
  assignment_type?: ChildAssignment['assignment_type']
  due_date?: string
  estimated_duration_minutes?: number
  difficulty_level?: ChildAssignment['difficulty_level']
  tags?: string[]
}

export interface CreateChildAchievementRequest {
  child_id: string
  course_id?: string
  achievement_type: ChildAchievement['achievement_type']
  achievement_title: string
  achievement_description?: string
  icon_url?: string
  points_value?: number
  rarity?: ChildAchievement['rarity']
  criteria_met?: AchievementCriteria
}

export interface LogChildActivityRequest {
  child_id: string
  course_id?: string
  activity_type: ChildLearningActivity['activity_type']
  activity_title: string
  activity_description?: string
  points_earned?: number
  duration_minutes?: number
  metadata?: ActivityMetadata
}

// Filter and query types
export interface ParentDashboardFilters {
  child_id?: string
  date_range?: {
    start: string
    end: string
  }
  activity_types?: ChildLearningActivity['activity_type'][]
  assignment_status?: ChildAssignment['status'][]
  achievement_types?: ChildAchievement['achievement_type'][]
  course_id?: string
}

// Database query helper types
export interface ChildAssignmentWithCourse extends ChildAssignment {
  course?: Course & { gurukul?: Gurukul }
}

export interface ChildActivityWithCourse extends ChildLearningActivity {
  course?: Course
}

export interface ChildAchievementWithCourse extends ChildAchievement {
  course?: Course
}

// Re-export existing types that are used in parent dashboard
export type { Course, Gurukul, Address, EmergencyContact, UserPreferences } from './index'

// Database table names for type safety
export const PARENT_DASHBOARD_TABLES = {
  parent_child_relationships: 'parent_child_relationships',
  child_learning_activities: 'child_learning_activities',
  child_assignments: 'child_assignments',
  child_achievements: 'child_achievements',
  child_study_sessions: 'child_study_sessions',
  parent_dashboard_stats: 'parent_dashboard_stats',
} as const

// Permission constants
export const DEFAULT_PARENT_PERMISSIONS = {
  view_progress: true,
  manage_courses: true,
  view_assignments: true,
  contact_teachers: true,
} as const

export const PARENT_RELATIONSHIP_TYPES = ['parent', 'guardian', 'authorized_user'] as const
export const ASSIGNMENT_TYPES = [
  'homework',
  'project',
  'quiz',
  'exam',
  'presentation',
  'reading',
  'practice',
] as const
export const ASSIGNMENT_STATUSES = [
  'pending',
  'in_progress',
  'submitted',
  'graded',
  'overdue',
  'excused',
] as const
export const ACHIEVEMENT_TYPES = [
  'certificate',
  'badge',
  'milestone',
  'streak',
  'perfect_score',
  'improvement',
  'participation',
  'leadership',
  'creativity',
] as const
export const ACTIVITY_TYPES = [
  'course_enrollment',
  'lesson_completion',
  'assignment_submission',
  'quiz_completion',
  'certificate_earned',
  'achievement_unlocked',
  'login',
  'study_session',
  'homework_completed',
] as const
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const
export const RARITY_LEVELS = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const
