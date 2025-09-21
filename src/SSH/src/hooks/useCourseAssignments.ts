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

      console.log('Loading assignments with teacherId filter:', teacherId)

      // First, get the assignments
      let query = supabaseAdmin
        .from('course_assignments')
        .select('*')
        .eq('is_active', true)
        .order('assigned_at', { ascending: false })

      // Filter by teacher if specified
      if (teacherId) {
        query = query.eq('teacher_id', teacherId)
        console.log('Filtering by teacher_id:', teacherId)
      }

      console.log('Executing assignment query...')
      const { data, error } = await query

      console.log('Assignment query result:', {
        data: data,
        error: error,
        count: data?.length || 0,
      })

      if (error) {
        console.error('Error loading course assignments:', JSON.stringify(error, null, 2))
        setError('Failed to load course assignments')
        toast.error('Failed to load course assignments')
        return
      }

      // Now fetch related data for each assignment
      const assignmentsWithRelations = []
      for (const assignment of data || []) {
        console.log('Processing assignment:', assignment)

        // Fetch course data
        const { data: course } = await supabaseAdmin
          .from('courses')
          .select('*')
          .eq('id', assignment.course_id)
          .single()

        // Fetch teacher data by teacher_id
        const { data: teacher } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('teacher_id', assignment.teacher_id)
          .single()

        console.log('Assignment relations:', {
          assignment_id: assignment.id,
          course: course?.title,
          teacher: teacher?.full_name,
          teacher_id: assignment.teacher_id,
        })

        assignmentsWithRelations.push({
          ...assignment,
          course,
          teacher,
        })
      }

      console.log('Setting assignments with relations:', assignmentsWithRelations)
      setAssignments(assignmentsWithRelations)
    } catch (err) {
      console.error('Error in loadAssignments:', err)
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
      console.log('assignTeacherToCourse called with:', {
        teacherId,
        courseId,
        assignedBy,
        notes,
      })

      // Check if we need to update the teacher profile with teacher_id
      let actualTeacherId = teacherId

      // Check if this is a profile ID (UUID format) and the teacher doesn't have a teacher_id yet
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      console.log('Checking teacherId format:', teacherId, 'isUUID:', uuidRegex.test(teacherId))

      if (uuidRegex.test(teacherId)) {
        console.log('Received profile ID, checking if teacher_id needs to be set:', teacherId)

        // This is a profile ID, check if the teacher needs a teacher_id
        const { data: profile, error: selectError } = await supabaseAdmin
          .from('profiles')
          .select('id, teacher_id, role')
          .eq('id', teacherId)
          .eq('role', 'teacher')
          .single()

        console.log('Found profile:', JSON.stringify(profile, null, 2))
        console.log('Select error:', selectError)
        console.log('Profile teacher_id type:', typeof profile?.teacher_id)
        console.log('Profile teacher_id value:', profile?.teacher_id)
        console.log('Profile teacher_id === null:', profile?.teacher_id === null)
        console.log('Profile teacher_id == null:', profile?.teacher_id == null)
        console.log('!profile.teacher_id:', !profile?.teacher_id)

        if (profile && !profile.teacher_id) {
          console.log('Generating teacher_id that fits in VARCHAR(20)')
          // Generate a teacher ID that fits in VARCHAR(20) - use last 12 chars of UUID with TCH- prefix
          const shortTeacherId = `TCH-${profile.id.slice(-12)}`
          console.log('Generated teacher_id:', shortTeacherId)

          // Update the profile to use the generated teacher_id
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ teacher_id: shortTeacherId })
            .eq('id', profile.id)

          if (updateError) {
            console.error('Error updating teacher profile:', JSON.stringify(updateError, null, 2))
            toast.error('Failed to update teacher profile')
            return false
          }
          console.log('Successfully updated profile with teacher_id')
          actualTeacherId = shortTeacherId
        } else if (profile && profile.teacher_id) {
          // Check if existing teacher_id is too long for the database
          if (profile.teacher_id.length > 20) {
            console.log('Existing teacher_id is too long, updating with shortened version')
            const shortTeacherId = `TCH-${profile.id.slice(-12)}`
            console.log('Updating to shortened teacher_id:', shortTeacherId)

            // Update the profile with the shortened teacher_id
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({ teacher_id: shortTeacherId })
              .eq('id', profile.id)

            if (updateError) {
              console.error(
                'Error updating teacher profile with short ID:',
                JSON.stringify(updateError, null, 2),
              )
              toast.error('Failed to update teacher profile')
              return false
            }
            console.log('Successfully updated profile with shortened teacher_id')
            actualTeacherId = shortTeacherId
          } else {
            // Use existing teacher_id (it's already the right length)
            actualTeacherId = profile.teacher_id
            console.log('Using existing teacher_id:', actualTeacherId)
          }
        } else if (profile && profile.teacher_id === null) {
          // teacher_id is explicitly null, generate a new one
          console.log('teacher_id is null, should have been handled above - this is unexpected')
          const shortTeacherId = `TCH-${profile.id.slice(-12)}`
          console.log('Fallback: Generated teacher_id:', shortTeacherId)

          // Update the profile to use the generated teacher_id
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ teacher_id: shortTeacherId })
            .eq('id', profile.id)

          if (updateError) {
            console.error(
              'Error updating teacher profile (fallback):',
              JSON.stringify(updateError, null, 2),
            )
            toast.error('Failed to update teacher profile')
            return false
          }
          console.log('Successfully updated profile with teacher_id (fallback)')
          actualTeacherId = shortTeacherId
        } else if (!profile) {
          console.error('No teacher profile found for ID:', teacherId)
          toast.error('Teacher profile not found')
          return false
        }
      }

      console.log('Final actualTeacherId being used:', actualTeacherId)

      // Failsafe: If actualTeacherId is still a UUID (too long), generate a short one
      if (actualTeacherId.length > 20) {
        console.log('ActualTeacherId is too long, generating short version')
        actualTeacherId = `TCH-${actualTeacherId.slice(-12)}`
        console.log('Using shortened teacher_id:', actualTeacherId)
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
        console.error('Error assigning teacher to course:', JSON.stringify(error, null, 2))
        console.error(
          'Assignment data:',
          JSON.stringify(
            {
              teacher_id: actualTeacherId,
              course_id: courseId,
              assigned_by: assignedBy,
              notes: notes,
              is_active: true,
            },
            null,
            2,
          ),
        )
        toast.error('Failed to assign teacher to course: ' + (error.message || 'Unknown error'))
        return false
      }

      toast.success('Teacher assigned to course successfully')
      await loadAssignments()
      return true
    } catch (err) {
      console.error('Error in assignTeacherToCourse:', JSON.stringify(err, null, 2))
      console.error('Catch error details:', err)
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
        console.error('Error removing assignment:', error)
        toast.error('Failed to remove assignment')
        return false
      }

      toast.success('Assignment removed successfully')
      await loadAssignments()
      return true
    } catch (err) {
      console.error('Error in removeAssignment:', err)
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
        console.error('Error loading teacher courses:', error)
        return []
      }

      return (data || []).map((item) => item.course as unknown as Course).filter(Boolean)
    } catch (err) {
      console.error('Error in getTeacherCourses:', err)
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
        console.error('Error loading assigned teachers:', error)
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
    } catch (err) {
      console.error('Error in getAssignedTeachers:', err)
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
