# Quick Start: Enable Caching (UploadThing + Supabase Setup)

## ⚡ Your Setup Summary

- ✅ **Media Storage**: UploadThing (already has CDN caching built-in!)
- 🔄 **Database**: Supabase (needs caching implementation)
- 🎯 **Focus**: Cache Supabase database queries to reduce bandwidth costs

---

## 🚀 Quick Start (15 Minutes)

### Step 1: Understand What's Already Cached (2 minutes)

**UploadThing automatically caches:**
- ✅ All images, videos, documents
- ✅ Global CDN delivery
- ✅ Automatic cache headers
- ✅ Image transformations

**You don't need to do anything for UploadThing media!**

---

### Step 2: Implement Your First Cached Query (10 minutes)

Find where you fetch courses (probably in a hook or component):

**Before:**
```typescript
const { data: courses, error } = await supabase
  .from('courses')
  .select('*')
```

**After:**
```typescript
import { queryCache, CACHE_DURATIONS } from '@/lib/cache'

const courses = await queryCache.get(
  'courses:all',
  async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
    if (error) throw error
    return data
  },
  CACHE_DURATIONS.COURSES // Cache for 1 week
)
```

**Files to check:**
```
src/hooks/useCourses.ts
src/components/admin/CourseManagement.tsx
src/pages/courses/index.tsx
```

---

### Step 3: Test and Verify (3 minutes)

```typescript
// In browser console (after implementing caching)
import { cacheMetrics } from '@/lib/cache'

// Load your page twice
// First load: Cache miss
// Second load: Cache hit!

// Check stats
console.log(cacheMetrics.getStats())
// Expected: { hits: 1, misses: 1, hitRate: 50% }
```

---

## 📝 3 More Quick Wins (30 Minutes Total)

### Quick Win #2: Cache Enrollments (10 min)

```typescript
import { queryCache, CACHE_DURATIONS, createCacheKey } from '@/lib/cache'

// Before
const { data } = await supabase
  .from('enrollments')
  .select('*')
  .eq('student_id', userId)

// After
const enrollments = await queryCache.get(
  createCacheKey('enrollments', userId),
  async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', userId)
    if (error) throw error
    return data
  },
  CACHE_DURATIONS.ENROLLMENTS // 1 hour
)
```

---

### Quick Win #3: Cache Compliance Data (10 min)

```typescript
// Cache compliance submissions
const submissions = await queryCache.get(
  createCacheKey('compliance:submissions', userId),
  async () => {
    const { data, error } = await supabase
      .from('compliance_submissions')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    return data
  },
  CACHE_DURATIONS.ENROLLMENTS
)
```

---

### Quick Win #4: Add Cache Invalidation (10 min)

**IMPORTANT**: Invalidate cache when data changes!

```typescript
import { queryCache, createCacheKey } from '@/lib/cache'

// When updating a course
export const updateCourse = async (courseId: string, updates: any) => {
  await supabase.from('courses').update(updates).eq('id', courseId)
  
  // Invalidate caches
  queryCache.invalidate('courses:all')
  queryCache.invalidate(createCacheKey('course', courseId))
}

// When enrolling in a course
export const enrollInCourse = async (userId: string, courseId: string) => {
  await supabase.from('enrollments').insert({ student_id: userId, course_id: courseId })
  
  // Invalidate enrollment cache
  queryCache.invalidate(createCacheKey('enrollments', userId))
}
```

---

## 💰 Expected Savings

### Supabase API Bandwidth

Assuming you have:
- 1000 course queries/day
- 500 enrollment queries/day
- 800 compliance queries/day

**Before Caching:**
- Total API calls: 2,300/day
- Bandwidth: ~70MB/day = 2.1GB/month
- Cost: 2.1GB × $0.09 = **$0.19/month**

**After Caching (65% hit rate):**
- Cached calls: 1,495/day (no bandwidth)
- Fresh calls: 805/day
- Bandwidth: ~24MB/day = 0.72GB/month
- Cost: 0.72GB × $0.09 = **$0.06/month**

**Savings: $0.13/month** (scales with usage!)

---

## 📊 Where to Implement Caching

### High Priority (Do First)

1. **Course queries** - Most frequently accessed
   ```
   ✅ getCourses()
   ✅ getCourseById(id)
   ```

2. **Enrollment queries** - User-specific, accessed often
   ```
   ✅ getUserEnrollments(userId)
   ```

3. **Compliance data** - Dashboard data
   ```
   ✅ getComplianceItems()
   ✅ getUserComplianceSubmissions(userId)
   ```

### Medium Priority

4. **Profile queries**
   ```
   ✅ getUserProfile(userId)
   ✅ getParentChildren(parentId)
   ```

### Don't Cache

❌ Real-time notifications
❌ Unread message counts  
❌ Live status updates

---

## 🔧 Common Patterns

### Pattern 1: Cache in Custom Hook

```typescript
// src/hooks/useCourses.ts
import { useEffect, useState } from 'react'
import { queryCache, CACHE_DURATIONS } from '@/lib/cache'

export const useCourses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    const data = await queryCache.get(
      'courses:all',
      async () => {
        const { data, error } = await supabase.from('courses').select('*')
        if (error) throw error
        return data
      },
      CACHE_DURATIONS.COURSES
    )
    setCourses(data)
    setLoading(false)
  }

  return { courses, loading, refresh: loadCourses }
}
```

### Pattern 2: Cache with Invalidation

```typescript
// Update and invalidate
const handleUpdate = async (id: string, updates: any) => {
  await supabase.from('courses').update(updates).eq('id', id)
  queryCache.invalidate('courses:all')
  await loadCourses() // Refresh with new data
}
```

### Pattern 3: User-Specific Caching

```typescript
// Cache per user
const cacheKey = createCacheKey('enrollments', userId)

const enrollments = await queryCache.get(
  cacheKey,
  async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', userId)
    if (error) throw error
    return data
  },
  CACHE_DURATIONS.ENROLLMENTS
)
```

---

## 📈 Monitoring

### Check Cache Performance

```typescript
import { cacheMetrics } from '@/lib/cache'

// Log stats anytime
cacheMetrics.log()

// Output:
// Cache Statistics:
// Hit Rate: 67.32%
// Hits: 156
// Misses: 76
// Total: 232
```

### Add to Admin Dashboard

```typescript
const CacheStats = () => {
  const stats = cacheMetrics.getStats()
  
  return (
    <div>
      <h3>Cache Performance</h3>
      <p>Hit Rate: {stats.hitRate.toFixed(2)}%</p>
      <p>Total Requests: {stats.total}</p>
    </div>
  )
}
```

---

## ✅ Checklist

- [ ] Read this quick start guide (done!)
- [ ] Implement Quick Win #1 (cache courses) - 10 min
- [ ] Implement Quick Win #2 (cache enrollments) - 10 min
- [ ] Implement Quick Win #3 (cache compliance) - 10 min
- [ ] Implement Quick Win #4 (add invalidation) - 10 min
- [ ] Test cache performance - 5 min
- [ ] Monitor Supabase usage reduction - ongoing

**Total Time: ~45 minutes for basic implementation**

---

## 📚 Full Documentation

For comprehensive documentation, see:
- `UPLOADTHING_CACHED_EGRESS.md` - Full guide for your UploadThing setup
- `src/lib/cache.ts` - Core caching utilities
- `src/lib/cachedApiExamples-uploadthing.ts` - More examples

---

## 🎯 Key Takeaways

1. ✅ **UploadThing media is already cached** - No work needed!
2. 🔄 **Focus on Supabase queries** - This is where you'll save bandwidth
3. ⚡ **Start with high-traffic queries** - Courses, enrollments, compliance
4. 🔄 **Always invalidate on updates** - Keeps data fresh
5. 📊 **Monitor cache hit rate** - Aim for 60%+

---

**Ready? Start with Quick Win #1 and cache those course queries! 🚀**
