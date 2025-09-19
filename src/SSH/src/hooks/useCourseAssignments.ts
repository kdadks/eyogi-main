import { useState, useEffect } from 'react'
import { supabaseAdmin } from '../lib/supabase'
import { CourseAssignment, Course, User } from '../types'
import toast from 'react-hot-toast'

export function useCourseAssignments(teacherId?: string) {
  const [assignments, setAssignments] = useState<CourseAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAssignments = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabaseAdmin
        .from('course_assignments')
        .select(`
          *,
          course:courses(*),
          teacher:profiles!course_assignments_teacher_id_fkey(*)
        `)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false })

      // Filter by teacher if specified
      if (teacherId) {
        query = query.eq('teacher_id', teacherId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading course assignments:', error)
        setError('Failed to load course assignments')
        toast.error('Failed to load course assignments')
        return
      }

      setAssignments(data || [])
    } catch (err) {
      console.error('Error in loadAssignments:', err)
      setError('Failed to load course assignments')
    } finally {
      setLoading(false)
    }
  }

  const assignTeacherToCourse = async (
    teacherId: string,
    courseId: string,
    assignedBy: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      // Check if assignment already exists
      const { data: existing } = await supabaseAdmin
        .from('course_assignments')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('course_id', courseId)
        .single()

      if (existing) {
        toast.error('Teacher is already assigned to this course')
        return false
      }

      const { error } = await supabaseAdmin
        .from('course_assignments')
        .insert({
          teacher_id: teacherId,
          course_id: courseId,
          assigned_by: assignedBy,
          notes: notes,
          is_active: true,
        })

      if (error) {
        console.error('Error assigning teacher to course:', error)
        toast.error('Failed to assign teacher to course')
        return false
      }

      toast.success('Teacher assigned to course successfully')
      await loadAssignments()
      return true
    } catch (err) {
      console.error('Error in assignTeacherToCourse:', err)
      toast.error('Failed to assign teacher to course')
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
        .select(`
          course:courses(*)
        `)
        .eq('teacher_id', teacherId)
        .eq('is_active', true)

      if (error) {
        console.error('Error loading teacher courses:', error)
        return []
      }

      return (data || []).map(item => item.course).filter(Boolean)
    } catch (err) {
      console.error('Error in getTeacherCourses:', err)
      return []
    }
  }

  const getAssignedTeachers = async (courseId: string): Promise<User[]> => {
    try {
      const { data, error } = await supabaseAdmin
        .from('course_assignments')
        .select(`
          teacher:profiles!course_assignments_teacher_id_fkey(*)
        `)
        .eq('course_id', courseId)
        .eq('is_active', true)

      if (error) {
        console.error('Error loading assigned teachers:', error)
        return []
      }

      return (data || []).map(item => item.teacher).filter(Boolean)
    } catch (err) {
      console.error('Error in getAssignedTeachers:', err)
      return []
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [teacherId])

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