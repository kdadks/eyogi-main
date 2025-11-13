import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { clearAllCaches, logCacheStats, queryCache } from '@/lib/cache'
import toast from 'react-hot-toast'
import { TrashIcon, ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

export default function CacheManagement() {
  const [clearing, setClearing] = useState(false)

  const handleClearAllCaches = () => {
    try {
      setClearing(true)
      clearAllCaches()
      toast.success('All caches cleared successfully!')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error clearing caches:', error)
      toast.error('Failed to clear caches')
    } finally {
      setClearing(false)
    }
  }

  const handleClearGurukulCache = () => {
    try {
      queryCache.invalidatePattern('gurukuls:.*')
      toast.success('Gurukul cache cleared!')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Error clearing gurukul cache:', error)
      toast.error('Failed to clear gurukul cache')
    }
  }

  const handleClearCourseCache = () => {
    try {
      queryCache.invalidatePattern('courses:.*')
      toast.success('Course cache cleared!')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Error clearing course cache:', error)
      toast.error('Failed to clear course cache')
    }
  }

  const handleClearBrowserStorage = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
      toast.success('Browser storage cleared!')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error clearing browser storage:', error)
      toast.error('Failed to clear browser storage')
    }
  }

  const handleShowStats = () => {
    logCacheStats()
    toast.success('Cache stats logged to console')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cache Management</h2>
        <p className="text-gray-600 mt-1">
          Manage application caches to ensure fresh data after updates
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-2">When to clear cache:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>After renaming a Gurukul (clear Gurukul cache)</li>
                <li>After updating course assignments (clear Course cache)</li>
                <li>If pages are not showing updated data (clear all caches)</li>
                <li>If experiencing routing or navigation issues (clear browser storage)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Specific Cache Clearing */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Specific Caches</h3>
            <p className="text-sm text-gray-600">Clear individual cache types</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleClearGurukulCache}
              className="w-full justify-between"
              variant="outline"
            >
              <span>Clear Gurukul Cache</span>
              <Badge variant="secondary">gurukuls:*</Badge>
            </Button>

            <Button
              onClick={handleClearCourseCache}
              className="w-full justify-between"
              variant="outline"
            >
              <span>Clear Course Cache</span>
              <Badge variant="secondary">courses:*</Badge>
            </Button>

            <Button
              onClick={handleClearBrowserStorage}
              className="w-full justify-between"
              variant="outline"
            >
              <span>Clear Browser Storage</span>
              <Badge variant="secondary">localStorage</Badge>
            </Button>
          </CardContent>
        </Card>

        {/* Global Cache Clearing */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Global Actions</h3>
            <p className="text-sm text-gray-600">Clear all caches or view statistics</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleClearAllCaches}
              disabled={clearing}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              {clearing ? 'Clearing...' : 'Clear All Caches'}
            </Button>

            <Button onClick={handleShowStats} className="w-full" variant="outline">
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              Show Cache Statistics
            </Button>

            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              variant="outline"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Reload Application
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Warning Card */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium">Note:</p>
              <p className="mt-1">
                Clearing caches will cause data to be reloaded from the database. This may take a
                few seconds. The application will automatically reload after clearing caches.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
