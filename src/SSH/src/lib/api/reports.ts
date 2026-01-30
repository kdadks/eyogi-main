import { supabaseAdmin } from '../supabase'
import { decryptProfileFields } from '../encryption'

// Report Types
export interface EnrollmentReportFilters {
  startDate?: string
  endDate?: string
  status?: string
  gurukulId?: string
  courseId?: string
}

export interface EnrollmentReportRecord {
  student_id: string
  student_name: string
  student_email: string
  student_phone: string | null
  course_name: string
  gurukul_name: string
  enrollment_date: string
  enrollment_status: string
}

export interface BatchReportFilters {
  gurukulId?: string
  courseId?: string
  batchId?: string
  status?: string
}

export interface BatchReportRecord {
  batch_name: string
  gurukul_name: string
  course_name: string
  student_id: string
  student_name: string
  enrollment_status: string
  attendance_status: string
  attendance_percentage: number
}

/**
 * Generate enrollment report with filters
 */
export async function generateEnrollmentReport(
  filters: EnrollmentReportFilters = {},
): Promise<EnrollmentReportRecord[]> {
  try {
    let query = supabaseAdmin
      .from('enrollments')
      .select(
        `
        id,
        enrolled_at,
        status,
        student:profiles!enrollments_student_id_fkey (
          id,
          student_id,
          full_name,
          email,
          phone
        ),
        course:courses (
          id,
          title,
          gurukul:gurukuls (
            id,
            name
          )
        )
      `,
      )
      .order('enrolled_at', { ascending: false })

    // Apply filters
    if (filters.startDate) {
      query = query.gte('enrolled_at', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('enrolled_at', filters.endDate)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error generating enrollment report:', error)
      throw new Error('Failed to generate enrollment report')
    }

    if (!data || data.length === 0) {
      return []
    }

    // Filter by gurukul if specified (done post-query since it's nested)
    let filteredData = data
    if (filters.gurukulId) {
      filteredData = data.filter(
        (item) => (item.course as { gurukul?: { id: string } })?.gurukul?.id === filters.gurukulId,
      )
    }

    // Decrypt sensitive fields and transform to report format
    const decryptionPromises = filteredData.map(async (enrollment) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let studentData = enrollment.student as any
      if (studentData) {
        try {
          studentData = await decryptProfileFields(studentData)
        } catch (err) {
          console.error('Decryption error for student:', err)
        }
      }

      const courseData = enrollment.course as { title?: string; gurukul?: { name?: string } }

      return {
        student_id: studentData?.student_id || 'N/A',
        student_name: studentData?.full_name || 'N/A',
        student_email: studentData?.email || 'N/A',
        student_phone: studentData?.phone || null,
        course_name: courseData?.title || 'N/A',
        gurukul_name: courseData?.gurukul?.name || 'N/A',
        enrollment_date: enrollment.enrolled_at
          ? new Date(enrollment.enrolled_at).toLocaleDateString()
          : 'N/A',
        enrollment_status: enrollment.status || 'N/A',
      }
    })

    const records = await Promise.all(decryptionPromises)
    return records
  } catch (error) {
    console.error('Error in generateEnrollmentReport:', error)
    throw error
  }
}

/**
 * Generate batch report with student attendance
 */
export async function generateBatchReport(
  filters: BatchReportFilters = {},
): Promise<BatchReportRecord[]> {
  try {
    // First, get batch students with batch and course information
    let query = supabaseAdmin
      .from('batch_students')
      .select(
        `
        id,
        batch_id,
        student_id,
        is_active,
        batch:batches (
          id,
          name,
          status,
          gurukul:gurukuls (
            id,
            name
          )
        ),
        student:profiles!batch_students_student_id_fkey (
          id,
          student_id,
          full_name,
          email
        )
      `,
      )
      .eq('is_active', true)

    if (filters.batchId) {
      query = query.eq('batch_id', filters.batchId)
    }

    const { data: batchStudents, error: batchError } = await query

    if (batchError) {
      console.error('Error generating batch report:', batchError)
      throw new Error('Failed to generate batch report')
    }

    if (!batchStudents || batchStudents.length === 0) {
      return []
    }

    // Filter by gurukul if specified
    let filteredBatchStudents = batchStudents
    if (filters.gurukulId) {
      filteredBatchStudents = batchStudents.filter(
        (item) => (item.batch as { gurukul?: { id: string } })?.gurukul?.id === filters.gurukulId,
      )
    }

    // Filter by batch status if specified
    if (filters.status) {
      filteredBatchStudents = filteredBatchStudents.filter(
        (item) => (item.batch as { status?: string })?.status === filters.status,
      )
    }

    // Get batch IDs to fetch courses
    const batchIds = [...new Set(filteredBatchStudents.map((bs) => bs.batch_id))]

    // Fetch batch courses
    const { data: batchCourses } = await supabaseAdmin
      .from('batch_courses')
      .select(
        `
        batch_id,
        course:courses (
          id,
          title
        )
      `,
      )
      .in('batch_id', batchIds)
      .eq('is_active', true)

    // Create a map of batch_id to courses
    type BatchCourse = { batch_id: string; course: { id: string; title: string } }
    const batchCoursesMap = new Map<string, { id: string; title: string }[]>()
    ;(batchCourses as unknown as BatchCourse[])?.forEach((bc) => {
      if (!batchCoursesMap.has(bc.batch_id)) {
        batchCoursesMap.set(bc.batch_id, [])
      }
      batchCoursesMap.get(bc.batch_id)?.push(bc.course)
    })

    // Filter by course if specified
    if (filters.courseId) {
      filteredBatchStudents = filteredBatchStudents.filter((bs) => {
        const courses = batchCoursesMap.get(bs.batch_id) || []
        return courses.some((c) => c.id === filters.courseId)
      })
    }

    // Get student IDs and batch IDs to fetch attendance
    const studentIds = filteredBatchStudents.map((bs) => bs.student_id)

    // Fetch attendance records for these students
    const { data: attendanceRecords } = await supabaseAdmin
      .from('attendance')
      .select('student_id, batch_id, status')
      .in('student_id', studentIds)
      .in('batch_id', batchIds)

    // Calculate attendance for each student in each batch
    const attendanceMap = new Map<string, { total: number; present: number; percentage: number }>()

    attendanceRecords?.forEach((record) => {
      const key = `${record.student_id}_${record.batch_id}`
      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, { total: 0, present: 0, percentage: 0 })
      }
      const stats = attendanceMap.get(key)!
      stats.total++
      if (record.status === 'present') {
        stats.present++
      }
      stats.percentage = stats.total > 0 ? (stats.present / stats.total) * 100 : 0
    })

    // Get enrollment status for students
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('student_id, status')
      .in('student_id', studentIds)

    const enrollmentMap = new Map<string, string>()
    enrollments?.forEach((e) => {
      enrollmentMap.set(e.student_id, e.status)
    })

    // Decrypt sensitive fields and transform to report format
    const decryptionPromises = filteredBatchStudents.map(async (batchStudent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let studentData = batchStudent.student as any
      if (studentData) {
        try {
          studentData = await decryptProfileFields(studentData)
        } catch (err) {
          console.error('Decryption error for student:', err)
        }
      }

      const courses = batchCoursesMap.get(batchStudent.batch_id) || []
      const courseName = courses.length > 0 ? courses.map((c) => c.title).join(', ') : 'N/A'

      const attendanceKey = `${batchStudent.student_id}_${batchStudent.batch_id}`
      const attendance = attendanceMap.get(attendanceKey) || {
        total: 0,
        present: 0,
        percentage: 0,
      }

      const enrollmentStatus = enrollmentMap.get(batchStudent.student_id) || 'N/A'

      const attendanceStatus =
        attendance.total === 0
          ? 'No Records'
          : attendance.percentage >= 75
            ? 'Good'
            : attendance.percentage >= 50
              ? 'Average'
              : 'Poor'

      const batchData = batchStudent.batch as { name?: string; gurukul?: { name?: string } }

      return {
        batch_name: batchData?.name || 'N/A',
        gurukul_name: batchData?.gurukul?.name || 'N/A',
        course_name: courseName,
        student_id: studentData?.student_id || 'N/A',
        student_name: studentData?.full_name || 'N/A',
        enrollment_status: enrollmentStatus,
        attendance_status: attendanceStatus,
        attendance_percentage: Math.round(attendance.percentage),
      }
    })

    const records = await Promise.all(decryptionPromises)
    return records
  } catch (error) {
    console.error('Error in generateBatchReport:', error)
    throw error
  }
}

/**
 * Export report to CSV format
 */
export function exportToCSV(data: unknown[], filename: string): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  // Get headers from the first record
  const headers = Object.keys(data[0] as Record<string, unknown>)

  // Create CSV content
  const csvContent = [
    // Headers row
    headers.join(','),
    // Data rows
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = (row as Record<string, unknown>)[header]
          // Handle null/undefined
          if (value === null || value === undefined) {
            return ''
          }
          // Escape commas and quotes in values
          const stringValue = String(value)
          if (
            stringValue.includes(',') ||
            stringValue.includes('"') ||
            stringValue.includes('\n')
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        .join(','),
    ),
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
