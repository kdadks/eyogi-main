import { useState, useEffect, useCallback } from 'react'
import { supabaseAdmin } from '../lib/supabase'
import { CourseAssignment, Course, User } from '../types'
import toast from 'react-hot-toast'
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

      // Get unique teacher_ids
      const teacherIds = [...new Set(assignmentsData?.map((a) => a.teacher_id).filter(Boolean))]

      // Fetch all teachers in one query
      const { data: teachersData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('teacher_id', teacherIds)

      // Create a map for quick lookup
      const teacherMap = new Map(teachersData?.map((t) => [t.teacher_id, t]) || [])

      // Combine the data
      const assignmentsWithRelations = assignmentsData?.map((assignment) => ({
        ...assignment,
        course: assignment.courses,
        teacher: teacherMap.get(assignment.teacher_id),
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
      // Assigning teacher to course
      // Check if we need to update the teacher profile with teacher_id
      let actualTeacherId = teacherId
      // Check if this is a profile ID (UUID format) and the teacher doesn't have a teacher_id yet
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      if (uuidRegex.test(teacherId)) {
        // This is a profile ID, check if the teacher needs a teacher_id
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, teacher_id, role')
          .eq('id', teacherId)
          .eq('role', 'teacher')
          .single()

        if (profile && !profile.teacher_id) {
          // Generate a teacher ID that fits in VARCHAR(20) - use last 12 chars of UUID with TCH- prefix
          const shortTeacherId = `TCH-${profile.id.slice(-12)}`
          // Update the profile to use the generated teacher_id
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ teacher_id: shortTeacherId })
            .eq('id', profile.id)
          if (updateError) {
            toast.error('Failed to update teacher profile')
            return false
          }
          actualTeacherId = shortTeacherId
        } else if (profile && profile.teacher_id) {
          // Check if existing teacher_id is too long for the database
          if (profile.teacher_id.length > 20) {
            const shortTeacherId = `TCH-${profile.id.slice(-12)}`
            // Update the profile with the shortened teacher_id
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({ teacher_id: shortTeacherId })
              .eq('id', profile.id)
            if (updateError) {
              toast.error('Failed to update teacher profile')
              return false
            }
            actualTeacherId = shortTeacherId
          } else {
            // Use existing teacher_id (it's already the right length)
            actualTeacherId = profile.teacher_id
          }
        } else if (profile && profile.teacher_id === null) {
          // teacher_id is explicitly null, generate a new one
          const shortTeacherId = `TCH-${profile.id.slice(-12)}`
          // Update the profile to use the generated teacher_id
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ teacher_id: shortTeacherId })
            .eq('id', profile.id)
          if (updateError) {
            toast.error('Failed to update teacher profile')
            return false
          }
          actualTeacherId = shortTeacherId
        } else if (!profile) {
          toast.error('Teacher profile not found')
          return false
        }
      }
      // Failsafe: If actualTeacherId is still a UUID (too long), generate a short one
      if (actualTeacherId.length > 20) {
        actualTeacherId = `TCH-${actualTeacherId.slice(-12)}`
      }
      // Check if assignment already exists
      const { data: existing } = await supabaseAdmin
        .from('course_assignments')
        .select('id')
        .eq('teacher_id', actualTeacherId)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .maybeSingle()
      if (existing) {
        toast.error('Teacher is already assigned to this course')
        return false
      }
      const { error } = await supabaseAdmin.from('course_assignments').insert({
        teacher_id: actualTeacherId,
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
      // Get teacher profiles for each teacher_id
      const teachers = []
      for (const assignment of assignments || []) {
        const { data: teacher } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('teacher_id', assignment.teacher_id)
          .single()
        if (teacher) {
          teachers.push(teacher)
        }
      }
      return teachers
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
