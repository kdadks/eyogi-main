import { supabaseAdmin } from '../supabase'
import { Gurukul } from '../../types'
export async function getGurukuls(): Promise<Gurukul[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('gurukuls')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (error) {
      return []
    }
    return data || []
  } catch {
    return []
  }
}
export async function getAllGurukuls(): Promise<Gurukul[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('gurukuls')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      return []
    }
    return data || []
  } catch {
    return []
  }
}
export async function getGurukul(slug: string): Promise<Gurukul | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('gurukuls')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    if (error) {
      return null
    }
    return data
  } catch {
    return null
  }
}
export async function createGurukul(
  gurukul: Omit<Gurukul, 'id' | 'created_at' | 'updated_at'>,
): Promise<Gurukul> {
  try {
    const { data, error } = await supabaseAdmin
      .from('gurukuls')
      .insert({
        ...gurukul,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      throw new Error('Failed to create gurukul')
    }
    return data
  } catch (error) {
    throw error
  }
}
export async function updateGurukul(id: string, updates: Partial<Gurukul>): Promise<Gurukul> {
  try {
    const { data, error } = await supabaseAdmin
      .from('gurukuls')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      throw new Error('Failed to update gurukul')
    }
    return data
  } catch (error) {
    throw error
  }
}
export async function deleteGurukul(id: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('gurukuls').update({ is_active: false }).eq('id', id)
    if (error) {
      throw new Error('Failed to delete gurukul')
    }
  } catch (error) {
    throw error
  }
}

export async function getGurukulsWithStats(): Promise<Array<Gurukul & { courses: number; students: number; image: string }>> {
  try {
    // First get all active gurukuls
    const { data: gurukuls, error: gurukulError } = await supabaseAdmin
      .from('gurukuls')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (gurukulError) {
      return []
    }

    if (!gurukuls || gurukuls.length === 0) {
      return []
    }

    // Get course counts for each gurukul
    const { data: courseStats, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('gurukul_id')
      .eq('is_active', true)

    // Get enrollment counts (students) for each gurukul
    const { data: enrollmentStats, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        course_id,
        courses!inner (
          gurukul_id
        )
      `)
      .eq('status', 'approved')

    if (courseError || enrollmentError) {
      // If we can't get stats, return gurukuls with zero counts
      return gurukuls.map(gurukul => ({
        ...gurukul,
        courses: 0,
        students: 0,
        image: gurukul.image_url || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=300&fit=crop'
      }))
    }

    // Count courses per gurukul
    const courseCounts = (courseStats || []).reduce((acc, course) => {
      acc[course.gurukul_id] = (acc[course.gurukul_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Count students per gurukul
    const studentCounts = (enrollmentStats || []).reduce((acc, enrollment: any) => {
      const gurukulId = enrollment.courses?.gurukul_id
      if (gurukulId) {
        acc[gurukulId] = (acc[gurukulId] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Combine data
    return gurukuls.map(gurukul => ({
      ...gurukul,
      courses: courseCounts[gurukul.id] || 0,
      students: studentCounts[gurukul.id] || 0,
      image: gurukul.image_url || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=300&fit=crop'
    }))
  } catch {
    return []
  }
}
