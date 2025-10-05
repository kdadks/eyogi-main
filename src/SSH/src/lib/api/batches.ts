import { supabaseAdmin } from '../supabase'
import { Batch, BatchStudent, BatchCourse } from '../../types'

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

    // Fetch counts for each batch
    const batchesWithCounts = await Promise.all(
      data.map(async (batch) => {
        try {
          // Get student count
          const { count: studentCount } = await supabaseAdmin
            .from('batch_students')
            .select('*', { count: 'exact', head: true })
            .eq('batch_id', batch.id)
            .eq('is_active', true)

          // Get course count
          const { count: courseCount } = await supabaseAdmin
            .from('batch_courses')
            .select('*', { count: 'exact', head: true })
            .eq('batch_id', batch.id)
            .eq('is_active', true)

          return {
            ...batch,
            student_count: studentCount || 0,
            course_count: courseCount || 0,
          }
        } catch (countError) {
          console.error(`Error fetching counts for batch ${batch.id}:`, countError)
          return {
            ...batch,
            student_count: 0,
            course_count: 0,
          }
        }
      }),
    )

    return batchesWithCounts
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
    const { error } = await supabaseAdmin
      .from('batches')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting batch:', error)
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
}> {
  try {
    const { data, error } = await supabaseAdmin.from('batches').select('status, is_active')

    if (error) {
      // Check if error is due to table not existing
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('Batches table does not exist yet, returning zero stats')
        return { total: 0, active: 0, inactive: 0, completed: 0, archived: 0 }
      }
      console.error('Error fetching batch stats:', error)
      return { total: 0, active: 0, inactive: 0, completed: 0, archived: 0 }
    }

    const stats = (data || []).reduce(
      (acc, batch) => {
        if (batch.is_active) {
          acc.total++
          acc[batch.status as keyof typeof acc]++
        }
        return acc
      },
      { total: 0, active: 0, inactive: 0, completed: 0, archived: 0 },
    )

    return stats
  } catch (error) {
    console.error('Error in getBatchStats:', error)
    return { total: 0, active: 0, inactive: 0, completed: 0, archived: 0 }
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
