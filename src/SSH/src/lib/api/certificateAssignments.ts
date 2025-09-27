import { supabaseAdmin } from '../supabase'
import { getGurukuls } from './gurukuls'
import { getCourses } from './courses'
import type { CertificateTemplate, Gurukul, Course, User } from '../../types'

interface CourseAssignmentWithCourse {
  course_id: string
  courses: {
    id: string
    gurukul_id: string
  }[]
}

export interface CertificateAssignment {
  id: string
  template_id: string
  gurukul_id?: string
  course_id?: string
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  template?: CertificateTemplate
  gurukul?: Gurukul
  course?: Course
  creator?: User
}
export interface CreateCertificateAssignmentData {
  template_id: string
  gurukul_id?: string
  course_id?: string
}
// Get all assignments with filters
export const getCertificateAssignments = async (filters?: {
  template_id?: string
  gurukul_id?: string
  course_id?: string
}) => {
  try {
    let query = supabaseAdmin
      .from('certificate_assignments')
      .select(
        `
        *,
        template:certificate_templates(*),
        gurukul:gurukuls(*),
        course:courses(*),
        creator:profiles(*)
      `,
      )
      .order('created_at', { ascending: false })
    // Apply filters
    if (filters?.template_id) {
      query = query.eq('template_id', filters.template_id)
    }
    if (filters?.gurukul_id) {
      query = query.eq('gurukul_id', filters.gurukul_id)
    }
    if (filters?.course_id) {
      query = query.eq('course_id', filters.course_id)
    }
    const { data, error } = await query
    if (error) {
      // If table doesn't exist, return empty array instead of throwing
      if (error.message.includes('relation "certificate_assignments" does not exist')) {
        return []
      }
      throw error
    }
    return data as CertificateAssignment[]
  } catch {
    // Return empty array if there's any database issue
    return []
  }
}
// Get assignments for a teacher's courses
export const getTeacherCertificateAssignments = async (teacherId: string) => {
  try {
    // Get courses where the teacher is assigned
    // First try courses table with teacher_id, then try course_assignments table
    let { data: teacherCourses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id, gurukul_id')
      .eq('teacher_id', teacherId)
    // If no courses found or teacher_id doesn't exist, try course_assignments table
    if (coursesError || !teacherCourses || teacherCourses.length === 0) {
      const { data: assignments, error: assignmentError } = await supabaseAdmin
        .from('course_assignments')
        .select(
          `
          course_id,
          courses!inner(id, gurukul_id)
        `,
        )
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
      if (!assignmentError && assignments) {
        teacherCourses = assignments.map((a: CourseAssignmentWithCourse) => ({
          id: a.courses?.[0]?.id || a.course_id,
          gurukul_id: a.courses?.[0]?.gurukul_id,
        }))
        coursesError = null
      }
    }
    if (coursesError) {
      return []
    }
    if (!teacherCourses || teacherCourses.length === 0) {
      return []
    }
    const courseIds = teacherCourses.map((tc) => tc.id)
    const gurukulIds = [...new Set(teacherCourses.map((tc) => tc.gurukul_id))]
    // Get assignments for teacher's courses or gurukuls
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('certificate_assignments')
      .select(
        `
        *,
        template:certificate_templates(*),
        gurukul:gurukuls(*),
        course:courses(*),
        creator:profiles(*)
      `,
      )
      .or(`course_id.in.(${courseIds.join(',')}),gurukul_id.in.(${gurukulIds.join(',')})`)
    if (assignmentsError) {
      // If table doesn't exist, return empty array instead of throwing
      if (assignmentsError.message.includes('relation "certificate_assignments" does not exist')) {
        return []
      }
      return []
    }
    return (assignments as CertificateAssignment[]) || []
  } catch {
    return []
  }
}
// Create assignment
export const createCertificateAssignment = async (
  assignmentData: CreateCertificateAssignmentData,
  createdByUserId: string,
) => {
  try {
    // Validate that at least one of gurukul_id or course_id is provided
    if (!assignmentData.gurukul_id && !assignmentData.course_id) {
      throw new Error('Either gurukul_id or course_id must be provided')
    }
    const insertData = {
      template_id: assignmentData.template_id,
      gurukul_id: assignmentData.gurukul_id || null,
      course_id: assignmentData.course_id || null,
      created_by: createdByUserId,
    }
    const { data, error } = await supabaseAdmin
      .from('certificate_assignments')
      .insert(insertData)
      .select(
        `
        *,
        template:certificate_templates(*),
        gurukul:gurukuls(*),
        course:courses(*),
        creator:profiles(*)
      `,
      )
      .single()
    if (error) {
      // Provide helpful error messages
      if (error.message.includes('relation "certificate_assignments" does not exist')) {
        throw new Error(
          'Certificate assignments table does not exist. Please contact administrator to set up the database.',
        )
      }
      if (error.message.includes('check constraint "check_assignment_target"')) {
        throw new Error('Either gurukul or course must be selected for assignment.')
      }
      throw error
    }
    return data as CertificateAssignment
  } catch (_error) {
    throw _error
  }
}
// Update assignment
export const updateCertificateAssignment = async (
  id: string,
  updates: Partial<CreateCertificateAssignmentData>,
) => {
  try {
    // Validate that either gurukul_id or course_id is provided (but not both)
    if (updates.gurukul_id && updates.course_id) {
      throw new Error('Cannot assign to both gurukul and course simultaneously')
    }
    const { data, error } = await supabaseAdmin
      .from('certificate_assignments')
      .update({
        template_id: updates.template_id,
        gurukul_id: updates.gurukul_id || null,
        course_id: updates.course_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        template:certificate_templates(*),
        gurukul:gurukuls(*),
        course:courses(*),
        creator:profiles(*)
      `,
      )
      .single()
    if (error) {
      throw error
    }
    return data as CertificateAssignment
  } catch (_error) {
    throw _error
  }
}
// Delete assignment
export const deleteCertificateAssignment = async (id: string) => {
  try {
    const { error } = await supabaseAdmin.from('certificate_assignments').delete().eq('id', id)
    if (error) {
      throw error
    }
    return true
  } catch (_error) {
    throw _error
  }
}
// Get available gurukuls for assignment
export const getAvailableGurukuls = async () => {
  try {
    const gurukuls = await getGurukuls()
    return gurukuls.map((g) => ({
      id: g.id,
      name: g.name,
      status: g.is_active ? 'active' : 'inactive',
    }))
  } catch (_error) {
    throw _error
  }
}
// Get available courses for assignment
export const getAvailableCourses = async (gurukulId?: string) => {
  try {
    const filters = gurukulId ? { gurukul_id: gurukulId } : undefined
    const courses = await getCourses(filters)
    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      gurukul_id: c.gurukul_id,
      status: 'active', // Assuming all returned courses are active
    }))
  } catch (_error) {
    throw _error
  }
}
