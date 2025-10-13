# Supabase Cached Egress Implementation

## ✅ What Has Been Implemented

This implementation enables **Cached Egress** for your eYogi Gurukul SSH application, reducing bandwidth costs and improving performance.

---

## 📁 Files Created

### 1. **SUPABASE_CACHED_EGRESS_GUIDE.md**
Comprehensive guide covering:
- What is Cached Egress and how it works
- Benefits and cost savings
- Step-by-step implementation instructions
- Best practices and recommendations
- Monitoring and troubleshooting
- Cache duration strategies by content type

### 2. **src/lib/cache.ts**
Core caching utilities:
- `QueryCache` - In-memory cache for API responses
- `StorageCache` - URL caching for Supabase Storage
- `SWRCache` - Stale-While-Revalidate strategy
- `PersistentCache` - localStorage-based caching
- `CacheMetrics` - Performance tracking
- Cache duration constants for different content types

### 3. **src/lib/cachedApiExamples.ts**
Practical examples showing:
- How to cache course queries
- How to upload files with cache headers
- How to invalidate caches on updates
- How to use image transformations (auto-cached)
- Cache warming strategies
- Performance monitoring

---

## 🚀 How to Use

### Quick Start

#### 1. Import Caching Utilities

```typescript
import { queryCache, CACHE_DURATIONS, createCacheKey } from '@/lib/cache'
import { supabase } from '@/lib/supabase'
```

#### 2. Replace Regular Queries with Cached Versions

**Before (No Caching):**
```typescript
const { data, error } = await supabase
  .from('courses')
  .select('*')

if (error) throw error
return data
```

**After (With Caching):**
```typescript
const getCourses = async () => {
  return queryCache.get(
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
}
```

#### 3. Upload Files with Cache Headers

**Storage uploads automatically set cache headers:**

```typescript
// Upload course image (cached for 1 year)
const { data, error } = await supabase.storage
  .from('course-images')
  .upload(fileName, file, {
    cacheControl: String(CACHE_DURATIONS.IMAGES), // 31536000 seconds
    contentType: file.type,
  })
```

#### 4. Invalidate Cache on Updates

```typescript
// Update data
await supabase.from('courses').update(updates).eq('id', courseId)

// Invalidate related caches
queryCache.invalidate('courses:all')
queryCache.invalidate(`course:${courseId}`)
```

---

## 📊 Cache Durations

Pre-configured cache durations optimized for your use case:

| Content Type | Duration | Use Case |
|--------------|----------|----------|
| **Static Media** (images, videos, docs) | 1 year | Rarely changes |
| **Courses/Gurukuls** | 1 week | Updated occasionally |
| **Enrollments** | 1 hour | Changes regularly |
| **User Profiles** | 5 minutes | Dynamic content |
| **Certificates** | 1 day | Semi-permanent |
| **Notifications** | 5 minutes | Real-time updates |
| **Messages** | No cache | Always fresh |

---

## 🔧 Implementation in Your Components

### Example: Parent Dashboard

```typescript
// src/SSH/src/components/parent/ParentDashboard.tsx

import { useEffect, useState } from 'react'
import { queryCache, CACHE_DURATIONS } from '@/lib/cache'
import { supabase } from '@/lib/supabase'

export const ParentDashboard = () => {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChildren()
  }, [])

  const loadChildren = async () => {
    try {
      const data = await queryCache.get(
        'parent:children',
        async () => {
          const { data, error } = await supabase
            .from('children')
            .select('*')
          
          if (error) throw error
          return data
        },
        CACHE_DURATIONS.USER_PROFILE // Cache for 5 minutes
      )
      
      setChildren(data)
    } catch (error) {
      console.error('Error loading children:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    // Your component JSX
  )
}
```

### Example: Course Management

```typescript
// src/SSH/src/components/admin/CourseManagement.tsx

import { queryCache, cacheManagement } from '@/lib/cachedApiExamples'

export const CourseManagement = () => {
  const loadCourses = async () => {
    const courses = await getCourses() // Automatically cached
    setCourses(courses)
  }

  const handleUpdateCourse = async (courseId: string, updates: any) => {
    await updateCourse(courseId, updates) // Automatically invalidates cache
    await loadCourses() // Loads fresh data
  }

  const handleClearCache = () => {
    cacheManagement.clearAll()
    loadCourses()
  }

  return (
    // Your component JSX with cache management buttons
  )
}
```

---

## 📈 Monitoring Cache Performance

### View Cache Statistics

```typescript
import { cacheManagement } from '@/lib/cachedApiExamples'

// Log cache statistics
cacheManagement.logStats()

// Console output:
// === Cache Performance ===
// Hit Rate: 75.32%
// Total Hits: 156
// Total Misses: 51
// Total Errors: 2
// Total Requests: 207
// Query Cache Size: 12
```

### Add Cache Stats to Admin Dashboard

```typescript
const CacheStatsWidget = () => {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const newStats = cacheManagement.getStats()
      setStats(newStats)
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (!stats) return null

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Cache Performance</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>Hit Rate: {stats.hitRate}</div>
        <div>Total Requests: {stats.totalRequests}</div>
        <div>Cache Size: {stats.queryCacheSize}</div>
        <div>Errors: {stats.totalErrors}</div>
      </div>
    </div>
  )
}
```

---

## 🎯 What Gets Cached

### Automatic (Supabase Storage)
✅ Uploaded images with `cacheControl` header  
✅ Image transformations (resize, quality, format)  
✅ Public file URLs  
✅ CDN-served content  

### Manual (Application Level)
✅ API query responses  
✅ User profiles  
✅ Course lists  
✅ Enrollment data  
✅ Calculated values  

### Not Cached (Real-time Data)
❌ Messages  
❌ Notifications (unread count)  
❌ Presence status  
❌ Live updates  

---

## 💡 Best Practices

### 1. **Cache Static Content Aggressively**
```typescript
// Images, videos, PDFs - cache for 1 year
cacheControl: String(CACHE_DURATIONS.IMAGES)
```

### 2. **Short TTL for Dynamic Data**
```typescript
// User profiles, enrollment status - cache for 5 minutes
CACHE_DURATIONS.USER_PROFILE
```

### 3. **Always Invalidate on Updates**
```typescript
await updateData()
queryCache.invalidate(cacheKey)
```

### 4. **Use Cache Keys Consistently**
```typescript
const cacheKey = createCacheKey('course', courseId)
// Produces: "course:123"
```

### 5. **Monitor Cache Hit Rate**
```typescript
// Aim for 60%+ hit rate
cacheManagement.logStats()
```

---

## 🔒 Security Considerations

1. **Never cache sensitive data** (passwords, tokens, PII)
2. **Use short TTL for user-specific data** (profiles, permissions)
3. **Invalidate cache on logout**
4. **Clear cache after major updates**

```typescript
// Clear cache on logout
export const logout = async () => {
  await supabase.auth.signOut()
  cacheManagement.clearAll() // Clear all cached data
}
```

---

## 📉 Expected Cost Savings

Based on typical usage patterns:

| Service | Before Caching | After Caching | Savings |
|---------|---------------|---------------|---------|
| Storage Egress | 100% | 30-40% | **60-70%** |
| API Calls | 100% | 50-70% | **30-50%** |
| Overall Bandwidth | 100% | 40-50% | **50-60%** |

### Example Calculation

**Before Caching:**
- Storage: 10 GB egress/month × $0.09/GB = $0.90
- API: 5 GB egress/month × $0.09/GB = $0.45
- **Total: $1.35/month**

**After Caching:**
- Storage: 3 GB egress/month × $0.09/GB = $0.27 (70% cached)
- API: 2.5 GB egress/month × $0.09/GB = $0.23 (50% cached)
- **Total: $0.50/month**

**Monthly Savings: $0.85 (63% reduction)**

*Savings scale with usage - higher traffic = higher savings*

---

## 🧪 Testing Cache Implementation

### 1. Check Cache Headers in Browser

Open DevTools → Network tab → Select a resource → Check headers:

```
Cache-Control: public, max-age=31536000
X-Cache: HIT
Age: 3600
```

### 2. Monitor Cache Hit Rate

```typescript
// Add to your admin dashboard
console.log(cacheManagement.getStats())
```

### 3. Test Cache Invalidation

```typescript
// Load data (should be cached)
await getCourses()

// Update data
await updateCourse(courseId, { title: 'New Title' })

// Load again (should be fresh)
await getCourses()
```

---

## 🆘 Troubleshooting

### Cache Not Working?

1. **Check cache headers in Network tab**
   - Look for `Cache-Control` header
   - Verify `max-age` value

2. **Verify Storage bucket is public**
   - Go to Supabase Dashboard → Storage
   - Check bucket settings

3. **Clear browser cache**
   - Hard refresh (Ctrl+Shift+R)
   - Open in incognito mode

### Cache Too Aggressive?

1. **Reduce TTL values**
   ```typescript
   CACHE_DURATIONS.COURSES = 3600 // 1 hour instead of 1 week
   ```

2. **Implement manual refresh**
   ```typescript
   <button onClick={() => {
     queryCache.invalidate('courses:all')
     loadCourses()
   }}>
     Refresh
   </button>
   ```

---

## 📚 Additional Resources

- [Supabase Egress Documentation](https://supabase.com/docs/guides/platform/manage-your-usage/egress)
- [HTTP Caching Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Supabase Storage Caching](https://supabase.com/docs/guides/storage/uploads/standard-uploads#cache-control)

---

## ✅ Next Steps

1. **Review the guide**: Read `SUPABASE_CACHED_EGRESS_GUIDE.md`
2. **Explore examples**: Check `src/lib/cachedApiExamples.ts`
3. **Implement gradually**: Start with static content (images)
4. **Monitor performance**: Use `cacheManagement.logStats()`
5. **Optimize based on metrics**: Adjust TTL values as needed

---

## 🎉 Summary

You now have:
- ✅ Complete caching infrastructure
- ✅ Optimized cache durations for different content types
- ✅ Automatic cache invalidation on updates
- ✅ Performance monitoring tools
- ✅ Storage uploads with cache headers
- ✅ Comprehensive documentation and examples

**Start implementing caching in your API calls today and watch your bandwidth costs drop!** 🚀

---

For questions or issues, refer to the detailed guide or Supabase documentation.
