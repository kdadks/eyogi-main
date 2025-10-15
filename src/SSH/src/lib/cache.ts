/**
 * Caching Utilities for Supabase Cached Egress
 *
 * Implements client-side caching strategies to reduce bandwidth costs
 * and improve performance by leveraging Supabase Cached Egress.
 */

// Cache duration constants (in seconds)
export const CACHE_DURATIONS = {
  // Static assets - cache for 1 year
  STATIC_MEDIA: 31536000,
  IMAGES: 31536000,
  VIDEOS: 31536000,
  DOCUMENTS: 31536000,

  // Semi-static content - cache for 1 week
  COURSES: 604800,
  GURUKULS: 604800,
  BLOG_POSTS: 604800,

  // Dynamic content - cache for varying durations
  ENROLLMENTS: 3600, // 1 hour
  CERTIFICATES: 86400, // 1 day
  ANNOUNCEMENTS: 7200, // 2 hours
  COMPLIANCE: 86400, // 1 day - compliance data is stable
  DASHBOARD: 600, // 10 minutes - dashboard aggregates

  // User-specific - cache for short duration
  USER_PROFILE: 300, // 5 minutes
  NOTIFICATIONS: 300, // 5 minutes
  USER_AVATAR: 86400, // 1 day

  // Real-time - minimal or no cache
  MESSAGES: 0,
  PRESENCE: 0,
  LIVE_UPDATES: 60, // 1 minute
} as const

/**
 * Get cache duration for content type
 */
export const getCacheDuration = (contentType: keyof typeof CACHE_DURATIONS): number => {
  return CACHE_DURATIONS[contentType] || CACHE_DURATIONS.ENROLLMENTS
}

/**
 * Get cache control header string for content type
 */
export const getCacheControlHeader = (contentType: keyof typeof CACHE_DURATIONS): string => {
  const duration = getCacheDuration(contentType)

  if (duration === 0) {
    return 'no-cache, no-store, must-revalidate'
  }

  return `public, max-age=${duration}, s-maxage=${duration}`
}

/**
 * Cache metrics tracking
 */
export class CacheMetrics {
  private hits = 0
  private misses = 0
  private errors = 0

  recordHit(): void {
    this.hits++
  }

  recordMiss(): void {
    this.misses++
  }

  recordError(): void {
    this.errors++
  }

  getHitRate(): number {
    const total = this.hits + this.misses
    return total > 0 ? (this.hits / total) * 100 : 0
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      hitRate: this.getHitRate(),
      total: this.hits + this.misses,
    }
  }

  reset(): void {
    this.hits = 0
    this.misses = 0
    this.errors = 0
  }

  log(): void {
    const stats = this.getStats()
    console.log('Cache Statistics:', {
      'Hit Rate': `${stats.hitRate.toFixed(2)}%`,
      Hits: stats.hits,
      Misses: stats.misses,
      Errors: stats.errors,
      'Total Requests': stats.total,
    })
  }
}

export const cacheMetrics = new CacheMetrics()

/**
 * Query cache for storing API responses
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class QueryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private memoryLimit = 100 // Maximum number of entries

  /**
   * Get data from cache or execute query function
   */
  async get<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = CACHE_DURATIONS.ENROLLMENTS,
  ): Promise<T> {
    // Check if cache entry exists and is valid
    const cached = this.cache.get(key)
    const now = Date.now()

    if (cached && now - cached.timestamp < cached.ttl * 1000) {
      cacheMetrics.recordHit()
      return cached.data as T
    }

    // Cache miss or expired - fetch fresh data
    cacheMetrics.recordMiss()

    try {
      const data = await queryFn()

      // Store in cache
      this.set(key, data, ttl)

      return data
    } catch (error) {
      cacheMetrics.recordError()
      throw error
    }
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl: number = CACHE_DURATIONS.ENROLLMENTS): void {
    // Check memory limit
    if (this.cache.size >= this.memoryLimit) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const cached = this.cache.get(key)
    if (!cached) return false

    const now = Date.now()
    const isValid = now - cached.timestamp < cached.ttl * 1000

    if (!isValid) {
      this.cache.delete(key)
    }

    return isValid
  }
}

/**
 * Global query cache instance
 */
export const queryCache = new QueryCache()

/**
 * Storage cache helper for file URLs
 */
export class StorageCache {
  private urlCache = new Map<string, { url: string; timestamp: number }>()

  /**
   * Generate cache-busted URL
   */
  getCacheBustedUrl(baseUrl: string, version?: string | number): string {
    const url = new URL(baseUrl)
    const versionParam = version || Date.now()
    url.searchParams.set('v', String(versionParam))
    return url.toString()
  }

  /**
   * Get cached URL or generate new one
   */
  getUrl(path: string, generateUrl: () => string, ttl: number = CACHE_DURATIONS.IMAGES): string {
    const cached = this.urlCache.get(path)
    const now = Date.now()

    if (cached && now - cached.timestamp < ttl * 1000) {
      return cached.url
    }

    const url = generateUrl()
    this.urlCache.set(path, { url, timestamp: now })
    return url
  }

  /**
   * Invalidate URL cache
   */
  invalidate(path: string): void {
    this.urlCache.delete(path)
  }

  /**
   * Clear all URL cache
   */
  clear(): void {
    this.urlCache.clear()
  }
}

export const storageCache = new StorageCache()

/**
 * Stale-While-Revalidate caching strategy
 *
 * Returns cached data immediately while fetching fresh data in background
 */
export class SWRCache {
  private cache = new Map<string, unknown>()

  async get<T>(key: string, queryFn: () => Promise<T>, onUpdate?: (data: T) => void): Promise<T> {
    const cached = this.cache.get(key)

    if (cached) {
      cacheMetrics.recordHit()

      // Return cached data immediately
      const cachedData = cached as T

      // Fetch fresh data in background
      queryFn()
        .then((freshData) => {
          this.cache.set(key, freshData)
          if (onUpdate) {
            onUpdate(freshData)
          }
        })
        .catch((error) => {
          console.error('SWR background fetch failed:', error)
          cacheMetrics.recordError()
        })

      return cachedData
    }

    // No cache - fetch and store
    cacheMetrics.recordMiss()
    const data = await queryFn()
    this.cache.set(key, data)
    return data
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

export const swrCache = new SWRCache()

/**
 * Persistent storage cache using localStorage
 */
export class PersistentCache {
  private prefix = 'ssh-cache:'

  /**
   * Get data from persistent cache
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key)
      if (!item) return null

      const { data, timestamp, ttl } = JSON.parse(item)
      const now = Date.now()

      if (now - timestamp < ttl * 1000) {
        cacheMetrics.recordHit()
        return data as T
      }

      // Expired - remove
      this.remove(key)
      cacheMetrics.recordMiss()
      return null
    } catch (error) {
      console.error('PersistentCache get error:', error)
      cacheMetrics.recordError()
      return null
    }
  }

  /**
   * Set data in persistent cache
   */
  set<T>(key: string, data: T, ttl: number = CACHE_DURATIONS.ENROLLMENTS): void {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl,
      }
      localStorage.setItem(this.prefix + key, JSON.stringify(item))
    } catch (error) {
      console.error('PersistentCache set error:', error)
      cacheMetrics.recordError()
    }
  }

  /**
   * Remove specific cache entry
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch (error) {
      console.error('PersistentCache remove error:', error)
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))
    } catch (error) {
      console.error('PersistentCache clear error:', error)
    }
  }
}

export const persistentCache = new PersistentCache()

/**
 * Utility functions for cache management
 */

/**
 * Create cache key from parameters
 */
export const createCacheKey = (...parts: (string | number | boolean | undefined)[]): string => {
  return parts.filter(Boolean).join(':')
}

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    metrics: cacheMetrics.getStats(),
    queryCache: {
      size: queryCache.size(),
    },
  }
}

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
  queryCache.clear()
  storageCache.clear()
  swrCache.clear()
  persistentCache.clear()
  cacheMetrics.reset()
  console.log('All caches cleared')
}

/**
 * Log cache statistics
 */
export const logCacheStats = () => {
  console.log('=== Cache Statistics ===')
  cacheMetrics.log()
  console.log('Query Cache Size:', queryCache.size())
  console.log('=======================')
}
