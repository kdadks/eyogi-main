# ⚡ ONE-LINE CACHE TEST

Copy and paste this into your browser console:

```javascript
const {cacheMetrics,queryCache}=await import('/src/lib/cache'),{getCourses}=await import('/src/lib/api/courses');await getCourses();await getCourses();const s=cacheMetrics.getStats();console.log(`✅ Hit rate: ${s.hitRate.toFixed(1)}% | Cache size: ${queryCache.size()} | ${s.hits} hits, ${s.misses} misses`);s.hits>0?console.log('🎉 CACHING WORKS!'):console.log('❌ Cache not working')
```

**Expected output:**
```
✅ Hit rate: 50.0% | Cache size: 1 | 1 hits, 1 misses
🎉 CACHING WORKS!
```

---

## Alternative: Readable Version

```javascript
// Import modules
const { cacheMetrics, queryCache } = await import('/src/lib/cache')
const { getCourses } = await import('/src/lib/api/courses')

// Call twice
await getCourses()
await getCourses()

// Check results
const stats = cacheMetrics.getStats()
console.log(`✅ Hit rate: ${stats.hitRate.toFixed(1)}%`)
console.log(`💾 Cache size: ${queryCache.size()}`)
console.log(`📊 ${stats.hits} hits, ${stats.misses} misses`)

// Verify
if (stats.hits > 0) {
  console.log('🎉 CACHING WORKS!')
} else {
  console.log('❌ Cache not working')
}
```

---

## Just Want Stats?

```javascript
const {cacheMetrics}=await import('/src/lib/cache');console.log(cacheMetrics.getStats())
```

---

## Clear Cache?

```javascript
const {queryCache,cacheMetrics}=await import('/src/lib/cache');queryCache.clear();cacheMetrics.reset();console.log('🧹 Cleared!')
```

---

**That's it! No page reload needed!** 🚀
