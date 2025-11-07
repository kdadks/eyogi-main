import { supabaseAdmin } from '../supabase'
import {
  Batch,
  BatchStudent,
  BatchCourse,
  BatchProgress,
  BatchStudentWithInfo,
  StudentBatchProgress,
  Course,
} from '../../types'

// Batch Management Functions

export async function getBatches(filters?: {
  gurukul_id?: string
  teacher_id?: string
  status?: string
  is_active?: boolean
}): Promise<Batch[]> {
  try {
    let query = supabaseAdmin.from('batches').select(`
        *,
        gurukul:gurukuls (
          id,
          name,
          slug,
          description,
          image_url
        ),
        teacher:profiles!batches_teacher_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        creator:profiles!batches_created_by_fkey (
          id,
          full_name,
          email,
          role
        )

      `)

    if (filters?.gurukul_id) {
      query = query.eq('gurukul_id', filters.gurukul_id)
    }
    if (filters?.teacher_id) {
      query = query.eq('teacher_id', filters.teacher_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching batches:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Fetch counts and progress for each batch
    const batchesWithData = await Promise.all(
      data.map(async (batch) => {
        try {
          // Get student count
          const { count: studentCount } = await supabaseAdmin
            .from('batch_students')
            .select('*', { count: 'exact', head: true })
            .eq('batch_id', batch.id)
            .eq('is_active', true)

          // Get course data through batch_courses junction table
          const { data: batchCoursesData } = await supabaseAdmin
            .from('batch_courses')
            .select(
              `
              courses (
                id,
                title,
                level,
                duration_weeks,
                course_number
              )
            `,
            )
            .eq('batch_id', batch.id)
            .eq('is_active', true)

          // Extract course data (assuming one course per batch for now)
          const courseData =
            batchCoursesData && batchCoursesData.length > 0 ? batchCoursesData[0].courses : null

          // Get progress data
          const progressData = await getBatchProgress(batch.id)

          return {
            ...batch,
            student_count: studentCount || 0,
            course_count: batchCoursesData?.length || 0,
            course: courseData,
            progress: progressData,
          }
        } catch (countError) {
          console.error(`Error fetching data for batch ${batch.id}:`, countError)
          return {
            ...batch,
            student_count: 0,
            course_count: 0,
            course: null,
            progress: [],
          }
        }
      }),
    )

    return batchesWithData
  } catch (error) {
    console.error('Error in getBatches:', error)
    return []
  }
}

export async function getBatch(id: string): Promise<Batch | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('batches')
      .select(
        `
        *,
        gurukul:gurukuls (
          id,
          name,
          slug,
          description,
          image_url
        ),
        teacher:profiles!batches_teacher_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        creator:profiles!batches_created_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching batch:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getBatch:', error)
    return null
  }
}

export async function createBatch(
  batch: Omit<Batch, 'id' | 'created_at' | 'updated_at'>,
): Promise<Batch> {
  try {
    const { data, error } = await supabaseAdmin
      .from('batches')
      .insert({
        ...batch,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        gurukul:gurukuls (
          id,
          name,
          slug,
          description,
          image_url
        ),
        teacher:profiles!batches_teacher_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        creator:profiles!batches_created_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error creating batch:', error)
      throw new Error('Failed to create batch')
    }

    return data
  } catch (error) {
    console.error('Error in createBatch:', error)
    throw error
  }
}

export async function updateBatch(id: string, updates: Partial<Batch>): Promise<Batch> {
  try {
    const { data, error } = await supabaseAdmin
      .from('batches')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        gurukul:gurukuls (
          id,
          name,
          slug,
          description,
          image_url
        ),
        teacher:profiles!batches_teacher_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        creator:profiles!batches_created_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error updating batch:', error)
      throw new Error('Failed to update batch')
    }

    return data
  } catch (error) {
    console.error('Error in updateBatch:', error)
    throw error
  }
}

export async function deleteBatch(id: string): Promise<void> {
  try {
    // Delete related records in the correct order (foreign key dependencies)

    // 1. Delete batch progress records
    const { error: progressError } = await supabaseAdmin
      .from('batch_progress')
      .delete()
      .eq('batch_id', id)

    if (progressError) {
      console.error('Error deleting batch progress:', progressError)
      throw new Error('Failed to delete batch progress records')
    }

    // 2. Delete batch student assignments
    const { error: studentsError } = await supabaseAdmin
      .from('batch_students')
      .delete()
      .eq('batch_id', id)

    if (studentsError) {
      console.error('Error deleting batch students:', studentsError)
      throw new Error('Failed to delete batch student assignments')
    }

    // 3. Delete batch course assignments
    const { error: coursesError } = await supabaseAdmin
      .from('batch_courses')
      .delete()
      .eq('batch_id', id)

    if (coursesError) {
      console.error('Error deleting batch courses:', coursesError)
      throw new Error('Failed to delete batch course assignments')
    }

    // 4. Finally delete the batch itself
    const { error: batchError } = await supabaseAdmin.from('batches').delete().eq('id', id)

    if (batchError) {
      console.error('Error deleting batch:', batchError)
      throw new Error('Failed to delete batch')
    }
  } catch (error) {
    console.error('Error in deleteBatch:', error)
    throw error
  }
}

// Student-Batch Assignment Functions

export async function getBatchStudents(batchId: string): Promise<BatchStudent[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('batch_students')
      .select(
        `
        *,
        student:profiles!batch_students_student_id_fkey (
          id,
          full_name,
          email,
          student_id,
          role
        ),
        batch:batches (
          id,
          name,
          description,
          status,
          gurukul:gurukuls (
            id,
            name,
            slug
          )
        ),
        assigned_by_user:profiles!batch_students_assigned_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .eq('batch_id', batchId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching batch students:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getBatchStudents:', error)
    return []
  }
}

export async function assignStudentToBatch(
  batchId: string,
  studentId: string,
  assignedBy: string,
): Promise<BatchStudent> {
  try {
    const { data, error } = await supabaseAdmin
      .from('batch_students')
      .insert({
        id: crypto.randomUUID(),
        batch_id: batchId,
        student_id: studentId,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        student:profiles!batch_students_student_id_fkey (
          id,
          full_name,
          email,
          student_id,
          role
        ),
        batch:batches (
          id,
          name,
          description,
          status,
          gurukul:gurukuls (
            id,
            name,
            slug
          )
        ),
        assigned_by_user:profiles!batch_students_assigned_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error assigning student to batch:', error)
      throw new Error('Failed to assign student to batch')
    }

    return data
  } catch (error) {
    console.error('Error in assignStudentToBatch:', error)
    throw error
  }
}

export async function removeStudentFromBatch(batchId: string, studentId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('batch_students')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('batch_id', batchId)
      .eq('student_id', studentId)

    if (error) {
      console.error('Error removing student from batch:', error)
      throw new Error('Failed to remove student from batch')
    }
  } catch (error) {
    console.error('Error in removeStudentFromBatch:', error)
    throw error
  }
}

// Batch-Course Assignment Functions

export async function getBatchCourses(batchId: string): Promise<BatchCourse[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('batch_courses')
      .select(
        `
        *,
        course:courses (
          id,
          title,
          description,
          level,
          duration_weeks,
          price,
          max_students
        ),
        batch:batches (
          id,
          name,
          description
        ),
        assigner:profiles!batch_courses_assigned_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .eq('batch_id', batchId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching batch courses:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getBatchCourses:', error)
    return []
  }
}

export async function assignCourseToBatch(
  batchId: string,
  courseId: string,
  assignedBy: string,
): Promise<BatchCourse> {
  try {
    // Check if course is already assigned to this batch
    const { data: existing } = await supabaseAdmin
      .from('batch_courses')
      .select('id, is_active')
      .eq('batch_id', batchId)
      .eq('course_id', courseId)
      .single()

    // If already exists and is active, return error
    if (existing && existing.is_active) {
      throw new Error('Course is already assigned to this batch')
    }

    // If exists but inactive, reactivate it
    if (existing && !existing.is_active) {
      const { data, error } = await supabaseAdmin
        .from('batch_courses')
        .update({
          is_active: true,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select(
          `
          *,
          course:courses (
            id,
            title,
            description,
            level,
            duration_weeks,
            price,
            max_students
          ),
          batch:batches (
            id,
            name,
            description
          ),
          assigner:profiles!batch_courses_assigned_by_fkey (
            id,
            full_name,
            email,
            role
          )
        `,
        )
        .single()

      if (error) {
        console.error('Error reactivating course assignment:', error)
        throw new Error('Failed to reactivate course assignment')
      }

      return data
    }

    // Otherwise, create new assignment
    const { data, error } = await supabaseAdmin
      .from('batch_courses')
      .insert({
        id: crypto.randomUUID(),
        batch_id: batchId,
        course_id: courseId,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        courses (
          id,
          title,
          description,
          level,
          duration_weeks,
          price,
          max_students
        ),
        batches (
          id,
          name,
          description
        ),
        assigner:profiles!batch_courses_assigned_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error assigning course to batch:', error)
      throw new Error('Failed to assign course to batch')
    }

    return data
  } catch (error) {
    console.error('Error in assignCourseToBatch:', error)
    throw error
  }
}

export async function removeCourseFromBatch(batchId: string, courseId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('batch_courses')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('batch_id', batchId)
      .eq('course_id', courseId)

    if (error) {
      console.error('Error removing course from batch:', error)
      throw new Error('Failed to remove course from batch')
    }
  } catch (error) {
    console.error('Error in removeCourseFromBatch:', error)
    throw error
  }
}

// Batch Analytics Functions

export async function getBatchStats(): Promise<{
  total: number
  active: number
  inactive: number
  completed: number
  archived: number
  in_progress: number
}> {
  try {
    const { data, error } = await supabaseAdmin.from('batches').select('status, is_active')

    if (error) {
      // Check if error is due to table not existing
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('Batches table does not exist yet, returning zero stats')
        return { total: 0, active: 0, inactive: 0, completed: 0, archived: 0, in_progress: 0 }
      }
      console.error('Error fetching batch stats:', error)
      return { total: 0, active: 0, inactive: 0, completed: 0, archived: 0, in_progress: 0 }
    }

    const stats = (data || []).reduce(
      (acc, batch) => {
        acc.total++

        // Count by status
        if (batch.status === 'active' || batch.status === 'in_progress') {
          acc.active++
        } else if (batch.status === 'completed') {
          acc.completed++
        } else if (batch.status === 'archived') {
          acc.archived++
        } else if (batch.status === 'inactive') {
          acc.inactive++
        }

        // Count in_progress separately if needed
        if (batch.status === 'in_progress') {
          acc.in_progress++
        }

        return acc
      },
      { total: 0, active: 0, inactive: 0, completed: 0, archived: 0, in_progress: 0 },
    )

    return stats
  } catch (error) {
    console.error('Error in getBatchStats:', error)
    return { total: 0, active: 0, inactive: 0, completed: 0, archived: 0, in_progress: 0 }
  }
}

export async function getStudentBatches(studentId: string): Promise<BatchStudent[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('batch_students')
      .select(
        `
        *,
        batch:batches (
          id,
          name,
          description,
          status,
          start_date,
          end_date,
          progress_percentage,
          gurukul:gurukuls (
            id,
            name,
            slug
          )
        ),
        assigned_by_user:profiles!batch_students_assigned_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .eq('student_id', studentId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching student batches:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getStudentBatches:', error)
    return []
  }
}

export async function getCompletedBatchStudents(
  teacherId: string,
): Promise<BatchStudentWithInfo[]> {
  try {
    // Get all completed batches for the teacher
    const { data: batchData, error: batchError } = await supabaseAdmin
      .from('batches')
      .select(
        `
        *,
        gurukul:gurukuls (
          id,
          name,
          slug
        ),
        batch_courses!inner (
          course:courses (
            id,
            title,
            duration_weeks
          )
        )
      `,
      )
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .eq('progress_percentage', 100) // Only batches that are 100% complete

    if (batchError) {
      console.error('Error fetching completed batches:', batchError)
      return []
    }

    if (!batchData || batchData.length === 0) {
      return []
    }

    // Get students from all completed batches
    const allStudentsPromises = batchData.map(async (batch) => {
      const { data: studentData, error: studentError } = await supabaseAdmin
        .from('batch_students')
        .select(
          `
          *,
          student:user_profiles!batch_students_student_id_fkey(
            id,
            full_name,
            email
          )
        `,
        )
        .eq('batch_id', batch.id)
        .eq('is_active', true)

      if (studentError) {
        console.error('Error fetching batch students:', studentError)
        return []
      }

      return (studentData || []).map((bs) => ({
        ...bs,
        name: bs.student?.full_name || 'Unknown Student',
        email: bs.student?.email || 'No Email',
        batch_name: batch.name,
        course_title: batch.batch_courses?.[0]?.course?.title || 'Unknown Course',
      }))
    })

    const allStudentArrays = await Promise.all(allStudentsPromises)
    const allStudents = allStudentArrays.flat()

    return allStudents
  } catch (error) {
    console.error('Error in getCompletedBatchStudents:', error)
    return []
  }
}

export async function getBatchProgress(batchId: string): Promise<BatchProgress[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('batch_progress')
      .select('*')
      .eq('batch_id', batchId)
      .order('week_number', { ascending: true })

    if (error) {
      console.error('Error fetching batch progress:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getBatchProgress:', error)
    return []
  }
}

// Get batch progress with course details for students
export async function getStudentBatchProgress(studentId: string): Promise<StudentBatchProgress[]> {
  try {
    // First get all batches the student is enrolled in
    const { data: studentBatches, error: batchError } = await supabaseAdmin
      .from('batch_students')
      .select(
        `
        batch_id,
        student_id,
        assigned_at,
        batch:batches (
          id,
          name,
          description,
          status,
          start_date,
          end_date,
          progress_percentage,
          gurukul:gurukuls (
            id,
            name,
            slug
          )
        )
      `,
      )
      .eq('student_id', studentId)
      .eq('is_active', true)

    if (batchError) {
      console.error('Error fetching student batches for progress:', batchError)
      return []
    }

    const batchProgressData = []

    // For each batch, get the progress and course information
    for (const studentBatch of studentBatches || []) {
      const batchId = studentBatch.batch_id

      // Get batch progress
      const { data: progress, error: progressError } = await supabaseAdmin
        .from('batch_progress')
        .select('*')
        .eq('batch_id', batchId)
        .order('week_number', { ascending: true })

      if (progressError) {
        console.error(`Error fetching progress for batch ${batchId}:`, progressError)
        continue
      }

      // Get course information for this batch
      const { data: batchCourses, error: courseError } = await supabaseAdmin
        .from('batch_courses')
        .select(
          `
          course_id,
          courses (
            id,
            title,
            description,
            duration_weeks,
            course_number
          )
        `,
        )
        .eq('batch_id', batchId)
        .eq('is_active', true)

      if (courseError) {
        console.error(`Error fetching courses for batch ${batchId}:`, courseError)
        continue
      }

      // Ensure we have batch data
      const batchData = Array.isArray(studentBatch.batch)
        ? studentBatch.batch[0]
        : studentBatch.batch
      if (batchData) {
        batchProgressData.push({
          batch: {
            id: batchData.id,
            name: batchData.name,
            description: batchData.description,
            status: batchData.status,
            start_date: batchData.start_date,
            end_date: batchData.end_date,
            progress_percentage: batchData.progress_percentage,
            gurukul: Array.isArray(batchData.gurukul) ? batchData.gurukul[0] : batchData.gurukul,
          },
          assigned_at: studentBatch.assigned_at,
          progress: progress || [],
          courses: batchCourses
            ? (batchCourses.map((bc) => ({
                course_id: bc.course_id,
                courses: Array.isArray(bc.courses) ? bc.courses[0] : bc.courses,
              })) as { course_id: string; courses: Course }[])
            : [],
          total_weeks: progress?.length || 0,
          completed_weeks: progress?.filter((p) => p.is_completed)?.length || 0,
          progress_percentage: batchData.progress_percentage || 0,
        })
      }
    }

    return batchProgressData
  } catch (error) {
    console.error('Error in getStudentBatchProgress:', error)
    return []
  }
}

export async function updateBatchProgress(
  batchId: string,
  weekNumber: number,
  isCompleted: boolean,
  teacherId: string,
): Promise<void> {
  try {
    // Upsert the progress record
    const { error: progressError } = await supabaseAdmin.from('batch_progress').upsert(
      {
        batch_id: batchId,
        week_number: weekNumber,
        is_completed: isCompleted,
        updated_by: teacherId,
        // completed_at will be handled by the database trigger
      },
      {
        onConflict: 'batch_id,week_number',
        ignoreDuplicates: false,
      },
    )

    if (progressError) {
      console.error('Error updating batch progress:', progressError)
      throw new Error('Failed to update week progress')
    }

    // Recalculate overall progress and update batch (status updates disabled for now)
    await updateBatchOverallProgress(batchId)
  } catch (error) {
    console.error('Error in updateBatchProgress:', error)
    throw error
  }
}

async function updateBatchOverallProgress(batchId: string): Promise<void> {
  try {
    // Get batch info
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      throw new Error('Failed to fetch batch information')
    }

    // Get course info through batch_courses junction table
    const { data: batchCoursesData, error: courseError } = await supabaseAdmin
      .from('batch_courses')
      .select(
        `
        courses (
          duration_weeks
        )
      `,
      )
      .eq('batch_id', batchId)
      .eq('is_active', true)
      .limit(1)

    if (courseError) {
      console.error('Error fetching course data:', courseError)
    }

    const courseData =
      batchCoursesData && batchCoursesData.length > 0 ? batchCoursesData[0].courses : null

    // Get all progress records for this batch
    const { data: progressRecords, error: progressError } = await supabaseAdmin
      .from('batch_progress')
      .select('*')
      .eq('batch_id', batchId)

    if (progressError) {
      throw new Error('Failed to fetch progress records')
    }

    const totalWeeks =
      courseData && 'duration_weeks' in courseData ? (courseData.duration_weeks as number) : 0
    const completedWeeks = progressRecords?.filter((p) => p.is_completed).length || 0

    const progressPercentage = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0

    // Prepare update data - now safe to update status since trigger is disabled
    const updateData: {
      progress_percentage: number
      updated_at: string
      status?: 'not_started' | 'active' | 'in_progress' | 'completed'
    } = {
      progress_percentage: progressPercentage,
      updated_at: new Date().toISOString(),
    }

    // Update status based on progress
    if (
      batch.status === 'not_started' ||
      batch.status === 'active' ||
      batch.status === 'in_progress'
    ) {
      if (progressPercentage === 100) {
        updateData.status = 'completed'
      } else if (progressPercentage > 0) {
        updateData.status = 'in_progress'
      } else if (batch.status === 'not_started') {
        updateData.status = 'active'
      }
    }

    console.log('Updating batch with data:', updateData)
    const { error: updateError } = await supabaseAdmin
      .from('batches')
      .update(updateData)
      .eq('id', batchId)

    if (updateError) {
      console.error('Batch update error:', updateError)
      throw new Error(`Failed to update batch progress: ${updateError.message}`)
    }
  } catch (error) {
    console.error('Error in updateBatchOverallProgress:', error)
    throw error
  }
}
