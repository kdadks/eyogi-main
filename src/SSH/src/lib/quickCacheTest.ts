/**
 * Quick Cache Testing - Copy and paste this into browser console
 *
 * This provides instant access to cache testing utilities without
 * needing to reload the page.
 */

// Import cache utilities
import { cacheMetrics, queryCache } from './cache'
import { getCourses } from './api/courses'

// Test caching
async function testCache() {
  console.log('🧪 Testing Course Caching...\n')

  const initialStats = cacheMetrics.getStats()
  console.log('📊 Initial Cache Stats:')
  console.log(`   Hit Rate: ${initialStats.hitRate.toFixed(2)}%`)
  console.log(`   Total: ${initialStats.total} requests\n`)

  // First call
  console.log('🔍 First call - should be MISS')
  const start1 = performance.now()
  await getCourses()
  const time1 = performance.now() - start1
  console.log(`   ✅ Done in ${time1.toFixed(2)}ms`)

  // Second call
  console.log('\n🔍 Second call - should be HIT!')
  const start2 = performance.now()
  await getCourses()
  const time2 = performance.now() - start2
  console.log(`   ✅ Done in ${time2.toFixed(2)}ms`)

  const finalStats = cacheMetrics.getStats()
  console.log('\n📊 Final Cache Stats:')
  console.log(`   Hit Rate: ${finalStats.hitRate.toFixed(2)}%`)
  console.log(`   Hits: ${finalStats.hits}`)
  console.log(`   Misses: ${finalStats.misses}`)
  console.log(`   Cache Size: ${queryCache.size()} entries`)

  const speedup = time1 / time2
  console.log(`\n⚡ Speedup: ${speedup.toFixed(1)}x faster!`)

  if (finalStats.hits > initialStats.hits) {
    console.log('\n✅ SUCCESS! Caching is working!')
  } else {
    console.log('\n❌ Cache may not be working correctly')
  }
}

// Show stats
function showStats() {
  const stats = cacheMetrics.getStats()
  console.log('📊 Cache Statistics:')
  console.log('─'.repeat(40))
  console.log(`Hit Rate:       ${stats.hitRate.toFixed(2)}%`)
  console.log(`Total Hits:     ${stats.hits}`)
  console.log(`Total Misses:   ${stats.misses}`)
  console.log(`Total Errors:   ${stats.errors}`)
  console.log(`Total Requests: ${stats.total}`)
  console.log(`Cache Size:     ${queryCache.size()} entries`)
  console.log('─'.repeat(40))
}

// Clear cache
function clearCache() {
  queryCache.clear()
  cacheMetrics.reset()
  console.log('🧹 All caches cleared!')
}

// Export to window
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).cacheTest = {
    test: testCache,
    stats: showStats,
    clear: clearCache,
  }

  console.log('✅ Cache utilities loaded!')
  console.log('Try: cacheTest.test()')
}

export { testCache, showStats, clearCache }
