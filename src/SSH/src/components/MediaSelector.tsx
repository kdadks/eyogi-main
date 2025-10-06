'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Input } from './ui/Input'
import { toast } from 'sonner'
import {
  Search,
  X,
  Check,
  Image,
  Video,
  Music,
  FileText,
  Upload,
  Grid,
  List,
  Eye,
  Loader2,
} from 'lucide-react'
import {
  getMediaFiles,
  formatFileSize,
  getThumbnailUrl,
  canPreview,
  type MediaFile,
  type MediaFilters,
} from '../lib/api/media'
import FileIcon from './ui/FileIcon'

const CATEGORIES = [
  { value: 'all', label: 'All Files', icon: FileText },
  { value: 'image', label: 'Images', icon: Image },
  { value: 'video', label: 'Videos', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'document', label: 'Documents', icon: FileText },
]

interface MediaSelectorProps {
  // Selection mode
  multiple?: boolean
  maxSelection?: number

  // File type filters
  accept?: string[] // MIME types or categories: ['image/*', 'video/*'] or ['image', 'video']

  // Display options
  compact?: boolean
  showUpload?: boolean

  // Callbacks
  onSelect: (files: MediaFile[]) => void
  onClose?: () => void

  // Initial selection
  initialSelection?: MediaFile[]

  // UI customization
  title?: string
  emptyMessage?: string
  className?: string
}

export default function MediaSelector({
  multiple = false,
  maxSelection,
  accept,
  compact = false,
  showUpload = true,
  onSelect,
  onClose,
  initialSelection = [],
  title = 'Select Media',
  emptyMessage = 'No media files found',
  className = '',
}: MediaSelectorProps) {
  const [media, setMedia] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
    new Set(initialSelection.map((f) => f.id)),
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null)

  // Filters
  const [filters, setFilters] = useState<MediaFilters>({
    page: 1,
    limit: compact ? 12 : 24,
    category: 'all',
    search: '',
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: compact ? 12 : 24,
    total: 0,
    totalPages: 0,
  })

  // Load media files
  const loadMedia = useCallback(async () => {
    try {
      setLoading(true)

      // Apply acceptance filters
      let categoryFilter = filters.category
      if (accept && accept.length > 0) {
        const acceptedCategories = accept
          .map((a) => {
            if (a.includes('/')) {
              // MIME type like 'image/*'
              return a.split('/')[0]
            }
            return a // Category like 'image'
          })
          .filter((c) => ['image', 'video', 'audio', 'document'].includes(c))

        if (acceptedCategories.length === 1) {
          categoryFilter = acceptedCategories[0]
        }
      }

      const response = await getMediaFiles({
        ...filters,
        category: categoryFilter,
      })

      // Additional filtering by MIME type if needed
      let filteredMedia = response.media
      if (accept && accept.some((a) => a.includes('/'))) {
        filteredMedia = response.media.filter((file) =>
          accept.some((acceptType) => {
            if (acceptType.endsWith('/*')) {
              return file.mime_type.startsWith(acceptType.replace('/*', '/'))
            }
            return file.mime_type === acceptType
          }),
        )
      }

      setMedia(filteredMedia)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Error loading media:', error)
      toast.error('Failed to load media files')
    } finally {
      setLoading(false)
    }
  }, [filters, accept])

  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }))
  }

  // Handle category filter
  const handleCategoryFilter = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      category,
      page: 1,
    }))
  }

  // Handle file selection
  const handleSelectFile = (file: MediaFile) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)

      if (newSet.has(file.id)) {
        // Deselect
        newSet.delete(file.id)
      } else {
        // Select
        if (!multiple) {
          // Single selection - clear others
          newSet.clear()
        } else if (maxSelection && newSet.size >= maxSelection) {
          // Max selection reached
          toast.warning(`You can only select up to ${maxSelection} files`)
          return prev
        }
        newSet.add(file.id)
      }

      return newSet
    })
  }

  // Handle selection confirmation
  const handleConfirmSelection = () => {
    const selectedMedia = media.filter((file) => selectedFiles.has(file.id))
    onSelect(selectedMedia)
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  // Get available categories based on acceptance filter
  const availableCategories = accept
    ? CATEGORIES.filter(
        (cat) =>
          cat.value === 'all' || accept.some((a) => a.includes(cat.value) || a === cat.value),
      )
    : CATEGORIES

  const selectedCount = selectedFiles.size
  const canConfirm = selectedCount > 0 && (!maxSelection || selectedCount <= maxSelection)

  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {selectedCount > 0 && (
            <Badge variant="secondary">
              {selectedCount} selected
              {maxSelection && ` of ${maxSelection}`}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search media..."
                className="pl-10 w-48"
                value={filters.search || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
              />
            </div>

            {/* Upload button */}
            {showUpload && (
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* View mode toggle */}
            {!compact && (
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Category filters */}
        {availableCategories.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {availableCategories.map((category) => {
              const IconComponent = category.icon
              return (
                <Button
                  key={category.value}
                  variant={filters.category === category.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryFilter(category.value)}
                >
                  <IconComponent className="h-4 w-4 mr-1" />
                  {category.label}
                </Button>
              )
            })}
          </div>
        )}
      </div>

      {/* Media Content */}
      <div className={`p-4 ${compact ? 'max-h-96' : 'max-h-[60vh]'} overflow-auto`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading media files...</span>
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
            <p className="text-gray-600">
              {filters.search || filters.category !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Upload your first media file to get started'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' || compact ? (
              <div
                className={`grid gap-3 ${
                  compact
                    ? 'grid-cols-3 md:grid-cols-4'
                    : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'
                }`}
              >
                {media.map((file) => (
                  <MediaGridItem
                    key={file.id}
                    file={file}
                    selected={selectedFiles.has(file.id)}
                    onSelect={() => handleSelectFile(file)}
                    onPreview={() => setPreviewMedia(file)}
                    compact={compact}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {media.map((file) => (
                  <MediaListItem
                    key={file.id}
                    file={file}
                    selected={selectedFiles.has(file.id)}
                    onSelect={() => handleSelectFile(file)}
                    onPreview={() => setPreviewMedia(file)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!compact && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} files
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + Math.max(1, pagination.page - 2)
                    if (page > pagination.totalPages) return null
                    return (
                      <Button
                        key={page}
                        variant={page === pagination.page ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50">
        <div className="text-sm text-gray-600">
          {multiple ? (
            <>
              {selectedCount} file{selectedCount !== 1 ? 's' : ''} selected
              {maxSelection && ` (max ${maxSelection})`}
            </>
          ) : selectedCount > 0 ? (
            '1 file selected'
          ) : (
            'Select a file'
          )}
        </div>

        <div className="flex space-x-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={handleConfirmSelection} disabled={!canConfirm}>
            <Check className="h-4 w-4 mr-2" />
            {multiple ? `Select ${selectedCount}` : 'Select'}
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewMedia && (
        <MediaPreviewModal media={previewMedia} onClose={() => setPreviewMedia(null)} />
      )}
    </div>
  )
}

// Grid Item Component
interface MediaGridItemProps {
  file: MediaFile
  selected: boolean
  onSelect: () => void
  onPreview: () => void
  compact?: boolean
}

function MediaGridItem({
  file,
  selected,
  onSelect,
  onPreview,
  compact = false,
}: MediaGridItemProps) {
  const thumbnailUrl = getThumbnailUrl(file)
  const isImage = file.file_category === 'image'

  return (
    <div
      className={`relative group border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {/* Selection indicator */}
      <div className="absolute top-2 left-2 z-10">
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            selected
              ? 'bg-blue-500 border-blue-500'
              : 'bg-white border-gray-300 group-hover:border-gray-400'
          }`}
        >
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>

      {/* Thumbnail */}
      <div
        className={`aspect-square bg-gray-100 flex items-center justify-center overflow-hidden ${
          compact ? 'min-h-[80px]' : 'min-h-[120px]'
        }`}
      >
        {isImage ? (
          <img
            src={thumbnailUrl}
            alt={file.alt_text || file.title || file.original_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <FileIcon
              fileType={file.file_type}
              size={compact ? 32 : 48}
              className="text-gray-600"
            />
          </div>
        )}

        {/* Preview overlay */}
        {canPreview(file) && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              onPreview()
            }}
          >
            <Button size="sm" variant="secondary">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* File info */}
      {!compact && (
        <div className="p-2">
          <div
            className="text-xs font-medium text-gray-900 truncate"
            title={file.title || file.original_name}
          >
            {file.title || file.original_name}
          </div>
          <div className="text-xs text-gray-500">{formatFileSize(file.file_size)}</div>
        </div>
      )}
    </div>
  )
}

// List Item Component
interface MediaListItemProps {
  file: MediaFile
  selected: boolean
  onSelect: () => void
  onPreview: () => void
}

function MediaListItem({ file, selected, onSelect, onPreview }: MediaListItemProps) {
  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded border transition-all cursor-pointer ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {/* Selection checkbox */}
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          selected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
        }`}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>

      {/* Thumbnail */}
      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
        {file.file_category === 'image' ? (
          <img
            src={getThumbnailUrl(file)}
            alt={file.alt_text || file.title || file.original_name}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <FileIcon fileType={file.file_type} size={24} className="text-gray-600" />
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{file.title || file.original_name}</div>
        <div className="text-sm text-gray-500">
          {formatFileSize(file.file_size)} • {file.file_category}
        </div>
      </div>

      {/* Preview button */}
      {canPreview(file) && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            onPreview()
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// Preview Modal Component
interface MediaPreviewModalProps {
  media: MediaFile
  onClose: () => void
}

function MediaPreviewModal({ media, onClose }: MediaPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium truncate">{media.title || media.original_name}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          {media.file_category === 'image' && (
            <img
              src={media.file_url}
              alt={media.alt_text || media.title || media.original_name}
              className="max-w-full h-auto mx-auto"
            />
          )}

          {media.file_category === 'video' && (
            <video controls className="max-w-full h-auto mx-auto">
              <source src={media.file_url} type={media.mime_type} />
              Your browser does not support the video tag.
            </video>
          )}

          {media.file_category === 'audio' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FileIcon fileType={media.file_type} size={72} className="text-gray-600" />
              </div>
              <audio controls className="mx-auto">
                <source src={media.file_url} type={media.mime_type} />
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <div>
              <strong>Size:</strong> {formatFileSize(media.file_size)}
            </div>
            <div>
              <strong>Type:</strong> {media.mime_type}
            </div>
            <div>
              <strong>Uploaded:</strong> {new Date(media.created_at).toLocaleString()}
            </div>
            {media.description && (
              <div>
                <strong>Description:</strong> {media.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
