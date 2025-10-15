import { supabaseAdmin } from '../supabase'
import { queryCache, CACHE_DURATIONS, createCacheKey } from '../cache'
import { Gurukul } from '../../types'
import { DEFAULT_IMAGES } from '../constants/images'
export async function getGurukuls(): Promise<Gurukul[]> {
  const cacheKey = createCacheKey('gurukuls', 'active')

  return queryCache.get(
    cacheKey,
    async () => {
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
    },
    CACHE_DURATIONS.GURUKULS, // 1 week
  )
}
export async function getAllGurukuls(): Promise<Gurukul[]> {
  const cacheKey = createCacheKey('gurukuls', 'all')

  return queryCache.get(
    cacheKey,
    async () => {
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
    },
    CACHE_DURATIONS.GURUKULS, // 1 week
  )
}
export async function getGurukul(slug: string): Promise<Gurukul | null> {
  const cacheKey = createCacheKey('gurukuls', 'slug', slug)

  return queryCache.get(
    cacheKey,
    async () => {
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
    },
    CACHE_DURATIONS.GURUKULS, // 1 week
  )
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

    // Invalidate all gurukul caches
    queryCache.invalidatePattern('gurukuls:.*')

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

    // Invalidate all gurukul caches
    queryCache.invalidatePattern('gurukuls:.*')

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

    // Invalidate all gurukul caches
    queryCache.invalidatePattern('gurukuls:.*')
  } catch (error) {
    throw error
  }
}

export async function getGurukulsWithStats(): Promise<
  Array<Gurukul & { courses: number; students: number; image: string }>
> {
  const cacheKey = createCacheKey('gurukuls', 'with-stats')

  return queryCache.get(
    cacheKey,
    async () => {
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
          .select(
            `
        course_id,
        courses!inner (
          gurukul_id
        )
      `,
          )
          .eq('status', 'approved')

        if (courseError || enrollmentError) {
          // If we can't get stats, return gurukuls with zero counts
          return gurukuls.map((gurukul) => ({
            ...gurukul,
            courses: 0,
            students: 0,
            image: gurukul.cover_image_url || gurukul.image_url || DEFAULT_IMAGES.GURUKUL_COVER,
          }))
        }

        // Count courses per gurukul
        const courseCounts = (courseStats || []).reduce(
          (acc, course) => {
            acc[course.gurukul_id] = (acc[course.gurukul_id] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        // Count students per gurukul
        const studentCounts = (enrollmentStats || []).reduce(
          (acc, enrollment: Record<string, unknown>) => {
            const courses = enrollment.courses as { gurukul_id?: string } | undefined
            const gurukulId = courses?.gurukul_id
            if (gurukulId) {
              acc[gurukulId] = (acc[gurukulId] || 0) + 1
            }
            return acc
          },
          {} as Record<string, number>,
        )

        // Combine data
        return gurukuls.map((gurukul) => ({
          ...gurukul,
          courses: courseCounts[gurukul.id] || 0,
          students: studentCounts[gurukul.id] || 0,
          image: gurukul.cover_image_url || gurukul.image_url || DEFAULT_IMAGES.GURUKUL_COVER,
        }))
      } catch {
        return []
      }
    },
    CACHE_DURATIONS.GURUKULS, // 1 week
  )
}
