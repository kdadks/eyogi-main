# 🧪 How to Test Cache (Simple Console Commands)

## Problem: "cacheTest is not defined"

The utilities need to be loaded. Here are **3 easy ways** to test caching:

---

## ✅ Method 1: Direct Console Test (Easiest!)

Copy and paste this entire block into your browser console:

```javascript
// Import cache utilities
const { cacheMetrics, queryCache } = await import('/src/lib/cache')
const { getCourses } = await import('/src/lib/api/courses')

// Test function
async function testCache() {
  console.log('🧪 Testing Course Caching...\n')
  
  const start = cacheMetrics.getStats()
  console.log(`📊 Start: ${start.hits} hits, ${start.misses} misses`)
  
  // First call
  console.log('\n🔍 Call 1...')
  await getCourses()
  
  // Second call  
  console.log('🔍 Call 2...')
  await getCourses()
  
  const end = cacheMetrics.getStats()
  console.log(`\n📊 End: ${end.hits} hits, ${end.misses} misses`)
  console.log(`💾 Cache size: ${queryCache.size()} entries`)
  
  if (end.hits > start.hits) {
    console.log('\n✅ SUCCESS! Second call was cached!')
  }
}

// Run test
await testCache()
```

**Expected output:**
```
✅ SUCCESS! Second call was cached!
```

---

## ✅ Method 2: Manual Step-by-Step

### Step 1: Check Initial Stats
```javascript
const { cacheMetrics, queryCache } = await import('/src/lib/cache')
cacheMetrics.getStats()
```

### Step 2: Load Courses (First Time - Miss)
```javascript
const { getCourses } = await import('/src/lib/api/courses')
await getCourses()
```

### Step 3: Check Stats Again
```javascript
cacheMetrics.getStats()
// Should show 1 miss
```

### Step 4: Load Courses Again (Second Time - Hit!)
```javascript
await getCourses()
```

### Step 5: Check Final Stats
```javascript
cacheMetrics.getStats()
// Should show 1 hit, 1 miss = 50% hit rate!
```

### Step 6: Check Cache Size
```javascript
queryCache.size()
// Should show 1 entry
```

---

## ✅ Method 3: Visual Test (No Console Needed!)

1. **Open your SSH app** in browser
2. **Navigate to a page with courses** (admin dashboard, course list, etc.)
3. **Note the load time** (usually 200-500ms first time)
4. **Reload the page** (Press F5)
5. **Notice it loads MUCH faster!** (usually <50ms from cache)

**That's it!** If the second load is faster, caching is working! ✅

---

## 🎯 Quick Commands Reference

Once you have the modules imported:

```javascript
// Import once
const { cacheMetrics, queryCache } = await import('/src/lib/cache')
const { getCourses } = await import('/src/lib/api/courses')

// Show current stats
cacheMetrics.getStats()

// Show hit rate
cacheMetrics.getStats().hitRate + '%'

// Show cache size
queryCache.size()

// Clear all caches
queryCache.clear()
cacheMetrics.reset()

// Test a query
await getCourses()
```

---

## 📊 What to Look For

### ✅ Good Signs
- Hit rate increases after reloading pages
- Cache size grows as you browse
- Pages load 2-3x faster on reload
- Fewer network requests in DevTools

### ❌ Bad Signs
- Hit rate stays at 0%
- Cache size stays at 0
- Every page reload makes new API calls
- No performance improvement

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"

**Solution**: Make sure you're in the SSH app at `http://localhost:5174/ssh-app/`

### Issue: "Stats show 0 hits"

**Solution**: You need to load the same page/query twice. First is always a miss, second should be a hit.

### Issue: "Cache size is 0"

**Solution**: Load some pages first! Try:
```javascript
await getCourses()
queryCache.size() // Now should be 1
```

---

## 💡 Alternative: Browser Network Tab

1. Open DevTools → Network tab
2. Load a page with courses
3. Note the API request time (e.g., 250ms)
4. Reload the page
5. API request should show same data but faster (e.g., 10ms from memory)

---

## 🎉 Success Criteria

You'll know caching is working when:

✅ `cacheMetrics.getStats().hitRate > 0`  
✅ `queryCache.size() > 0`  
✅ Pages load 2-3x faster on reload  
✅ Fewer API calls in Network tab  

---

## 📝 Example Session

```javascript
// Start fresh
const { cacheMetrics, queryCache } = await import('/src/lib/cache')
const { getCourses } = await import('/src/lib/api/courses')

queryCache.clear()
cacheMetrics.reset()

// First load
console.log('First load...')
await getCourses()
console.log(cacheMetrics.getStats()) // { hits: 0, misses: 1, hitRate: 0 }

// Second load
console.log('Second load...')
await getCourses()  
console.log(cacheMetrics.getStats()) // { hits: 1, misses: 1, hitRate: 50 }

// SUCCESS! ✅
```

---

**No complex setup needed! Just copy-paste and test!** 🚀
