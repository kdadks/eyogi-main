/**
 * Cached API Examples for SSH Application (UploadThing + Supabase)
 *
 * This file demonstrates how to implement caching for Supabase queries
 * to reduce bandwidth costs and improve performance.
 *
 * Note: Media files are stored in UploadThing which has built-in CDN caching,
 * so we focus on caching Supabase database queries.
 */

import { supabase } from './supabase'
import { queryCache, persistentCache, CACHE_DURATIONS, createCacheKey, cacheMetrics } from './cache'

// ============================================================================
// EXAMPLE 1: Cached Course Queries
// ============================================================================

/**
 * Get all courses with caching
 * Cache for 1 week since courses don't change frequently
 */
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
    CACHE_DURATIONS.COURSES, // 604800 seconds (1 week)
  )
}

/**
 * Get course by ID with caching
 */
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

/**
 * Get user profile with short-lived cache
 * Cache for 5 minutes since profiles can change
 */
export const getUserProfile = async (userId: string) => {
  const cacheKey = createCacheKey('profile', userId)

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) throw error
      return data
    },
    CACHE_DURATIONS.USER_PROFILE, // 300 seconds (5 minutes)
  )
}

// ============================================================================
// EXAMPLE 3: Cached Enrollment Data
// ============================================================================

/**
 * Get user enrollments with moderate caching
 * Cache for 1 hour - enrollments change but not too frequently
 */
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
    CACHE_DURATIONS.ENROLLMENTS, // 3600 seconds (1 hour)
  )
}

// ============================================================================
// EXAMPLE 4: Cached Compliance Data
// ============================================================================

/**
 * Get compliance items (templates) with long caching
 * These are templates that rarely change
 */
export const getComplianceItems = async () => {
  return queryCache.get(
    'compliance:items',
    async () => {
      const { data, error } = await supabase
        .from('compliance_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    CACHE_DURATIONS.COURSES, // 604800 seconds (1 week)
  )
}

/**
 * Get user's compliance submissions
 * Cache for 1 hour since submissions change regularly
 */
export const getUserComplianceSubmissions = async (userId: string) => {
  const cacheKey = createCacheKey('compliance:submissions', userId)

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('compliance_submissions')
        .select(
          `
          *,
          item:compliance_items(*)
        `,
        )
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      return data
    },
    CACHE_DURATIONS.ENROLLMENTS, // 3600 seconds (1 hour)
  )
}

// ============================================================================
// EXAMPLE 5: Cached Children Data (Parent Dashboard)
// ============================================================================

/**
 * Get parent's children with daily cache
 * Children data rarely changes
 */
export const getParentChildren = async (parentId: string) => {
  const cacheKey = createCacheKey('children', parentId)

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    CACHE_DURATIONS.CERTIFICATES, // 86400 seconds (1 day)
  )
}

// ============================================================================
// EXAMPLE 6: Cache Invalidation on Update
// ============================================================================

/**
 * Update course and invalidate related caches
 */
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

/**
 * Delete course and invalidate all course caches
 */
export const deleteCourse = async (courseId: string) => {
  const { error } = await supabase.from('courses').delete().eq('id', courseId)

  if (error) throw error

  // Invalidate all course-related caches
  queryCache.invalidatePattern('course.*')
}

/**
 * Enroll user in course and invalidate enrollment cache
 */
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

  return data
}

/**
 * Update profile and invalidate profile cache
 */
export const updateProfile = async (userId: string, updates: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error

  // Invalidate profile cache
  queryCache.invalidate(createCacheKey('profile', userId))

  return data
}

// ============================================================================
// EXAMPLE 7: Submit Compliance and Invalidate Cache
// ============================================================================

/**
 * Submit compliance item and invalidate user's submission cache
 */
export const submitCompliance = async (
  userId: string,
  itemId: string,
  fileUrl: string,
  notes?: string,
) => {
  const { data, error } = await supabase
    .from('compliance_submissions')
    .insert({
      user_id: userId,
      compliance_item_id: itemId,
      file_url: fileUrl,
      notes,
      submitted_at: new Date().toISOString(),
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error

  // Invalidate user's compliance cache
  queryCache.invalidate(createCacheKey('compliance:submissions', userId))

  return data
}

// ============================================================================
// EXAMPLE 8: Persistent Cache for Offline Support
// ============================================================================

/**
 * Get courses with persistent caching for offline support
 * Falls back to localStorage if API is unavailable
 */
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
// EXAMPLE 9: Real-time Data (No Cache)
// ============================================================================

/**
 * Get unread notifications - always fresh, no cache
 */
export const getUnreadNotifications = async (userId: string) => {
  // Don't cache real-time data
  const { data, error } = await supabase
    .from('compliance_notifications')
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

/**
 * Get cache performance statistics
 */
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

/**
 * Log cache performance to console
 */
export const logCachePerformance = () => {
  const stats = getCachePerformanceStats()
  console.log('=== Cache Performance ===')
  console.table(stats)
  console.log('========================')
}

// ============================================================================
// EXAMPLE 11: Preload Critical Data
// ============================================================================

/**
 * Preload critical data on application start
 */
export const preloadCriticalData = async () => {
  console.log('Preloading critical data...')

  try {
    // Preload courses
    await getCourses()

    // Preload compliance items
    await getComplianceItems()

    console.log('Critical data preloaded successfully')
  } catch (error) {
    console.error('Failed to preload critical data:', error)
  }
}

/**
 * Warm cache on application start
 */
export const warmCache = async () => {
  console.log('Warming cache...')

  const tasks = [getCourses(), getComplianceItems()]

  await Promise.allSettled(tasks)

  console.log('Cache warmed')
  logCachePerformance()
}

// ============================================================================
// EXAMPLE 12: Conditional Caching Based on User Role
// ============================================================================

/**
 * Get courses with different cache TTL based on user role
 * Admins get fresher data, students get longer cache
 */
export const getCoursesForUser = async (userId: string, userRole: string) => {
  // Admins get fresh data, students get cached data
  const ttl =
    userRole === 'admin'
      ? CACHE_DURATIONS.LIVE_UPDATES // 60 seconds for admins
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
// EXAMPLE 13: Global Cache Management
// ============================================================================

/**
 * Cache management utilities
 */
export const cacheManagement = {
  // Clear all caches
  clearAll: () => {
    queryCache.clear()
    persistentCache.clear()
    console.log('All caches cleared')
  },

  // Clear specific cache type
  clearQueryCache: () => {
    queryCache.clear()
    console.log('Query cache cleared')
  },

  // Clear persistent cache
  clearPersistentCache: () => {
    persistentCache.clear()
    console.log('Persistent cache cleared')
  },

  // Get statistics
  getStats: getCachePerformanceStats,

  // Log statistics
  logStats: logCachePerformance,

  // Warm cache
  warm: warmCache,

  // Clear user-specific caches (on logout)
  clearUserCaches: (userId: string) => {
    queryCache.invalidate(createCacheKey('profile', userId))
    queryCache.invalidate(createCacheKey('enrollments', userId))
    queryCache.invalidate(createCacheKey('compliance:submissions', userId))
    queryCache.invalidate(createCacheKey('children', userId))
    console.log(`Cleared caches for user: ${userId}`)
  },
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

3. Monitor cache performance:
   
   cacheManagement.logStats()
   // Shows hit rate, total requests, etc.

4. Warm cache on application start:
   
   // In your App.tsx or main component
   useEffect(() => {
     warmCache()
   }, [])

5. Clear cache on logout:
   
   const handleLogout = async () => {
     await supabase.auth.signOut()
     cacheManagement.clearUserCaches(userId)
   }

6. Note: Media files are stored in UploadThing which has built-in
   CDN caching, so no additional caching configuration is needed
   for images, videos, or documents.

*/
