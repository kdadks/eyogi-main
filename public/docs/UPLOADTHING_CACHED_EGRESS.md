# Cached Egress Strategy for UploadThing + Supabase

## 🎯 Your Setup

- **Media Storage**: UploadThing (images, videos, documents)
- **Database**: Supabase PostgreSQL (courses, users, enrollments)
- **Backend**: Serverless functions + Express server

---

## 📊 Where Caching Matters

### ✅ What We CAN Cache (High Impact)

1. **Supabase API Queries** - 30-50% bandwidth reduction
   - Course lists
   - Gurukul data
   - User profiles
   - Enrollment data
   - Compliance submissions

2. **UploadThing URLs** - Already cached by UploadThing CDN
   - Images served via `https://utfs.io/f/{fileKey}`
   - Automatically cached by UploadThing's CDN
   - No configuration needed!

3. **Computed/Derived Data** - Reduce database load
   - Enrollment counts
   - Progress calculations
   - Dashboard statistics

### ⚠️ What UploadThing Already Handles

**UploadThing automatically provides:**
- ✅ CDN caching (global edge network)
- ✅ Image optimization
- ✅ Automatic cache headers
- ✅ Fast global delivery

**You don't need to configure caching for UploadThing files!**

---

## 🚀 Implementation Strategy

### Phase 1: Cache Supabase API Queries (Highest ROI)

This is where you'll see the biggest benefit since UploadThing already handles media caching.

#### 1.1 Cache Course Queries

```typescript
import { queryCache, CACHE_DURATIONS, createCacheKey } from '@/lib/cache'
import { supabase } from '@/lib/supabase'

// Before: Direct query every time
export const getCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// After: Cached query (cache for 1 week)
export const getCourses = async () => {
  return queryCache.get(
    'courses:all',
    async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    CACHE_DURATIONS.COURSES // 604800 seconds (1 week)
  )
}
```

#### 1.2 Cache User Enrollments

```typescript
export const getUserEnrollments = async (userId: string) => {
  return queryCache.get(
    createCacheKey('enrollments', userId),
    async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('student_id', userId)
        .order('enrolled_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    CACHE_DURATIONS.ENROLLMENTS // 3600 seconds (1 hour)
  )
}
```

#### 1.3 Cache User Profiles

```typescript
export const getUserProfile = async (userId: string) => {
  return queryCache.get(
    createCacheKey('profile', userId),
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data
    },
    CACHE_DURATIONS.USER_PROFILE // 300 seconds (5 minutes)
  )
}
```

---

### Phase 2: Cache Invalidation on Updates

**Critical**: Always invalidate cache when data changes!

```typescript
// Update course and invalidate cache
export const updateCourse = async (courseId: string, updates: any) => {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single()
  
  if (error) throw error
  
  // Invalidate related caches
  queryCache.invalidate('courses:all')
  queryCache.invalidate(createCacheKey('course', courseId))
  
  return data
}

// Enroll in course and invalidate cache
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
```

---

### Phase 3: URL Caching for UploadThing (Optional)

While UploadThing handles CDN caching, you can cache the URL lookups in your app:

```typescript
import { storageCache, CACHE_DURATIONS } from '@/lib/cache'

// Cache UploadThing URL lookups
export const getImageUrl = (fileKey: string): string => {
  return storageCache.getUrl(
    `uploadthing:${fileKey}`,
    () => `https://utfs.io/f/${fileKey}`,
    CACHE_DURATIONS.IMAGES
  )
}

// With transformation parameters
export const getImageUrlWithParams = (
  fileKey: string,
  width?: number,
  height?: number,
  quality?: number
): string => {
  const params = new URLSearchParams()
  if (width) params.set('w', String(width))
  if (height) params.set('h', String(height))
  if (quality) params.set('q', String(quality))
  
  const cacheKey = `uploadthing:${fileKey}:${params.toString()}`
  
  return storageCache.getUrl(
    cacheKey,
    () => {
      const url = `https://utfs.io/f/${fileKey}`
      return params.toString() ? `${url}?${params.toString()}` : url
    },
    CACHE_DURATIONS.IMAGES
  )
}
```

---

## 📁 Files to Update

### Priority 1: Database Query Files

Search for `supabase.from().select()` in these files:

```bash
# Find all Supabase queries
grep -r "supabase.from" src/ --include="*.ts" --include="*.tsx"
```

**Likely files to update:**
- `src/hooks/useCourses.ts`
- `src/hooks/useEnrollments.ts`
- `src/hooks/useProfile.ts`
- `src/components/admin/CourseManagement.tsx`
- `src/components/parent/ParentDashboard.tsx`
- `src/lib/api/courses.ts`
- `src/lib/api/enrollments.ts`

### Priority 2: Dashboard Components

Add caching to high-traffic components:
- Parent Dashboard (enrollment data)
- Admin Dashboard (statistics)
- Course listings
- Compliance submissions

---

## 🎯 Quick Wins for Your Setup

### Quick Win #1: Cache Course List (10 minutes)

**Location**: Where you fetch course lists (probably in `useCourses` hook or similar)

**Before:**
```typescript
const { data: courses } = await supabase.from('courses').select('*')
```

**After:**
```typescript
import { queryCache, CACHE_DURATIONS } from '@/lib/cache'

const courses = await queryCache.get(
  'courses:all',
  async () => {
    const { data, error } = await supabase.from('courses').select('*')
    if (error) throw error
    return data
  },
  CACHE_DURATIONS.COURSES
)
```

**Impact**: 30-50% reduction in course query bandwidth

---

### Quick Win #2: Cache Compliance Submissions (10 minutes)

**Location**: Compliance data fetching

**Before:**
```typescript
const { data } = await supabase
  .from('compliance_submissions')
  .select('*')
  .eq('user_id', userId)
```

**After:**
```typescript
const submissions = await queryCache.get(
  `compliance:${userId}`,
  async () => {
    const { data, error } = await supabase
      .from('compliance_submissions')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    return data
  },
  CACHE_DURATIONS.ENROLLMENTS // 1 hour
)
```

**Impact**: Faster dashboard loading, reduced database load

---

### Quick Win #3: Cache Parent's Children List (10 minutes)

**Location**: Parent dashboard

**Before:**
```typescript
const { data: children } = await supabase
  .from('children')
  .select('*')
  .eq('parent_id', parentId)
```

**After:**
```typescript
const children = await queryCache.get(
  `children:${parentId}`,
  async () => {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId)
    if (error) throw error
    return data
  },
  CACHE_DURATIONS.USER_PROFILE // 5 minutes
)
```

**Impact**: Faster parent dashboard, reduced repeated queries

---

## 💡 UploadThing-Specific Best Practices

### 1. Use UploadThing's Built-in CDN

UploadThing URLs are automatically cached globally:
```typescript
// This is automatically cached by UploadThing's CDN
const imageUrl = `https://utfs.io/f/${fileKey}`
```

### 2. Leverage UploadThing Transformations

UploadThing supports image transformations via query parameters:
```typescript
// Resized image (cached by CDN)
const thumbnail = `https://utfs.io/f/${fileKey}?w=300&h=200&q=80`
```

### 3. Cache Database References, Not Files

Cache the database records that reference UploadThing files:
```typescript
// Cache the course data (which includes image URLs)
const course = await queryCache.get(
  `course:${courseId}`,
  async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*, image_url, thumbnail_url')
      .eq('id', courseId)
      .single()
    
    if (error) throw error
    return data
  },
  CACHE_DURATIONS.COURSES
)

// The image URLs are already cached by UploadThing CDN
console.log(course.image_url) // https://utfs.io/f/abc123 (cached)
```

---

## 📊 Expected Savings for Your Setup

### Supabase API Bandwidth

**Before Caching:**
- Course queries: 1000 requests/day × 50KB = 50MB/day
- Enrollment queries: 500 requests/day × 30KB = 15MB/day
- Profile queries: 800 requests/day × 10KB = 8MB/day
- **Total**: 73MB/day = 2.19GB/month

**After Caching (70% hit rate):**
- Cached requests: 70% = 1.53GB/month (no egress cost)
- Fresh requests: 30% = 0.66GB/month
- **Savings**: 1.53GB × $0.09 = **$0.14/month**

*Savings scale with usage*

### UploadThing

**UploadThing already provides:**
- Free CDN caching (included)
- No additional configuration needed
- Global edge network
- Automatic cache optimization

---

## 🧪 Testing Your Implementation

### Test 1: Verify Query Caching

```typescript
import { cacheMetrics, queryCache } from '@/lib/cache'

// Load page first time
await getCourses() // Cache miss

// Load page second time
await getCourses() // Cache hit!

// Check stats
console.log(cacheMetrics.getStats())
// Output: { hits: 1, misses: 1, hitRate: 50.0 }
```

### Test 2: Verify Cache Invalidation

```typescript
// Load courses (cached)
const courses1 = await getCourses()

// Update a course
await updateCourse(courseId, { title: 'Updated' })

// Load courses again (should be fresh)
const courses2 = await getCourses()

// Should reflect the update
console.log(courses2.find(c => c.id === courseId).title) // 'Updated'
```

### Test 3: Monitor Network Tab

1. Open DevTools → Network tab
2. Load a page with cached queries
3. Reload the page
4. Check that API requests are fewer on reload
5. UploadThing images should show `(from disk cache)`

---

## 📈 Implementation Checklist

### Phase 1: Core Query Caching

- [ ] **Install dependencies** (already done)
  ```bash
  # Cache utilities are already in src/lib/cache.ts
  ```

- [ ] **Cache course queries**
  - [ ] Find `supabase.from('courses').select()`
  - [ ] Wrap with `queryCache.get()`
  - [ ] Add cache invalidation to update functions

- [ ] **Cache enrollment queries**
  - [ ] Find enrollment queries
  - [ ] Wrap with `queryCache.get()`
  - [ ] Invalidate on new enrollments

- [ ] **Cache profile queries**
  - [ ] Find profile queries
  - [ ] Wrap with `queryCache.get()`
  - [ ] Invalidate on profile updates

- [ ] **Cache compliance data**
  - [ ] Find compliance queries
  - [ ] Wrap with `queryCache.get()`
  - [ ] Invalidate on submissions

### Phase 2: Cache Invalidation

- [ ] **Update functions**
  - [ ] Add `queryCache.invalidate()` to all update functions
  - [ ] Test data freshness after updates

- [ ] **Delete functions**
  - [ ] Add `queryCache.invalidate()` to delete functions
  - [ ] Use `invalidatePattern()` for bulk operations

- [ ] **Insert functions**
  - [ ] Invalidate related caches on new records
  - [ ] Test that lists update immediately

### Phase 3: Monitoring

- [ ] **Add cache stats to admin dashboard**
  ```typescript
  import { cacheMetrics } from '@/lib/cache'
  
  const stats = cacheMetrics.getStats()
  console.log(`Hit Rate: ${stats.hitRate.toFixed(2)}%`)
  ```

- [ ] **Monitor Supabase usage**
  - [ ] Check API egress in Supabase Dashboard
  - [ ] Compare before/after metrics

- [ ] **Optimize TTL values**
  - [ ] Adjust based on actual usage patterns
  - [ ] Increase for static data
  - [ ] Decrease for dynamic data

---

## 🎯 Recommended Cache Durations for Your App

Based on your Supabase schema:

| Data Type | Table | Cache Duration | Reasoning |
|-----------|-------|----------------|-----------|
| Courses | `courses` | 1 week | Rarely updated |
| Gurukuls | `gurukuls` | 1 week | Rarely updated |
| Enrollments | `enrollments` | 1 hour | Changes regularly |
| User Profiles | `profiles` | 5 minutes | Can change frequently |
| Compliance Items | `compliance_items` | 1 week | Templates, rarely change |
| Compliance Submissions | `compliance_submissions` | 1 hour | Updated regularly |
| Notifications | `compliance_notifications` | 5 minutes | Need to be fresh |
| Children | `children` | 1 day | Rarely change |

---

## 🔧 Practical Examples for Your Codebase

### Example 1: Cache in Custom Hook

```typescript
// src/hooks/useCourses.ts
import { useEffect, useState } from 'react'
import { queryCache, CACHE_DURATIONS } from '@/lib/cache'
import { supabase } from '@/lib/supabase'

export const useCourses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const data = await queryCache.get(
        'courses:all',
        async () => {
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) throw error
          return data
        },
        CACHE_DURATIONS.COURSES
      )
      
      setCourses(data)
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  return { courses, loading, refresh: loadCourses }
}
```

### Example 2: Cache in Admin Component

```typescript
// src/components/admin/CourseManagement.tsx
import { queryCache, createCacheKey } from '@/lib/cache'

const CourseManagement = () => {
  const handleUpdateCourse = async (courseId: string, updates: any) => {
    // Update in database
    const { error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
    
    if (error) throw error
    
    // Invalidate caches
    queryCache.invalidate('courses:all')
    queryCache.invalidate(createCacheKey('course', courseId))
    
    // Reload courses
    await loadCourses()
  }

  return (
    // Your component JSX
  )
}
```

### Example 3: Cache Compliance Dashboard Data

```typescript
// src/components/parent/ComplianceDashboard.tsx
import { queryCache, CACHE_DURATIONS, createCacheKey } from '@/lib/cache'

const ComplianceDashboard = ({ userId }: { userId: string }) => {
  const loadComplianceData = async () => {
    const submissions = await queryCache.get(
      createCacheKey('compliance:submissions', userId),
      async () => {
        const { data, error } = await supabase
          .from('compliance_submissions')
          .select(`
            *,
            item:compliance_items(*)
          `)
          .eq('user_id', userId)
          .order('submitted_at', { ascending: false })
        
        if (error) throw error
        return data
      },
      CACHE_DURATIONS.ENROLLMENTS // 1 hour
    )
    
    return submissions
  }

  return (
    // Your component JSX
  )
}
```

---

## ✅ Summary

### What to Focus On

1. ✅ **Cache Supabase queries** - This is where you'll see the biggest benefit
2. ✅ **Don't worry about UploadThing** - Already optimized with CDN
3. ✅ **Always invalidate on updates** - Ensures data freshness
4. ✅ **Monitor cache hit rate** - Aim for 60%+

### What You Get

- 30-50% reduction in Supabase API bandwidth
- Faster page loads (cached responses)
- Reduced database load
- Better scalability
- No configuration needed for UploadThing (already cached!)

### Next Steps

1. Start with **Quick Win #1** (cache course queries)
2. Add cache invalidation to update functions
3. Monitor cache hit rate
4. Gradually add caching to more queries
5. Optimize TTL values based on usage

---

**Ready to start? Begin with Quick Win #1 and cache those course queries! 🚀**
