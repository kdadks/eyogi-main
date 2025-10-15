/**
 * Example: Integrating Cached Egress with Supabase API Calls
 *
 * This file demonstrates how to implement caching for your SSH application
 * to reduce bandwidth costs and improve performance.
 */

import { supabase } from './supabase'
import {
  queryCache,
  persistentCache,
  storageCache,
  CACHE_DURATIONS,
  createCacheKey,
  cacheMetrics,
} from './cache'

// ============================================================================
// EXAMPLE 1: Cached Course Queries
// ============================================================================

export const getCourses = async () => {
  const cacheKey = 'courses:all'

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    CACHE_DURATIONS.COURSES, // Cache for 1 week
  )
}

export const getCourseById = async (courseId: string) => {
  const cacheKey = createCacheKey('course', courseId)

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single()

      if (error) throw error
      return data
    },
    CACHE_DURATIONS.COURSES,
  )
}

// ============================================================================
// EXAMPLE 2: Cached User Profile with Short TTL
// ============================================================================

export const getUserProfile = async (userId: string) => {
  const cacheKey = createCacheKey('profile', userId)

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) throw error
      return data
    },
    CACHE_DURATIONS.USER_PROFILE, // Cache for 5 minutes
  )
}

// ============================================================================
// EXAMPLE 3: Storage File Upload with Cache Headers
// ============================================================================

export const uploadCourseImage = async (courseId: string, file: File): Promise<string> => {
  const fileName = `${courseId}/${Date.now()}-${file.name}`
  const bucket = 'course-images'

  // Upload with cache headers
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: String(CACHE_DURATIONS.IMAGES), // Cache for 1 year
    contentType: file.type,
    upsert: false,
  })

  if (error) throw error

  // Get public URL (automatically cached by CDN)
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

  return urlData.publicUrl
}

export const uploadUserAvatar = async (userId: string, file: File): Promise<string> => {
  const fileName = `avatars/${userId}`
  const bucket = 'user-avatars'

  // Upload with shorter cache (avatars change more frequently)
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: String(CACHE_DURATIONS.USER_AVATAR), // Cache for 1 day
    contentType: file.type,
    upsert: true, // Overwrite existing avatar
  })

  if (error) throw error

  // Invalidate cached URL
  storageCache.invalidate(fileName)

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

  return urlData.publicUrl
}

// ============================================================================
// EXAMPLE 4: Cached Enrollment Data
// ============================================================================

export const getUserEnrollments = async (userId: string) => {
  const cacheKey = createCacheKey('enrollments', userId)

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(
          `
          *,
          course:courses(*)
        `,
        )
        .eq('student_id', userId)
        .order('enrolled_at', { ascending: false })

      if (error) throw error
      return data
    },
    CACHE_DURATIONS.ENROLLMENTS, // Cache for 1 hour
  )
}

// ============================================================================
// EXAMPLE 5: Cached Image Transformations
// ============================================================================

export const getTransformedImage = (
  bucket: string,
  path: string,
  width: number,
  height: number,
  quality: number = 80,
): string => {
  // Create cache key for this transformation
  const cacheKey = `${bucket}:${path}:${width}x${height}:q${quality}`

  return storageCache.getUrl(
    cacheKey,
    () => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
        transform: {
          width,
          height,
          quality,
          resize: 'contain',
        },
      })

      return data.publicUrl
    },
    CACHE_DURATIONS.IMAGES,
  )
}

// ============================================================================
// EXAMPLE 6: Cache Invalidation on Update
// ============================================================================

export const updateCourse = async (courseId: string, updates: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single()

  if (error) throw error

  // Invalidate related caches
  queryCache.invalidate(createCacheKey('course', courseId))
  queryCache.invalidate('courses:all')

  return data
}

export const deleteCourse = async (courseId: string) => {
  const { error } = await supabase.from('courses').delete().eq('id', courseId)

  if (error) throw error

  // Invalidate all course caches
  queryCache.invalidatePattern('course.*')
}

// ============================================================================
// EXAMPLE 7: Persistent Cache for Offline Support
// ============================================================================

export const getCoursesWithPersistence = async () => {
  const cacheKey = 'courses:all:persistent'

  // Try to get from persistent cache first
  const cached = persistentCache.get(cacheKey)
  if (cached) {
    console.log('Loaded courses from persistent cache')
    return cached
  }

  // Fetch from API
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Store in persistent cache
  persistentCache.set(cacheKey, data, CACHE_DURATIONS.COURSES)

  return data
}

// ============================================================================
// EXAMPLE 8: Batch Operations with Cache Management
// ============================================================================

export const enrollInCourse = async (userId: string, courseId: string) => {
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      student_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error

  // Invalidate user's enrollment cache
  queryCache.invalidate(createCacheKey('enrollments', userId))

  // Invalidate course enrollment count cache
  queryCache.invalidate(createCacheKey('course:enrollments', courseId))

  return data
}

// ============================================================================
// EXAMPLE 9: Real-time Data (No Cache)
// ============================================================================

export const getUnreadNotifications = async (userId: string) => {
  // Don't cache real-time data
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================================================
// EXAMPLE 10: Cache Statistics and Monitoring
// ============================================================================

export const getCachePerformanceStats = () => {
  const stats = cacheMetrics.getStats()

  return {
    hitRate: `${stats.hitRate.toFixed(2)}%`,
    totalHits: stats.hits,
    totalMisses: stats.misses,
    totalErrors: stats.errors,
    totalRequests: stats.total,
    queryCacheSize: queryCache.size(),
  }
}

export const logCachePerformance = () => {
  const stats = getCachePerformanceStats()
  console.log('=== Cache Performance ===')
  console.table(stats)
  console.log('======================')
}

// ============================================================================
// EXAMPLE 11: Preload Critical Data
// ============================================================================

export const preloadCriticalData = async () => {
  console.log('Preloading critical data...')

  try {
    // Preload courses
    await getCourses()

    // Preload gurukuls (if you have this table)
    // await getGurukuls()

    console.log('Critical data preloaded successfully')
  } catch (error) {
    console.error('Failed to preload critical data:', error)
  }
}

// ============================================================================
// EXAMPLE 12: Cache Warming on Application Start
// ============================================================================

export const warmCache = async () => {
  console.log('Warming cache...')

  const tasks = [
    getCourses(),
    // Add more critical queries here
  ]

  await Promise.allSettled(tasks)

  console.log('Cache warmed')
  logCachePerformance()
}

// ============================================================================
// EXAMPLE 13: Conditional Caching Based on User Role
// ============================================================================

export const getCoursesForUser = async (userId: string, userRole: string) => {
  // Admins get fresh data, students get cached data
  const ttl =
    userRole === 'admin'
      ? CACHE_DURATIONS.LIVE_UPDATES // 1 minute for admins
      : CACHE_DURATIONS.COURSES // 1 week for students

  const cacheKey = createCacheKey('courses', userRole)

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    ttl,
  )
}

// ============================================================================
// EXAMPLE 14: Export Functions for Global Cache Management
// ============================================================================

export const cacheManagement = {
  // Clear all caches
  clearAll: () => {
    queryCache.clear()
    storageCache.clear()
    persistentCache.clear()
    console.log('All caches cleared')
  },

  // Clear specific cache type
  clearQueryCache: () => {
    queryCache.clear()
    console.log('Query cache cleared')
  },

  // Clear storage cache
  clearStorageCache: () => {
    storageCache.clear()
    console.log('Storage cache cleared')
  },

  // Get statistics
  getStats: getCachePerformanceStats,

  // Log statistics
  logStats: logCachePerformance,

  // Warm cache
  warm: warmCache,
}

// ============================================================================
// Usage Instructions:
// ============================================================================
/*

1. Replace your existing API calls with cached versions:
   
   // Before
   const { data } = await supabase.from('courses').select('*')
   
   // After
   const data = await getCourses()

2. Invalidate cache when data changes:
   
   await updateCourse(courseId, { title: 'New Title' })
   // Cache automatically invalidated

3. Upload files with cache headers:
   
   const imageUrl = await uploadCourseImage(courseId, file)
   // File automatically cached for 1 year

4. Monitor cache performance:
   
   cacheManagement.logStats()
   // Shows hit rate, total requests, etc.

5. Warm cache on application start:
   
   // In your App.tsx or main component
   useEffect(() => {
     warmCache()
   }, [])

6. Clear cache manually:
   
   cacheManagement.clearAll() // Clear everything
   cacheManagement.clearQueryCache() // Clear only query cache

*/
