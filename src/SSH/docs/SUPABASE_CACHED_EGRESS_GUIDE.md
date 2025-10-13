# Supabase Cached Egress Implementation Guide

## Overview
Cached Egress reduces bandwidth costs by serving content from cache hits. This includes API responses, Storage files, and Edge Functions.

**Documentation**: https://supabase.com/docs/guides/platform/manage-your-usage/egress

---

## What is Cached Egress?

Cached Egress contains any outgoing traffic served from a cache hit, including:
- **API responses** (PostgREST, Auth, Realtime)
- **Storage files** (images, videos, documents)
- **Edge Functions** (serverless function responses)

### Benefits
- ✅ Reduced bandwidth costs
- ✅ Faster response times for users
- ✅ Lower server load
- ✅ Better scalability
- ✅ Improved user experience

---

## How Caching Works in Supabase

### 1. Storage Caching
Supabase Storage automatically caches files based on HTTP headers:
- Uses CDN (Content Delivery Network)
- Respects `Cache-Control` headers
- Caches based on file metadata

### 2. API Caching
PostgREST API responses can be cached:
- Uses `Cache-Control` headers
- Supports conditional requests (ETags)
- Configurable per-request

### 3. Edge Functions Caching
Edge Functions can return cached responses:
- Set custom cache headers
- Control cache duration
- Region-specific caching

---

## Implementation Steps

### Step 1: Enable Storage Caching

#### Configure Cache Headers for Uploaded Files

**When uploading files**, set cache headers:

```typescript
// Example: Uploading with cache headers
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload('path/to/file.jpg', file, {
    cacheControl: '3600', // Cache for 1 hour (in seconds)
    upsert: false,
  })
```

**Cache duration recommendations**:
- Images/Media: `31536000` (1 year) - for static content
- User avatars: `86400` (1 day) - frequently changing
- Course content: `604800` (1 week) - semi-static
- Temporary files: `3600` (1 hour) - short-lived

#### Get Public URL with Cache Headers

```typescript
const { data } = supabase.storage
  .from('bucket-name')
  .getPublicUrl('path/to/file.jpg', {
    transform: {
      width: 800,
      height: 600,
    },
  })
```

Supabase automatically serves these with appropriate cache headers.

---

### Step 2: Configure Database Query Caching

#### Using Cache-Control Headers in API Requests

While PostgREST doesn't cache by default, you can implement caching at the application level:

```typescript
// Fetch data with caching strategy
const fetchWithCache = async (key: string, queryFn: () => Promise<any>, ttl: number = 3600) => {
  // Check cache first
  const cached = sessionStorage.getItem(key)
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < ttl * 1000) {
      return data
    }
  }

  // Fetch fresh data
  const data = await queryFn()
  
  // Cache the result
  sessionStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now(),
  }))

  return data
}

// Usage
const courses = await fetchWithCache('courses', async () => {
  const { data } = await supabase.from('courses').select('*')
  return data
}, 3600) // Cache for 1 hour
```

---

### Step 3: Optimize Media Delivery

#### Enable Transformation Caching

When using Supabase Storage transformations:

```typescript
const { data } = supabase.storage
  .from('media')
  .getPublicUrl('image.jpg', {
    transform: {
      width: 800,
      height: 600,
      quality: 80,
      resize: 'contain',
    },
  })
```

**Transformations are automatically cached** by Supabase CDN.

---

### Step 4: Implement Smart Caching Strategy

#### Cache by Content Type

```typescript
// Cache durations by content type
const CACHE_DURATIONS = {
  // Static assets - cache for 1 year
  images: 31536000,
  videos: 31536000,
  documents: 31536000,
  
  // Semi-static content - cache for 1 week
  courses: 604800,
  gurukuls: 604800,
  
  // Dynamic content - cache for 1 hour
  enrollments: 3600,
  certificates: 86400,
  
  // User-specific - cache for 5 minutes
  profiles: 300,
  notifications: 300,
  
  // Real-time - no cache
  messages: 0,
  presence: 0,
}

export const getCacheDuration = (contentType: string): string => {
  return String(CACHE_DURATIONS[contentType] || 3600)
}
```

---

### Step 5: Configure Edge Functions (If Using)

If you're using Supabase Edge Functions, add cache headers:

```typescript
// Edge Function with caching
Deno.serve(async (req) => {
  const data = await fetchData()
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      'CDN-Cache-Control': 'max-age=7200',
    },
  })
})
```

---

## Best Practices

### 1. Set Appropriate Cache Durations

| Content Type | Recommended Duration | Reason |
|--------------|---------------------|--------|
| Static media (images, videos) | 1 year | Rarely changes |
| Course content | 1 week | Updates occasionally |
| User avatars | 1 day | May change frequently |
| User profiles | 5 minutes | Dynamic content |
| Real-time data | No cache | Always fresh |

### 2. Use Cache Busting

When content changes, update the filename or add query parameters:

```typescript
// Add version or timestamp to URL
const imageUrl = `${baseUrl}?v=${Date.now()}`

// Or use content hash
const imageUrl = `${baseUrl}?hash=${contentHash}`
```

### 3. Implement Stale-While-Revalidate

```typescript
// Serve cached content while fetching fresh data
const fetchWithSWR = async (key: string, queryFn: () => Promise<any>) => {
  const cached = localStorage.getItem(key)
  
  // Return cached data immediately
  if (cached) {
    const { data } = JSON.parse(cached)
    
    // Fetch fresh data in background
    queryFn().then(freshData => {
      localStorage.setItem(key, JSON.stringify({
        data: freshData,
        timestamp: Date.now(),
      }))
    })
    
    return data
  }
  
  // No cache, fetch and store
  const data = await queryFn()
  localStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now(),
  }))
  return data
}
```

### 4. Monitor Cache Performance

Track cache hit rates in your application:

```typescript
let cacheHits = 0
let cacheMisses = 0

const trackCacheHit = (hit: boolean) => {
  if (hit) cacheHits++
  else cacheMisses++
  
  console.log(`Cache hit rate: ${(cacheHits / (cacheHits + cacheMisses) * 100).toFixed(2)}%`)
}
```

---

## Supabase Dashboard Configuration

### Enable Caching in Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Select your bucket
3. Click **Settings**
4. Enable **Public access** (if needed for CDN caching)
5. Set default **Cache-Control** headers

### Configure Bucket Policies

```sql
-- Allow public read access for caching
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-media');
```

---

## Implementation Checklist

### For Your eYogi Gurukul Application

- [ ] **Storage Buckets**: Configure cache headers for media uploads
  - [ ] Course images: 1 year cache
  - [ ] User avatars: 1 day cache
  - [ ] Course materials: 1 week cache
  - [ ] Certificates: 1 day cache

- [ ] **API Responses**: Implement client-side caching
  - [ ] Courses list: Cache for 1 hour
  - [ ] Gurukuls list: Cache for 1 hour
  - [ ] User profiles: Cache for 5 minutes
  - [ ] Enrollments: Cache for 15 minutes

- [ ] **Media Transformations**: Use Supabase transformations
  - [ ] Thumbnail generation (auto-cached)
  - [ ] Image resizing (auto-cached)
  - [ ] Format conversion (auto-cached)

- [ ] **Cache Invalidation**: Implement cache busting
  - [ ] On content updates
  - [ ] On user actions
  - [ ] Manual refresh option

---

## Code Examples for Your Application

### Update Media Upload Function

```typescript
// src/lib/api/media.ts
export const uploadMediaWithCache = async (
  bucket: string,
  path: string,
  file: File,
  contentType: string
) => {
  const cacheDuration = getCacheDuration(contentType)
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: cacheDuration,
      contentType: file.type,
      upsert: false,
    })
  
  if (error) throw error
  
  return data
}
```

### Cached Query Wrapper

```typescript
// src/lib/cache.ts
export class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number }>()

  async get<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < ttl * 1000) {
      return cached.data as T
    }
    
    const data = await queryFn()
    this.cache.set(key, { data, timestamp: Date.now() })
    
    return data
  }

  invalidate(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }
}

export const queryCache = new QueryCache()
```

### Usage in Components

```typescript
// Fetch courses with caching
const loadCourses = async () => {
  const courses = await queryCache.get(
    'courses-list',
    async () => {
      const { data } = await supabase.from('courses').select('*')
      return data
    },
    3600 // 1 hour cache
  )
  
  setCourses(courses)
}

// Invalidate cache on update
const updateCourse = async (courseId: string, updates: any) => {
  await supabase.from('courses').update(updates).eq('id', courseId)
  
  // Invalidate cache
  queryCache.invalidate('courses-list')
  
  // Reload fresh data
  loadCourses()
}
```

---

## Monitoring & Analytics

### Track Cache Usage

```typescript
export const cacheMetrics = {
  hits: 0,
  misses: 0,
  
  recordHit() {
    this.hits++
  },
  
  recordMiss() {
    this.misses++
  },
  
  getHitRate() {
    const total = this.hits + this.misses
    return total > 0 ? (this.hits / total) * 100 : 0
  },
  
  reset() {
    this.hits = 0
    this.misses = 0
  },
}
```

### View Cache Statistics

```typescript
console.log(`Cache hit rate: ${cacheMetrics.getHitRate().toFixed(2)}%`)
console.log(`Total hits: ${cacheMetrics.hits}`)
console.log(`Total misses: ${cacheMetrics.misses}`)
```

---

## Expected Benefits

### Cost Reduction
- **Storage**: 50-70% reduction in egress costs
- **API**: 30-50% reduction in bandwidth
- **Overall**: Significant cost savings on high-traffic applications

### Performance Improvement
- **Page Load**: 2-3x faster with cached assets
- **API Response**: Sub-100ms for cached queries
- **User Experience**: Smoother, faster navigation

---

## Troubleshooting

### Cache Not Working?

1. **Check cache headers** in browser DevTools (Network tab)
2. **Verify public access** on storage buckets
3. **Clear browser cache** and test again
4. **Check CORS settings** in Supabase dashboard

### Cache Too Aggressive?

1. **Reduce TTL values** for dynamic content
2. **Implement cache invalidation** on updates
3. **Use versioned URLs** for content updates

### Cache Stale Data?

1. **Implement cache busting** with query parameters
2. **Add manual refresh** option for users
3. **Use shorter TTL** for frequently changing data

---

## Resources

- [Supabase Egress Documentation](https://supabase.com/docs/guides/platform/manage-your-usage/egress)
- [Supabase Storage Caching](https://supabase.com/docs/guides/storage/uploads/standard-uploads#cache-control)
- [HTTP Caching Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [CDN Caching Strategies](https://www.cloudflare.com/learning/cdn/what-is-caching/)

---

## Summary

Implementing Cached Egress in Supabase is straightforward:

1. ✅ Set `cacheControl` headers when uploading files
2. ✅ Use appropriate cache durations per content type
3. ✅ Implement client-side query caching
4. ✅ Leverage Supabase Storage transformations (auto-cached)
5. ✅ Monitor cache performance and optimize

**Result**: Lower costs, better performance, happier users! 🎉
