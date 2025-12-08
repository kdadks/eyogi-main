import { supabaseAdmin } from '../supabase'
import { getGurukuls } from './gurukuls'
import { getCourses } from './courses'
import { decryptProfileFields } from '../encryption'
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
  teacher_id?: string
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  template?: CertificateTemplate
  gurukul?: Gurukul
  course?: Course
  teacher?: User
  creator?: User
}
export interface CreateCertificateAssignmentData {
  template_id: string
  gurukul_id?: string
  course_id?: string
  teacher_id?: string
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
        teacher:profiles!teacher_id(*),
        creator:profiles!created_by(*)
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

    // Decrypt profile fields
    const decryptedData = data.map((assignment) => ({
      ...assignment,
      teacher: assignment.teacher ? decryptProfileFields(assignment.teacher) : assignment.teacher,
      creator: assignment.creator ? decryptProfileFields(assignment.creator) : assignment.creator,
    }))

    return decryptedData as CertificateAssignment[]
  } catch {
    // Return empty array if there's any database issue
    return []
  }
}
// Get assignments for a teacher's courses
export const getTeacherCertificateAssignments = async (teacherId: string) => {
  try {
    // Step 1: Get direct teacher assignments
    let assignments: CertificateAssignment[] = []

    // Try to get direct teacher assignments first
    const { data: directAssignments, error: directError } = await supabaseAdmin
      .from('certificate_assignments')
      .select(
        `
        *,
        template:certificate_templates(*),
        gurukul:gurukuls(*),
        course:courses(*),
        teacher:profiles!teacher_id(*),
        creator:profiles!created_by(*)
      `,
      )
      .eq('teacher_id', teacherId)

    if (!directError && directAssignments) {
      assignments = [...assignments, ...directAssignments]
    }

    // Step 2: Get teacher's courses and their assignments
    let teacherCourses: { id: string; gurukul_id: string }[] = []

    // First try courses table with teacher_id
    const { data: coursesData, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id, gurukul_id')
      .eq('teacher_id', teacherId)

    if (!coursesError && coursesData) {
      teacherCourses = [...teacherCourses, ...coursesData]
    }

    // Then try course_assignments table
    const { data: courseAssignments, error: assignmentError } = await supabaseAdmin
      .from('course_assignments')
      .select(
        `
        course_id,
        courses!inner(id, gurukul_id)
      `,
      )
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (!assignmentError && courseAssignments) {
      const additionalCourses = courseAssignments.map((a: CourseAssignmentWithCourse) => ({
        id: a.courses?.[0]?.id || a.course_id,
        gurukul_id: a.courses?.[0]?.gurukul_id,
      }))
      teacherCourses = [...teacherCourses, ...additionalCourses]
    }

    // Step 3: Get course-level assignments
    if (teacherCourses.length > 0) {
      const courseIds = teacherCourses.map((tc) => tc.id)
      const { data: courseAssignments, error: courseAssignError } = await supabaseAdmin
        .from('certificate_assignments')
        .select(
          `
          *,
          template:certificate_templates(*),
          gurukul:gurukuls(*),
          course:courses(*),
          teacher:profiles!teacher_id(*),
          creator:profiles!created_by(*)
        `,
        )
        .in('course_id', courseIds)
        .is('teacher_id', null)

      if (!courseAssignError && courseAssignments) {
        assignments = [...assignments, ...courseAssignments]
      }
    }

    // Step 4: Get gurukul-level assignments
    if (teacherCourses.length > 0) {
      const gurukulIds = [...new Set(teacherCourses.map((tc) => tc.gurukul_id).filter(Boolean))]
      if (gurukulIds.length > 0) {
        const { data: gurukulAssignments, error: gurukulAssignError } = await supabaseAdmin
          .from('certificate_assignments')
          .select(
            `
            *,
            template:certificate_templates(*),
            gurukul:gurukuls(*),
            course:courses(*),
            teacher:profiles!certificate_template_assignments_teacher_id_fkey(*),
            creator:profiles!created_by(*)
          `,
          )
          .in('gurukul_id', gurukulIds)
          .is('course_id', null)
          .is('teacher_id', null)

        if (!gurukulAssignError && gurukulAssignments) {
          assignments = [...assignments, ...gurukulAssignments]
        }
      }
    }

    // Remove duplicates based on template_id and assignment type
    const uniqueAssignments = assignments.filter(
      (assignment, index, self) =>
        index ===
        self.findIndex(
          (a) =>
            a.template_id === assignment.template_id &&
            a.gurukul_id === assignment.gurukul_id &&
            a.course_id === assignment.course_id &&
            a.teacher_id === assignment.teacher_id, // Comparing profile UUIDs
        ),
    )

    // Decrypt profile fields
    const decryptedAssignments = uniqueAssignments.map((assignment) => ({
      ...assignment,
      teacher: assignment.teacher ? decryptProfileFields(assignment.teacher) : assignment.teacher,
      creator: assignment.creator ? decryptProfileFields(assignment.creator) : assignment.creator,
    }))

    return decryptedAssignments
  } catch (error) {
    console.error('Error getting teacher certificate assignments:', error)
    return []
  }
}
// Create assignment
export const createCertificateAssignment = async (
  assignmentData: CreateCertificateAssignmentData,
  createdByUserId: string,
) => {
  // Validate that at least one of gurukul_id, course_id, or teacher_id is provided
  if (!assignmentData.gurukul_id && !assignmentData.course_id && !assignmentData.teacher_id) {
    throw new Error('Either gurukul_id, course_id, or teacher_id (profile UUID) must be provided')
  }

  // Check for duplicate assignment with detailed info
  const existingQuery = supabaseAdmin
    .from('certificate_assignments')
    .select(
      `
      id,
      created_at,
      template:certificate_templates(name),
      gurukul:gurukuls(name),
      course:courses(title),
      teacher:profiles!certificate_template_assignments_teacher_id_fkey(full_name),
      creator:profiles!created_by(full_name)
    `,
    )
    .eq('template_id', assignmentData.template_id)

  if (assignmentData.gurukul_id) {
    existingQuery.eq('gurukul_id', assignmentData.gurukul_id)
  } else {
    existingQuery.is('gurukul_id', null)
  }

  if (assignmentData.course_id) {
    existingQuery.eq('course_id', assignmentData.course_id)
  } else {
    existingQuery.is('course_id', null)
  }

  if (assignmentData.teacher_id) {
    existingQuery.eq('teacher_id', assignmentData.teacher_id) // teacher_id is profiles.id (UUID)
  } else {
    existingQuery.is('teacher_id', null) // NULL means applies to all
  }

  const { data: existing } = await existingQuery.single()

  if (existing) {
    // Type assertion for the complex joined data
    interface ExistingAssignment {
      template?: { name: string }
      teacher?: { full_name: string }
      course?: { title: string }
      gurukul?: { name: string }
      creator?: { full_name: string }
      created_at: string
    }

    const existingData = existing as unknown as ExistingAssignment
    const templateName = existingData.template?.name || 'Unknown Template'
    let targetInfo = ''

    if (assignmentData.teacher_id && existingData.teacher) {
      targetInfo = `teacher "${existingData.teacher.full_name}"`
    } else if (assignmentData.course_id && existingData.course) {
      targetInfo = `course "${existingData.course.title}"`
    } else if (assignmentData.gurukul_id && existingData.gurukul) {
      targetInfo = `gurukul "${existingData.gurukul.name}"`
    }

    const createdBy = existingData.creator?.full_name || 'Unknown User'
    const createdDate = existing.created_at
      ? new Date(existing.created_at).toLocaleDateString()
      : 'Unknown Date'

    throw new Error(
      `Template "${templateName}" is already assigned to ${targetInfo}. ` +
        `This assignment was created by ${createdBy} on ${createdDate}.`,
    )
  }

  const insertData = {
    template_id: assignmentData.template_id,
    gurukul_id: assignmentData.gurukul_id || null,
    course_id: assignmentData.course_id || null,
    teacher_id: assignmentData.teacher_id || null,
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
        teacher:profiles!teacher_id(*),
        creator:profiles!created_by(*)
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
}
// Update assignment
export const updateCertificateAssignment = async (
  id: string,
  updates: Partial<CreateCertificateAssignmentData>,
) => {
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
}
// Delete assignment
export const deleteCertificateAssignment = async (id: string) => {
  const { error } = await supabaseAdmin.from('certificate_assignments').delete().eq('id', id)
  if (error) {
    throw error
  }
  return true
}
// Get available gurukuls for assignment
export const getAvailableGurukuls = async () => {
  const gurukuls = await getGurukuls()
  return gurukuls.map((g) => ({
    id: g.id,
    name: g.name,
    status: g.is_active ? 'active' : 'inactive',
  }))
}
// Get available courses for assignment
export const getAvailableCourses = async (gurukulId?: string) => {
  const filters = gurukulId ? { gurukul_id: gurukulId } : undefined
  const courses = await getCourses(filters)
  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    gurukul_id: c.gurukul_id,
    status: 'active', // Assuming all returned courses are active
  }))
}

// Get available teachers for assignment
export const getAvailableTeachers = async () => {
  const { data: teachers, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('role', 'teacher')
    .eq('is_active', true)
    .order('full_name')

  if (error) {
    throw error
  }

  return teachers.map((teacher) => {
    const decrypted = decryptProfileFields(teacher)
    return {
      id: decrypted.id,
      name: decrypted.full_name,
      email: decrypted.email,
      status: 'active',
    }
  })
}

interface EnrollmentData {
  id: string
  status: string
  certificate_issued: boolean
  student_id: string
  profiles: {
    full_name: string
    email: string
  }
}

interface CourseWithEnrollments {
  id: string
  title: string
  description?: string
  enrollments: EnrollmentData[]
  [key: string]: unknown
}

interface BatchStudent {
  id: string
  student_id: string
  profiles: {
    full_name: string
    email: string
  }
}

interface BatchData {
  id: string
  name: string
  status: string
  certificates_issued?: boolean
  course: {
    id: string
    title: string
  }
  batch_students: BatchStudent[]
  [key: string]: unknown
}

/**
 * Get enhanced certificate assignment data for teachers with course and batch statistics
 */
export async function getTeacherCertificateManagementData(teacherId: string) {
  try {
    // Get basic assignments
    const assignments = await getTeacherCertificateAssignments(teacherId)

    // Get teacher's courses with enrollment statistics
    const { data: coursesData } = await supabaseAdmin
      .from('courses')
      .select(
        `
        *,
        enrollments(
          id,
          status,
          certificate_issued,
          student_id,
          profiles(full_name, email)
        )
      `,
      )
      .eq('teacher_id', teacherId)

    // Get teacher's batches with completion status
    const { data: batchesData } = await supabaseAdmin
      .from('batches')
      .select(
        `
        *,
        course:courses(id, title),
        batch_students(
          id,
          student_id,
          profiles(full_name, email)
        )
      `,
      )
      .eq('teacher_id', teacherId)

    // Calculate statistics for each course
    const coursesWithStats = ((coursesData as CourseWithEnrollments[]) || []).map((course) => {
      const enrollments = course.enrollments || []
      const completed = enrollments.filter((e) => e.status === 'completed')
      const certificatesIssued = enrollments.filter((e) => e.certificate_issued)
      const pendingCertificates = completed.filter((e) => !e.certificate_issued)

      return {
        ...course,
        stats: {
          totalEnrolled: enrollments.length,
          completed: completed.length,
          certificatesIssued: certificatesIssued.length,
          pendingCertificates: pendingCertificates.length,
          completionRate:
            enrollments.length > 0 ? (completed.length / enrollments.length) * 100 : 0,
        },
      }
    })

    // Calculate statistics for each batch
    const batchesWithStats = ((batchesData as BatchData[]) || []).map((batch) => {
      const students = batch.batch_students || []

      return {
        ...batch,
        stats: {
          totalStudents: students.length,
          certificatesIssued: batch.certificates_issued || false,
          canIssueCertificates: batch.status === 'completed' && !batch.certificates_issued,
        },
      }
    })

    // Get available templates for this teacher
    const availableTemplates = assignments.map((assignment) => assignment.template).filter(Boolean)

    return {
      assignments,
      courses: coursesWithStats,
      batches: batchesWithStats,
      templates: availableTemplates,
      summary: {
        totalCourses: coursesWithStats.length,
        totalBatches: batchesWithStats.length,
        totalTemplates: availableTemplates.length,
        totalPendingCertificates: coursesWithStats.reduce(
          (sum, course) => sum + course.stats.pendingCertificates,
          0,
        ),
        batchesReadyForCertificates: batchesWithStats.filter(
          (batch) => batch.stats.canIssueCertificates,
        ).length,
      },
    }
  } catch (error) {
    console.error('Error getting teacher certificate management data:', error)
    throw new Error('Failed to load certificate management data')
  }
}
