// =========================================================================
// PARENTS DASHBOARD API SERVICE
// =========================================================================
// API functions for managing parent dashboard data and operations
// =========================================================================
import { supabaseAdmin } from '../supabase'
// Local interface definitions for parent dashboard
interface ParentChildRelationship {
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
}
interface ParentDashboardStats {
  parent_id: string
  child_id: string
  avatar_url?: string
  total_enrolled_courses: number
  active_courses: number
  total_assignments: number
  pending_assignments: number
  submitted_assignments: number
  overdue_assignments: number
  total_points: number
  active_learning_days: number
  last_activity_date?: string
  average_grade?: number
  total_achievements?: number
  total_study_minutes?: number
}
interface ChildProfile {
  id: string
  full_name: string
  email: string
  date_of_birth?: string
  grade?: string
  stats?: ParentDashboardStats
  relationship?: ParentChildRelationship
}
interface ParentDashboardData {
  children: ChildProfile[]
  stats?: ParentDashboardStats
  parent?: unknown
  summary?: unknown
}
interface AddChildRequest {
  parent_id: string
  child_email: string
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
}
// -------------------------------------------------------------------------
// PARENT-CHILD RELATIONSHIP MANAGEMENT
// -------------------------------------------------------------------------
export async function addChildToParent(
  parentId: string,
  request: AddChildRequest,
): Promise<{ data: ParentChildRelationship | null; error: string | null }> {
  try {
    // First, verify the child exists and is a student
    const { data: childProfile, error: childError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name')
      .eq('email', request.child_email)
      .eq('role', 'student')
      .single()
    if (childError || !childProfile) {
      return { data: null, error: 'Student not found with this email address' }
    }
    // Check if relationship already exists
    const { data: existingRelationship } = await supabaseAdmin
      .from('parent_child_relationships')
      .select('id')
      .eq('parent_id', parentId)
      .eq('child_id', childProfile.id)
      .single()
    if (existingRelationship) {
      return { data: null, error: 'This child is already linked to your account' }
    }
    // Create the relationship
    const { data: relationship, error: relationshipError } = await supabaseAdmin
      .from('parent_child_relationships')
      .insert({
        parent_id: parentId,
        child_id: childProfile.id,
        relationship_type: request.relationship_type || 'parent',
        is_primary_contact: request.is_primary_contact ?? true,
        permissions: request.permissions || {
          view_progress: true,
          manage_courses: true,
          view_assignments: true,
          contact_teachers: true,
        },
      })
      .select()
      .single()
    if (relationshipError) {
      return { data: null, error: 'Failed to create parent-child relationship' }
    }
    // Update child's parent_id in profiles table
    await supabaseAdmin.from('profiles').update({ parent_id: parentId }).eq('id', childProfile.id)
    return { data: relationship, error: null }
  } catch {
    return { data: null, error: 'An unexpected error occurred' }
  }
}
export async function getParentChildren(
  parentId: string,
): Promise<{ data: ChildProfile[] | null; error: string | null }> {
  try {
    const { data: relationships, error: relationshipError } = await supabaseAdmin
      .from('parent_child_relationships')
      .select(
        `
        *,
        child:profiles!child_id (
          id,
          email,
          full_name,
          student_id,
          avatar_url,
          date_of_birth,
          phone,
          address,
          emergency_contact,
          preferences,
          status,
          created_at,
          updated_at
        )
      `,
      )
      .eq('parent_id', parentId)
      .eq('is_active', true)
    if (relationshipError) {
      return { data: null, error: 'Failed to fetch children' }
    }
    // Get dashboard stats for each child
    const childrenWithStats = await Promise.all(
      relationships?.map(async (rel) => {
        const child = rel.child as ChildProfile
        const stats = await getChildDashboardStats(child.id)
        return {
          ...child,
          relationship: rel,
          stats: stats.data || undefined,
        }
      }) || [],
    )
    return { data: childrenWithStats, error: null }
  } catch {
    return { data: null, error: 'An unexpected error occurred' }
  }
}
export async function removeChildFromParent(
  parentId: string,
  childId: string,
): Promise<{ error: string | null }> {
  try {
    // Deactivate the relationship instead of deleting
    const { error } = await supabaseAdmin
      .from('parent_child_relationships')
      .update({ is_active: false })
      .eq('parent_id', parentId)
      .eq('child_id', childId)
    if (error) {
      return { error: 'Failed to remove child from account' }
    }
    // Remove parent_id from child's profile
    await supabaseAdmin.from('profiles').update({ parent_id: null }).eq('id', childId)
    return { error: null }
  } catch {
    return { error: 'An unexpected error occurred' }
  }
}
// -------------------------------------------------------------------------
// CHILD DASHBOARD STATS
// -------------------------------------------------------------------------
export async function getChildDashboardStats(
  childId: string,
): Promise<{ data: ParentDashboardStats | null; error: string | null }> {
  try {
    const { data: stats, error } = await supabaseAdmin
      .from('parent_dashboard_stats')
      .select('*')
      .eq('child_id', childId)
      .single()
    if (error && error.code !== 'PGRST116') {
      return { data: null, error: 'Failed to fetch dashboard stats' }
    }
    return { data: stats, error: null }
  } catch {
    return { data: null, error: 'An unexpected error occurred' }
  }
}
export async function getParentDashboardData(
  parentId: string,
): Promise<{ data: ParentDashboardData | null; error: string | null }> {
  try {
    // Get parent info
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('id', parentId)
      .single()
    if (parentError) {
      return { data: null, error: 'Parent not found' }
    }
    // Get children data
    const { data: children, error: childrenError } = await getParentChildren(parentId)
    if (childrenError) {
      return { data: null, error: childrenError }
    }
    // Calculate summary statistics
    const summary = {
      total_children: children?.length || 0,
      total_active_courses:
        children?.reduce((sum, child) => sum + (child.stats?.active_courses || 0), 0) || 0,
      total_pending_assignments:
        children?.reduce((sum, child) => sum + (child.stats?.pending_assignments || 0), 0) || 0,
      total_recent_achievements:
        children?.reduce((sum, child) => sum + (child.stats?.total_achievements || 0), 0) || 0,
      combined_study_minutes:
        children?.reduce((sum, child) => sum + (child.stats?.total_study_minutes || 0), 0) || 0,
      average_grade_across_children: children?.length
        ? children.reduce((sum, child) => sum + (child.stats?.average_grade || 0), 0) /
          children.length
        : 0,
    }
    return {
      data: {
        parent,
        children: children || [],
        summary,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'An unexpected error occurred' }
  }
}
// -------------------------------------------------------------------------
// UTILITY FUNCTIONS
// -------------------------------------------------------------------------
export async function refreshDashboardStats(): Promise<{ error: string | null }> {
  try {
    // Refresh the materialized view
    const { error } = await supabaseAdmin.rpc('refresh_parent_dashboard_stats')
    if (error) {
      return { error: 'Failed to refresh dashboard statistics' }
    }
    return { error: null }
  } catch {
    return { error: 'An unexpected error occurred' }
  }
}
// Helper function to check if user is parent of child
export async function verifyParentChildRelationship(
  parentId: string,
  childId: string,
): Promise<boolean> {
  try {
    const { data: relationship } = await supabaseAdmin
      .from('parent_child_relationships')
      .select('id')
      .eq('parent_id', parentId)
      .eq('child_id', childId)
      .eq('is_active', true)
      .single()
    return !!relationship
  } catch {
    return false
  }
}
