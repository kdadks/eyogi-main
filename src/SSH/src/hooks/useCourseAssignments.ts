import { useState, useEffect, useCallback } from 'react'
import { supabaseAdmin } from '../lib/supabase'
import { CourseAssignment, Course, User } from '../types'
import toast from 'react-hot-toast'
import { decryptProfileFields } from '../lib/encryption'
export function useCourseAssignments(teacherId?: string) {
  const [assignments, setAssignments] = useState<CourseAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use a single query with joins to get all data at once
      let query = supabaseAdmin
        .from('course_assignments')
        .select(
          `
          *,
          courses(*)
        `,
        )
        .eq('is_active', true)
        .order('assigned_at', { ascending: false })

      // Filter by teacher if specified
      if (teacherId) {
        query = query.eq('teacher_id', teacherId)
      }

      const { data: assignmentsData, error: assignmentsError } = await query

      if (assignmentsError) {
        console.error('Error loading assignments:', assignmentsError)
        setError('Failed to load course assignments')
        toast.error('Failed to load course assignments')
        return
      }

      // Get unique teacher profile IDs (course_assignments.teacher_id is now a UUID referencing profiles.id)
      const teacherProfileIds = [
        ...new Set(assignmentsData?.map((a) => a.teacher_id).filter(Boolean)),
      ]

      // Fetch teachers by profile id
      const { data: teachersData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('id', teacherProfileIds)
        .eq('role', 'teacher')

      // Decrypt teacher profiles
      const decryptedTeachers = (teachersData || []).map((teacher) => decryptProfileFields(teacher))

      // Create map for quick lookup by profile id
      const teacherMapByProfileId = new Map(decryptedTeachers.map((t) => [t.id, t]))

      // Combine the data
      const assignmentsWithRelations = assignmentsData?.map((assignment) => ({
        ...assignment,
        course: assignment.courses,
        teacher: teacherMapByProfileId.get(assignment.teacher_id),
      }))

      setAssignments(assignmentsWithRelations || [])
    } catch {
      setError('Failed to load course assignments')
    } finally {
      setLoading(false)
    }
  }, [teacherId])
  const assignTeacherToCourse = async (
    teacherId: string,
    courseId: string,
    assignedBy: string,
    notes?: string,
  ): Promise<boolean> => {
    try {
      // teacherId should now be the profile UUID
      // Verify the teacher exists and has the teacher role
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, role, teacher_code')
        .eq('id', teacherId)
        .eq('role', 'teacher')
        .single()

      if (!profile) {
        toast.error('Teacher profile not found')
        return false
      }

      // Check if assignment already exists
      const { data: existing } = await supabaseAdmin
        .from('course_assignments')
        .select('id')
        .eq('teacher_id', profile.id)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .maybeSingle()

      if (existing) {
        toast.error('Teacher is already assigned to this course')
        return false
      }

      // Insert assignment with profile UUID
      const { error } = await supabaseAdmin.from('course_assignments').insert({
        teacher_id: profile.id,
        course_id: courseId,
        assigned_by: assignedBy,
        notes: notes,
        is_active: true,
      })
      if (error) {
        toast.error('Failed to assign teacher to course: ' + (error.message || 'Unknown error'))
        return false
      }
      toast.success('Teacher assigned to course successfully')
      await loadAssignments()
      return true
    } catch (err) {
      toast.error(
        'Failed to assign teacher to course: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
      )
      return false
    }
  }
  const removeAssignment = async (assignmentId: string): Promise<boolean> => {
    try {
      const { error } = await supabaseAdmin
        .from('course_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId)
      if (error) {
        toast.error('Failed to remove assignment')
        return false
      }
      toast.success('Assignment removed successfully')
      await loadAssignments()
      return true
    } catch {
      toast.error('Failed to remove assignment')
      return false
    }
  }
  const getTeacherCourses = async (teacherId: string): Promise<Course[]> => {
    try {
      const { data, error } = await supabaseAdmin
        .from('course_assignments')
        .select(
          `
          course:courses(*)
        `,
        )
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
      if (error) {
        return []
      }
      return (data || []).map((item) => item.course as unknown as Course).filter(Boolean)
    } catch {
      return []
    }
  }
  const getAssignedTeachers = async (courseId: string): Promise<User[]> => {
    try {
      const { data: assignments, error } = await supabaseAdmin
        .from('course_assignments')
        .select('teacher_id')
        .eq('course_id', courseId)
        .eq('is_active', true)

      if (error) {
        return []
      }

      // Get unique teacher profile IDs
      const teacherIds = [...new Set(assignments?.map((a) => a.teacher_id).filter(Boolean))]

      if (teacherIds.length === 0) {
        return []
      }

      // Fetch all teachers in one query
      const { data: teachers } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('id', teacherIds)
        .eq('role', 'teacher')

      return (teachers || []).map((teacher) => decryptProfileFields(teacher))
    } catch {
      return []
    }
  }
  useEffect(() => {
    loadAssignments()
  }, [teacherId, loadAssignments])
  return {
    assignments,
    loading,
    error,
    loadAssignments,
    assignTeacherToCourse,
    removeAssignment,
    getTeacherCourses,
    getAssignedTeachers,
  }
}
