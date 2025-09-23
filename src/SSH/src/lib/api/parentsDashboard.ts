// =========================================================================
// PARENTS DASHBOARD API SERVICE
// =========================================================================
// API functions for managing parent dashboard data and operations
// =========================================================================

import { supabaseAdmin } from '../supabase'
import type {
  ParentChildRelationship,
  ChildLearningActivity,
  ChildAssignment,
  ChildAchievement,
  ChildStudySession,
  ParentDashboardStats,
  ChildProfile,
  ParentDashboardData,
  AddChildRequest,
  CreateChildAssignmentRequest,
  CreateChildAchievementRequest,
  LogChildActivityRequest,
  ParentDashboardFilters,
  ChildAssignmentWithCourse,
} from '../../types/parentsDashboard'

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
  } catch (error) {
    console.error('Error adding child to parent:', error)
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
  } catch (error) {
    console.error('Error fetching parent children:', error)
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
  } catch (error) {
    console.error('Error removing child from parent:', error)
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
  } catch (error) {
    console.error('Error fetching child dashboard stats:', error)
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
  } catch (error) {
    console.error('Error fetching parent dashboard data:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// -------------------------------------------------------------------------
// CHILD ACTIVITIES
// -------------------------------------------------------------------------

export async function getChildRecentActivities(
  childId: string,
  limit: number = 10,
): Promise<{ data: ChildLearningActivity[] | null; error: string | null }> {
  try {
    const { data: activities, error } = await supabaseAdmin
      .from('child_learning_activities')
      .select(
        `
        *,
        course:courses (
          id,
          title,
          description
        )
      `,
      )
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { data: null, error: 'Failed to fetch activities' }
    }

    return { data: activities, error: null }
  } catch (error) {
    console.error('Error fetching child activities:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

export async function logChildActivity(
  request: LogChildActivityRequest,
): Promise<{ data: ChildLearningActivity | null; error: string | null }> {
  try {
    const { data: activity, error } = await supabaseAdmin
      .from('child_learning_activities')
      .insert({
        child_id: request.child_id,
        course_id: request.course_id,
        activity_type: request.activity_type,
        activity_title: request.activity_title,
        activity_description: request.activity_description,
        points_earned: request.points_earned || 0,
        duration_minutes: request.duration_minutes,
        metadata: request.metadata || {},
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: 'Failed to log activity' }
    }

    return { data: activity, error: null }
  } catch (error) {
    console.error('Error logging child activity:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// -------------------------------------------------------------------------
// CHILD ASSIGNMENTS
// -------------------------------------------------------------------------

export async function getChildAssignments(
  childId: string,
  filters?: ParentDashboardFilters,
): Promise<{ data: ChildAssignmentWithCourse[] | null; error: string | null }> {
  try {
    let query = supabaseAdmin
      .from('child_assignments')
      .select(
        `
        *,
        course:courses (
          id,
          title,
          description,
          gurukul:gurukuls (
            id,
            name,
            slug
          )
        )
      `,
      )
      .eq('child_id', childId)

    // Apply filters
    if (filters?.assignment_status && filters.assignment_status.length > 0) {
      query = query.in('status', filters.assignment_status)
    }

    if (filters?.course_id) {
      query = query.eq('course_id', filters.course_id)
    }

    if (filters?.date_range) {
      query = query
        .gte('due_date', filters.date_range.start)
        .lte('due_date', filters.date_range.end)
    }

    const { data: assignments, error } = await query.order('due_date', { ascending: true })

    if (error) {
      return { data: null, error: 'Failed to fetch assignments' }
    }

    return { data: assignments, error: null }
  } catch (error) {
    console.error('Error fetching child assignments:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

export async function createChildAssignment(
  request: CreateChildAssignmentRequest,
): Promise<{ data: ChildAssignment | null; error: string | null }> {
  try {
    const { data: assignment, error } = await supabaseAdmin
      .from('child_assignments')
      .insert({
        child_id: request.child_id,
        course_id: request.course_id,
        assignment_title: request.assignment_title,
        assignment_description: request.assignment_description,
        assignment_type: request.assignment_type || 'homework',
        due_date: request.due_date,
        estimated_duration_minutes: request.estimated_duration_minutes,
        difficulty_level: request.difficulty_level || 'medium',
        tags: request.tags || [],
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: 'Failed to create assignment' }
    }

    return { data: assignment, error: null }
  } catch (error) {
    console.error('Error creating child assignment:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: ChildAssignment['status'],
  submissionUrl?: string,
): Promise<{ error: string | null }> {
  try {
    const updateData: Partial<ChildAssignment> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'submitted') {
      updateData.submitted_date = new Date().toISOString()
      if (submissionUrl) {
        updateData.submission_url = submissionUrl
      }
    }

    const { error } = await supabaseAdmin
      .from('child_assignments')
      .update(updateData)
      .eq('id', assignmentId)

    if (error) {
      return { error: 'Failed to update assignment status' }
    }

    return { error: null }
  } catch (error) {
    console.error('Error updating assignment status:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// -------------------------------------------------------------------------
// CHILD ACHIEVEMENTS
// -------------------------------------------------------------------------

export async function getChildAchievements(
  childId: string,
  filters?: ParentDashboardFilters,
): Promise<{ data: ChildAchievement[] | null; error: string | null }> {
  try {
    let query = supabaseAdmin
      .from('child_achievements')
      .select(
        `
        *,
        course:courses (
          id,
          title,
          description
        )
      `,
      )
      .eq('child_id', childId)

    // Apply filters
    if (filters?.achievement_types && filters.achievement_types.length > 0) {
      query = query.in('achievement_type', filters.achievement_types)
    }

    if (filters?.course_id) {
      query = query.eq('course_id', filters.course_id)
    }

    if (filters?.date_range) {
      query = query
        .gte('earned_date', filters.date_range.start)
        .lte('earned_date', filters.date_range.end)
    }

    const { data: achievements, error } = await query.order('earned_date', { ascending: false })

    if (error) {
      return { data: null, error: 'Failed to fetch achievements' }
    }

    return { data: achievements, error: null }
  } catch (error) {
    console.error('Error fetching child achievements:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

export async function awardChildAchievement(
  request: CreateChildAchievementRequest,
): Promise<{ data: ChildAchievement | null; error: string | null }> {
  try {
    const { data: achievement, error } = await supabaseAdmin
      .from('child_achievements')
      .insert({
        child_id: request.child_id,
        course_id: request.course_id,
        achievement_type: request.achievement_type,
        achievement_title: request.achievement_title,
        achievement_description: request.achievement_description,
        icon_url: request.icon_url,
        points_value: request.points_value || 0,
        rarity: request.rarity || 'common',
        criteria_met: request.criteria_met,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: 'Failed to award achievement' }
    }

    return { data: achievement, error: null }
  } catch (error) {
    console.error('Error awarding child achievement:', error)
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
  } catch (error) {
    console.error('Error refreshing dashboard stats:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getChildStudySessions(
  childId: string,
  limit: number = 10,
): Promise<{ data: ChildStudySession[] | null; error: string | null }> {
  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('child_study_sessions')
      .select('*')
      .eq('child_id', childId)
      .order('session_start', { ascending: false })
      .limit(limit)

    if (error) {
      return { data: null, error: 'Failed to fetch study sessions' }
    }

    return { data: sessions, error: null }
  } catch (error) {
    console.error('Error fetching child study sessions:', error)
    return { data: null, error: 'An unexpected error occurred' }
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
