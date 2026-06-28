import { useState, useEffect } from 'react'
import { Clock, User, RotateCcw, Eye } from 'lucide-react'
import { Button } from '@/components/admin/common/Button'
import { Badge } from '@/components/admin/common/Badge'
import { cmsAPI } from '@/lib/cms-api'
import type { CMSContentVersion } from '@/lib/cms-types'
import { toast } from 'react-hot-toast'

interface VersionHistoryProps {
  contentId: string
  onRestore: (versionNumber: number) => void
}

export function VersionHistory({ contentId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<CMSContentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<number | null>(null)
  const [comparing, setComparing] = useState<{ from: number; to: number } | null>(null)

  useEffect(() => {
    fetchVersions()
  }, [contentId])

  const fetchVersions = async () => {
    try {
      setLoading(true)
      const data = await cmsAPI.content.getVersionHistory(contentId)
      setVersions(data)
    } catch (error) {
      console.error('Error fetching versions:', error)
      toast.error('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (versionNumber: number) => {
    try {
      setRestoring(versionNumber)
      await cmsAPI.content.restoreVersion(contentId, versionNumber, 'current-user-id') // Replace with actual user ID
      toast.success(`Restored to version ${versionNumber}`)
      onRestore(versionNumber)
    } catch (error) {
      console.error('Error restoring version:', error)
      toast.error('Failed to restore version')
    } finally {
      setRestoring(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getTimeDiff = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="text-center text-stone-500 py-8">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No version history available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-stone-600 mb-4">
        {versions.length} version{versions.length !== 1 ? 's' : ''} saved
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className="p-4 rounded-lg border-2 border-stone-200 hover:border-orange-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={index === 0 ? 'success' : 'secondary'}>
                  v{version.version_number}
                </Badge>
                {index === 0 && (
                  <span className="text-xs text-green-600 font-medium">Current</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {/* Preview functionality */}}
                  leftIcon={<Eye className="w-3 h-3" />}
                  disabled
                >
                  Preview
                </Button>
                {index !== 0 && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleRestore(version.version_number)}
                    disabled={restoring === version.version_number}
                    leftIcon={<RotateCcw className="w-3 h-3" />}
                  >
                    {restoring === version.version_number ? 'Restoring...' : 'Restore'}
                  </Button>
                )}
              </div>
            </div>

            <h4 className="font-medium text-stone-900 mb-1">{version.title}</h4>

            {version.change_summary && (
              <p className="text-sm text-stone-600 mb-2">{version.change_summary}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-stone-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDate(version.changed_at)}</span>
              </div>
              <span className="text-stone-400">•</span>
              <span>{getTimeDiff(version.changed_at)}</span>
              {version.changed_by && (
                <>
                  <span className="text-stone-400">•</span>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>User ID: {version.changed_by.substring(0, 8)}...</span>
                  </div>
                </>
              )}
            </div>

            {/* Show content preview (first 100 characters) */}
            {version.content && (
              <div className="mt-3 p-2 bg-stone-50 rounded text-xs text-stone-600 border border-stone-100">
                <div className="font-mono truncate">
                  {JSON.stringify(version.content).substring(0, 100)}...
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
