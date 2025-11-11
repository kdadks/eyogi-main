import { supabaseAdmin } from '../supabase'
import {
  AttendanceRecord,
  AttendanceSession,
  AttendanceStats,
  StudentAttendanceSummary,
  BatchAttendanceSummary,
} from '../../types'

/**
 * Attendance Management API Functions
 *
 * Provides CRUD operations for attendance records and sessions
 * with proper error handling and data validation
 */

// ============================================================================
// ATTENDANCE RECORDS
// ============================================================================

/**
 * Mark attendance for a single student
 */
export async function markAttendance(params: {
  batch_id: string
  student_id: string
  class_date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  marked_by: string
  notes?: string
}): Promise<AttendanceRecord | null> {
  try {
    const now = new Date().toISOString()

    // Check if attendance already exists for this student on this date
    const { data: existing } = await supabaseAdmin
      .from('attendance_records')
      .select('id')
      .eq('batch_id', params.batch_id)
      .eq('student_id', params.student_id)
      .eq('class_date', params.class_date)
      .single()

    if (existing) {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from('attendance_records')
        .update({
          status: params.status,
          marked_by: params.marked_by,
          marked_at: now,
          notes: params.notes || null,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select(
          `
          *,
          student:profiles!attendance_records_student_id_fkey (
            id,
            full_name,
            email,
            student_id,
            avatar_url
          ),
          marked_by_user:profiles!attendance_records_marked_by_fkey (
            id,
            full_name,
            email
          )
        `,
        )
        .single()

      if (error) {
        console.error('Error updating attendance record:', error)
        return null
      }

      return data
    } else {
      // Create new record
      const { data, error } = await supabaseAdmin
        .from('attendance_records')
        .insert({
          id: crypto.randomUUID(),
          batch_id: params.batch_id,
          student_id: params.student_id,
          class_date: params.class_date,
          status: params.status,
          marked_by: params.marked_by,
          marked_at: now,
          notes: params.notes || null,
          created_at: now,
          updated_at: now,
        })
        .select(
          `
          *,
          student:profiles!attendance_records_student_id_fkey (
            id,
            full_name,
            email,
            student_id,
            avatar_url
          ),
          marked_by_user:profiles!attendance_records_marked_by_fkey (
            id,
            full_name,
            email
          )
        `,
        )
        .single()

      if (error) {
        console.error('Error creating attendance record:', error)
        return null
      }

      return data
    }
  } catch (error) {
    console.error('Error in markAttendance:', error)
    return null
  }
}

/**
 * Mark attendance for multiple students at once (bulk marking)
 */
export async function bulkMarkAttendance(params: {
  batch_id: string
  class_date: string
  marked_by: string
  attendance_records: Array<{
    student_id: string
    status: 'present' | 'absent' | 'late' | 'excused'
    notes?: string
  }>
}): Promise<{ success: boolean; errors: string[] }> {
  try {
    const now = new Date().toISOString()
    const errors: string[] = []

    // Process each attendance record
    for (const record of params.attendance_records) {
      const result = await markAttendance({
        batch_id: params.batch_id,
        student_id: record.student_id,
        class_date: params.class_date,
        status: record.status,
        marked_by: params.marked_by,
        notes: record.notes,
      })

      if (!result) {
        errors.push(`Failed to mark attendance for student ${record.student_id}`)
      }
    }

    return {
      success: errors.length === 0,
      errors,
    }
  } catch (error) {
    console.error('Error in bulkMarkAttendance:', error)
    return {
      success: false,
      errors: ['Failed to mark bulk attendance'],
    }
  }
}

/**
 * Get attendance records for a batch
 */
export async function getAttendanceRecords(params: {
  batch_id?: string
  student_id?: string
  class_date?: string
  start_date?: string
  end_date?: string
}): Promise<AttendanceRecord[]> {
  try {
    let query = supabaseAdmin.from('attendance_records').select(
      `
        *,
        student:profiles!attendance_records_student_id_fkey (
          id,
          full_name,
          email,
          student_id,
          avatar_url
        ),
        marked_by_user:profiles!attendance_records_marked_by_fkey (
          id,
          full_name,
          email
        ),
        batch:batches (
          id,
          name,
          description
        )
      `,
    )

    if (params.batch_id) {
      query = query.eq('batch_id', params.batch_id)
    }

    if (params.student_id) {
      query = query.eq('student_id', params.student_id)
    }

    if (params.class_date) {
      query = query.eq('class_date', params.class_date)
    }

    if (params.start_date) {
      query = query.gte('class_date', params.start_date)
    }

    if (params.end_date) {
      query = query.lte('class_date', params.end_date)
    }

    const { data, error } = await query.order('class_date', { ascending: false })

    if (error) {
      console.error('Error fetching attendance records:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAttendanceRecords:', error)
    return []
  }
}

/**
 * Update an existing attendance record
 */
export async function updateAttendanceRecord(
  id: string,
  updates: {
    status?: 'present' | 'absent' | 'late' | 'excused'
    notes?: string
    marked_by?: string
  },
): Promise<AttendanceRecord | null> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('attendance_records')
      .update({
        ...updates,
        marked_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .select(
        `
        *,
        student:profiles!attendance_records_student_id_fkey (
          id,
          full_name,
          email,
          student_id,
          avatar_url
        ),
        marked_by_user:profiles!attendance_records_marked_by_fkey (
          id,
          full_name,
          email
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error updating attendance record:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateAttendanceRecord:', error)
    return null
  }
}

/**
 * Delete an attendance record
 */
export async function deleteAttendanceRecord(id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('attendance_records').delete().eq('id', id)

    if (error) {
      console.error('Error deleting attendance record:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteAttendanceRecord:', error)
    return false
  }
}

// ============================================================================
// ATTENDANCE SESSIONS
// ============================================================================

/**
 * Create an attendance session
 */
export async function createAttendanceSession(params: {
  batch_id: string
  class_date: string
  session_number: number
  topic?: string
  notes?: string
  created_by: string
}): Promise<AttendanceSession | null> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('attendance_sessions')
      .insert({
        id: crypto.randomUUID(),
        batch_id: params.batch_id,
        class_date: params.class_date,
        session_number: params.session_number,
        topic: params.topic || null,
        notes: params.notes || null,
        created_by: params.created_by,
        created_at: now,
        updated_at: now,
      })
      .select(
        `
        *,
        batch:batches (
          id,
          name,
          description
        ),
        created_by_user:profiles!attendance_sessions_created_by_fkey (
          id,
          full_name,
          email
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error creating attendance session:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createAttendanceSession:', error)
    return null
  }
}

/**
 * Get attendance sessions for a batch
 */
export async function getAttendanceSessions(params: {
  batch_id?: string
  class_date?: string
  start_date?: string
  end_date?: string
}): Promise<AttendanceSession[]> {
  try {
    let query = supabaseAdmin.from('attendance_sessions').select(
      `
        *,
        batch:batches (
          id,
          name,
          description
        ),
        created_by_user:profiles!attendance_sessions_created_by_fkey (
          id,
          full_name,
          email
        )
      `,
    )

    if (params.batch_id) {
      query = query.eq('batch_id', params.batch_id)
    }

    if (params.class_date) {
      query = query.eq('class_date', params.class_date)
    }

    if (params.start_date) {
      query = query.gte('class_date', params.start_date)
    }

    if (params.end_date) {
      query = query.lte('class_date', params.end_date)
    }

    const { data, error } = await query.order('class_date', { ascending: false })

    if (error) {
      console.error('Error fetching attendance sessions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAttendanceSessions:', error)
    return []
  }
}

/**
 * Update an attendance session
 */
export async function updateAttendanceSession(
  id: string,
  updates: {
    topic?: string
    notes?: string
  },
): Promise<AttendanceSession | null> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('attendance_sessions')
      .update({
        ...updates,
        updated_at: now,
      })
      .eq('id', id)
      .select(
        `
        *,
        batch:batches (
          id,
          name,
          description
        ),
        created_by_user:profiles!attendance_sessions_created_by_fkey (
          id,
          full_name,
          email
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error updating attendance session:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateAttendanceSession:', error)
    return null
  }
}

// ============================================================================
// ATTENDANCE STATISTICS AND REPORTS
// ============================================================================

/**
 * Get attendance statistics for a student in a specific batch
 */
export async function getStudentAttendanceStats(
  student_id: string,
  batch_id: string,
): Promise<AttendanceStats> {
  try {
    const { data, error } = await supabaseAdmin
      .from('attendance_records')
      .select('status')
      .eq('student_id', student_id)
      .eq('batch_id', batch_id)

    if (error || !data) {
      console.error('Error fetching attendance stats:', error)
      return {
        total_classes: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendance_percentage: 0,
      }
    }

    const stats = {
      total_classes: data.length,
      present: data.filter((r) => r.status === 'present').length,
      absent: data.filter((r) => r.status === 'absent').length,
      late: data.filter((r) => r.status === 'late').length,
      excused: data.filter((r) => r.status === 'excused').length,
      attendance_percentage: 0,
    }

    // Calculate attendance percentage (present + late + excused / total)
    const attendedClasses = stats.present + stats.late + stats.excused
    stats.attendance_percentage =
      stats.total_classes > 0 ? (attendedClasses / stats.total_classes) * 100 : 0

    return stats
  } catch (error) {
    console.error('Error in getStudentAttendanceStats:', error)
    return {
      total_classes: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendance_percentage: 0,
    }
  }
}

/**
 * Get attendance summary for all students in a batch
 */
export async function getBatchAttendanceSummary(
  batch_id: string,
): Promise<BatchAttendanceSummary | null> {
  try {
    // Get batch details
    const { data: batchData } = await supabaseAdmin
      .from('batches')
      .select('id, name')
      .eq('id', batch_id)
      .single()

    if (!batchData) {
      return null
    }

    // Get all students in the batch
    const { data: students } = await supabaseAdmin
      .from('batch_students')
      .select(
        `
        student_id,
        student:profiles!batch_students_student_id_fkey (
          id,
          full_name,
          email
        )
      `,
      )
      .eq('batch_id', batch_id)
      .eq('is_active', true)

    if (!students || students.length === 0) {
      return {
        batch_id,
        batch_name: batchData.name,
        total_students: 0,
        total_sessions: 0,
        average_attendance_percentage: 0,
        student_summaries: [],
      }
    }

    // Get total number of sessions
    const { count: totalSessions } = await supabaseAdmin
      .from('attendance_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', batch_id)

    // Get attendance summaries for each student
    const studentSummaries: StudentAttendanceSummary[] = await Promise.all(
      students.map(async (s) => {
        const stats = await getStudentAttendanceStats(s.student_id, batch_id)
        const recentRecords = await getAttendanceRecords({
          batch_id,
          student_id: s.student_id,
        })

        return {
          student_id: s.student_id,
          student_name: s.student.full_name || 'Unknown',
          student_email: s.student.email,
          batch_id,
          batch_name: batchData.name,
          stats,
          recent_records: recentRecords.slice(0, 5), // Last 5 records
        }
      }),
    )

    // Calculate average attendance percentage
    const totalAttendancePercentage = studentSummaries.reduce(
      (sum, s) => sum + s.stats.attendance_percentage,
      0,
    )
    const averageAttendancePercentage =
      studentSummaries.length > 0 ? totalAttendancePercentage / studentSummaries.length : 0

    return {
      batch_id,
      batch_name: batchData.name,
      total_students: students.length,
      total_sessions: totalSessions || 0,
      average_attendance_percentage: averageAttendancePercentage,
      student_summaries: studentSummaries,
    }
  } catch (error) {
    console.error('Error in getBatchAttendanceSummary:', error)
    return null
  }
}

/**
 * Get attendance summary for a specific student across all batches
 */
export async function getStudentAttendanceSummary(
  student_id: string,
): Promise<StudentAttendanceSummary[]> {
  try {
    // Get all batches the student is enrolled in
    const { data: batches } = await supabaseAdmin
      .from('batch_students')
      .select(
        `
        batch_id,
        batch:batches (
          id,
          name
        )
      `,
      )
      .eq('student_id', student_id)
      .eq('is_active', true)

    if (!batches || batches.length === 0) {
      return []
    }

    // Get attendance summary for each batch
    const summaries: StudentAttendanceSummary[] = await Promise.all(
      batches.map(async (b) => {
        const stats = await getStudentAttendanceStats(student_id, b.batch_id)
        const recentRecords = await getAttendanceRecords({
          batch_id: b.batch_id,
          student_id,
        })

        // Get student details
        const { data: studentData } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('id', student_id)
          .single()

        return {
          student_id,
          student_name: studentData?.full_name || 'Unknown',
          student_email: studentData?.email || '',
          batch_id: b.batch_id,
          batch_name: b.batch.name,
          stats,
          recent_records: recentRecords.slice(0, 5), // Last 5 records
        }
      }),
    )

    return summaries
  } catch (error) {
    console.error('Error in getStudentAttendanceSummary:', error)
    return []
  }
}

/**
 * Get attendance report for a date range
 */
export async function getAttendanceReport(params: {
  batch_id: string
  start_date: string
  end_date: string
}): Promise<{
  sessions: AttendanceSession[]
  records: AttendanceRecord[]
  summary: BatchAttendanceSummary | null
}> {
  try {
    const [sessions, records, summary] = await Promise.all([
      getAttendanceSessions({
        batch_id: params.batch_id,
        start_date: params.start_date,
        end_date: params.end_date,
      }),
      getAttendanceRecords({
        batch_id: params.batch_id,
        start_date: params.start_date,
        end_date: params.end_date,
      }),
      getBatchAttendanceSummary(params.batch_id),
    ])

    return {
      sessions,
      records,
      summary,
    }
  } catch (error) {
    console.error('Error in getAttendanceReport:', error)
    return {
      sessions: [],
      records: [],
      summary: null,
    }
  }
}
