'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Input } from '../ui/Input'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { toast } from 'sonner'
import {
  Upload,
  Search,
  Trash2,
  Edit,
  Eye,
  Download,
  Grid,
  List,
  X,
  Check,
  Image,
  Video,
  Music,
  FileText,
  Plus,
  Loader2,
  Droplets,
} from 'lucide-react'
import {
  getMediaFiles,
  updateMediaFile,
  deleteMediaFile,
  bulkDeleteMediaFiles,
  getMediaStats,
  formatFileSize,
  getThumbnailUrl,
  canPreview,
  type MediaFile,
  type MediaFilters,
} from '../../lib/api/media'
import { uploadFilesToUploadThing } from '../../lib/storage-client'
import { canBeWatermarked } from '../../hooks/useWatermark'
import WatermarkDialog from './WatermarkDialog'
import FileIcon from '../ui/FileIcon'

const CATEGORIES = [
  { value: 'all', label: 'All Files', icon: FileText },
  { value: 'image', label: 'Images', icon: Image },
  { value: 'video', label: 'Videos', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'document', label: 'Documents', icon: FileText },
]

interface MediaStats {
  total: number
  by_category: Record<string, number>
  total_size: number
}

export default function MediaManagement() {
  const [media, setMedia] = useState<MediaFile[]>([])
  const [stats, setStats] = useState<MediaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [editingMedia, setEditingMedia] = useState<MediaFile | null>(null)
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showWatermarkDialog, setShowWatermarkDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  // Filters
  const [filters, setFilters] = useState<MediaFilters>({
    page: 1,
    limit: 20,
    category: 'all',
    search: '',
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // File upload handling integrated with Supabase storage

  // Load media files
  const loadMedia = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getMediaFiles(filters)
      setMedia(response.media)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Error loading media:', error)
      toast.error('Failed to load media files')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const statsData = await getMediaStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [])

  // Effects
  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Handle file upload (placeholder implementation)
  const handleFileUpload = async (files: File[]) => {
    if (!files.length) {
      return
    }

    setUploading(true)

    try {
      // Upload files to Supabase storage and save metadata to database
      const results = await uploadFilesToUploadThing(files)

      toast.success(`Successfully uploaded ${files.length} file(s)`)

      // Close the dialog after successful upload
      setShowUploadDialog(false)

      // Refresh media list to show new files
      await loadMedia()
      await loadStats()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

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

  // Handle selection
  const handleSelectFile = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === media.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(media.map((file) => file.id)))
    }
  }

  // Handle editing
  const handleEditMedia = async (mediaId: string, updates: Partial<MediaFile>) => {
    try {
      await updateMediaFile(mediaId, updates)
      toast.success('Media updated successfully')
      setEditingMedia(null)
      loadMedia()
    } catch (error) {
      console.error('Error updating media:', error)
      toast.error('Failed to update media')
    }
  }

  // Handle deletion
  const handleDeleteFile = (file: MediaFile) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Media File',
      message: `Are you sure you want to delete "${file.title || file.original_name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteMediaFile(file.id)
          toast.success('File deleted successfully')
          loadMedia()
          loadStats()
        } catch (error) {
          console.error('Error deleting file:', error)
          toast.error('Failed to delete file')
        }
        setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))
      },
    })
  }

  const handleBulkDelete = () => {
    const selectedCount = selectedFiles.size
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Multiple Files',
      message: `Are you sure you want to delete ${selectedCount} file(s)? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await bulkDeleteMediaFiles(Array.from(selectedFiles))
          toast.success(`Successfully deleted ${selectedCount} file(s)`)
          setSelectedFiles(new Set())
          loadMedia()
          loadStats()
        } catch (error) {
          console.error('Error bulk deleting files:', error)
          toast.error('Failed to delete files')
        }
        setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))
      },
    })
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div>
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Files</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.by_category.image || 0}
                </div>
                <div className="text-sm text-gray-600">Images</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.by_category.video || 0}
                </div>
                <div className="text-sm text-gray-600">Videos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatFileSize(stats.total_size)}
                </div>
                <div className="text-sm text-gray-600">Total Size</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              {/* Upload button */}
              <Button
                onClick={() => setShowUploadDialog(true)}
                disabled={uploading || (media.length === 0 && !loading)}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                title={
                  media.length === 0 && !loading ? 'Upload disabled - API not implemented' : ''
                }
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Files
              </Button>

              {/* Bulk actions */}
              {selectedFiles.size > 0 && (
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{selectedFiles.size} selected</Badge>

                  {/* Watermark button - only show if at least one image is selected */}
                  {Array.from(selectedFiles).some((fileId) => {
                    const file = media.find((f) => f.id === fileId)
                    return file && canBeWatermarked(file.mime_type)
                  }) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowWatermarkDialog(true)}
                    >
                      <Droplets className="h-4 w-4 mr-1" />
                      Watermark
                    </Button>
                  )}

                  <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search media files..."
                  className="pl-10 w-64"
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              {/* View mode toggle */}
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
            </div>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORIES.map((category) => {
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
                  {stats && category.value !== 'all' && (
                    <Badge className="ml-2" variant="secondary">
                      {stats.by_category[category.value] || 0}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading media files...</span>
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="h-16 w-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No media files yet</h3>
                <p className="text-gray-600 mb-6">
                  Get started by uploading your first media files. You can upload images, videos,
                  audio files, and documents.
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Your First Files
                </Button>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="space-y-4">
                  {/* Select All Controls for Grid View */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.size === media.length && media.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                        id="select-all-grid"
                      />
                      <label
                        htmlFor="select-all-grid"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Select All ({media.length} files)
                      </label>
                    </div>
                    {selectedFiles.size > 0 && (
                      <div className="text-sm text-gray-600">
                        {selectedFiles.size} of {media.length} selected
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3">
                    {media.map((file) => (
                      <MediaGridItem
                        key={file.id}
                        file={file}
                        selected={selectedFiles.has(file.id)}
                        onSelect={() => handleSelectFile(file.id)}
                        onEdit={() => setEditingMedia(file)}
                        onPreview={() => setPreviewMedia(file)}
                        onDelete={() => handleDeleteFile(file)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 p-3 border-b font-medium text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={selectedFiles.size === media.length && media.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                    <div className="flex-1">Name</div>
                    <div className="w-24">Type</div>
                    <div className="w-20">Size</div>
                    <div className="w-32">Uploaded</div>
                    <div className="w-20">Actions</div>
                  </div>
                  {media.map((file) => (
                    <MediaListItem
                      key={file.id}
                      file={file}
                      selected={selectedFiles.has(file.id)}
                      onSelect={() => handleSelectFile(file.id)}
                      onEdit={() => setEditingMedia(file)}
                      onPreview={() => setPreviewMedia(file)}
                      onDelete={() => handleDeleteFile(file)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
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
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        const current = pagination.page
                        return (
                          page === 1 ||
                          page === pagination.totalPages ||
                          (page >= current - 1 && page <= current + 1)
                        )
                      })
                      .map((page) => (
                        <Button
                          key={page}
                          variant={page === pagination.page ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      ))}
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
        </CardContent>
      </Card>

      {/* Dialogs and Modals */}
      {showUploadDialog && (
        <UploadDialog
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleFileUpload}
          uploading={uploading}
        />
      )}

      {editingMedia && (
        <EditMediaDialog
          media={editingMedia}
          onClose={() => setEditingMedia(null)}
          onSave={handleEditMedia}
        />
      )}

      {previewMedia && <PreviewDialog media={previewMedia} onClose={() => setPreviewMedia(null)} />}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        onConfirm={deleteConfirm.onConfirm}
        onCancel={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        variant="danger"
      />

      {showWatermarkDialog && (
        <WatermarkDialog
          mediaFiles={Array.from(selectedFiles)
            .map((fileId) => media.find((f) => f.id === fileId)!)
            .filter(Boolean)}
          onClose={() => setShowWatermarkDialog(false)}
          onComplete={() => {
            loadMedia()
            loadStats()
            setSelectedFiles(new Set())
          }}
        />
      )}
    </div>
  )
}

// Media Grid Item Component
interface MediaGridItemProps {
  file: MediaFile
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onPreview: () => void
  onDelete: () => void
}

function MediaGridItem({
  file,
  selected,
  onSelect,
  onEdit,
  onPreview,
  onDelete,
}: MediaGridItemProps) {
  const thumbnailUrl = getThumbnailUrl(file)
  const isImage = file.file_category === 'image'

  return (
    <div
      className={`relative group border-2 rounded-lg overflow-hidden transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Selection checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input type="checkbox" checked={selected} onChange={onSelect} className="rounded" />
      </div>

      {/* Thumbnail */}
      <div className="w-full h-12 sm:h-16 md:h-18 lg:h-20 xl:h-20 bg-gray-100 flex items-center justify-center overflow-hidden rounded-t-lg">
        {isImage ? (
          <>
            <img
              src={thumbnailUrl}
              alt={file.alt_text || file.title || file.original_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Silently handle image load failures - display fallback instead
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.classList.remove('hidden')
              }}
            />
            <div className="hidden w-full h-full items-center justify-center text-4xl text-gray-500">
              <span>📷</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center">
            <FileIcon fileType={file.file_type} size={48} className="text-gray-600" />
          </div>
        )}
        <div className="hidden items-center justify-center">
          <FileIcon fileType={file.file_type} size={48} className="text-gray-600" />
        </div>

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
          {canPreview(file) && (
            <Button size="sm" variant="secondary" onClick={onPreview}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="danger" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File info */}
      <div className="p-2">
        <div
          className="text-xs font-medium text-gray-900 truncate"
          title={file.title || file.original_name}
        >
          {file.title || file.original_name}
        </div>
        <div className="text-xs text-gray-500">{formatFileSize(file.file_size)}</div>
      </div>
    </div>
  )
}

// Media List Item Component
interface MediaListItemProps {
  file: MediaFile
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onPreview: () => void
  onDelete: () => void
}

function MediaListItem({
  file,
  selected,
  onSelect,
  onEdit,
  onPreview,
  onDelete,
}: MediaListItemProps) {
  return (
    <div
      className={`flex items-center space-x-4 p-3 rounded border transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <input type="checkbox" checked={selected} onChange={onSelect} className="rounded" />

      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
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

      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{file.title || file.original_name}</div>
        <div className="text-sm text-gray-500 truncate">{file.alt_text || file.description}</div>
      </div>

      <div className="w-24 text-sm text-gray-500">
        <Badge variant="outline" className="text-xs">
          {file.file_category}
        </Badge>
      </div>

      <div className="w-20 text-sm text-gray-500">{formatFileSize(file.file_size)}</div>

      <div className="w-32 text-sm text-gray-500">
        {new Date(file.created_at).toLocaleDateString()}
      </div>

      <div className="w-20 flex space-x-1">
        {canPreview(file) && (
          <Button size="sm" variant="ghost" onClick={onPreview}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Upload Dialog Component
interface UploadDialogProps {
  onClose: () => void
  onUpload: (files: File[]) => void
  uploading: boolean
}

function UploadDialog({ onClose, onUpload, uploading }: UploadDialogProps) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)

      // Filter out duplicate files based on name and size
      const uniqueNewFiles = newFiles.filter(
        (newFile) =>
          !selectedFiles.some(
            (existingFile) =>
              existingFile.name === newFile.name && existingFile.size === newFile.size,
          ),
      )

      if (uniqueNewFiles.length > 0) {
        setSelectedFiles((prev) => {
          const updated = [...prev, ...uniqueNewFiles]
          return updated
        })
        toast.success(`Added ${uniqueNewFiles.length} file(s)`)
      } else {
        toast.info('All selected files are already added')
      }

      // Clear the input so the same files can be selected again if needed
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)

      // Filter out duplicate files based on name and size
      const uniqueNewFiles = newFiles.filter(
        (newFile) =>
          !selectedFiles.some(
            (existingFile) =>
              existingFile.name === newFile.name && existingFile.size === newFile.size,
          ),
      )

      if (uniqueNewFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...uniqueNewFiles])
        toast.success(`Added ${uniqueNewFiles.length} file(s) via drag & drop`)
      } else {
        toast.info('All dropped files are already added')
      }
    }
  }

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-white border border-gray-200 shadow-xl rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Upload Media Files</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4 bg-white text-gray-900">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              fileInputRef.current?.click()
            }}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here, click anywhere in this area, or use the button below
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Support for images, videos, audio, and documents (PDF, DOCX, XLSX, PPTX, TXT)
            </p>
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              ref={fileInputRef}
            />
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation() // Prevent triggering the drop zone's onClick
                fileInputRef.current?.click()
              }}
            >
              {selectedFiles.length > 0 ? 'Add More Files' : 'Browse Files'}
            </Button>
          </div>

          {/* Selected files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Selected Files ({selectedFiles.length})</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFiles([])}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <FileIcon fileType={file.type} size={20} className="text-gray-600" />
                      <div>
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedFiles((files) => files.filter((_, i) => i !== index))
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} file(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Edit Media Dialog Component
interface EditMediaDialogProps {
  media: MediaFile
  onClose: () => void
  onSave: (mediaId: string, updates: Partial<MediaFile>) => void
}

function EditMediaDialog({ media, onClose, onSave }: EditMediaDialogProps) {
  const [title, setTitle] = useState(media.title || '')
  const [altText, setAltText] = useState(media.alt_text || '')
  const [description, setDescription] = useState(media.description || '')
  const [tags, setTags] = useState(media.tags?.join(', ') || '')
  const [isPublic, setIsPublic] = useState(media.is_public)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(media.id, {
        title: title.trim() || undefined,
        alt_text: altText.trim() || undefined,
        description: description.trim() || undefined,
        tags: tags.trim() ? tags.split(',').map((tag) => tag.trim()) : [],
        is_public: isPublic,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-white border border-gray-200 shadow-xl rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Edit Media File</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4 bg-white text-gray-900">
          {/* Preview */}
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
              {media.file_category === 'image' ? (
                <img
                  src={getThumbnailUrl(media)}
                  alt={media.alt_text || media.title || media.original_name}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <FileIcon fileType={media.file_type} size={32} className="text-gray-600" />
              )}
            </div>
            <div>
              <div className="font-medium">{media.original_name}</div>
              <div className="text-sm text-gray-500">
                {formatFileSize(media.file_size)} • {media.file_type}
              </div>
              <div className="text-sm text-gray-500">
                Uploaded {new Date(media.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
              />
            </div>

            {media.file_category === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text (for SEO and accessibility)
                </label>
                <Input
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe what's in this image"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this file"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                Make this file public
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Preview Dialog Component
interface PreviewDialogProps {
  media: MediaFile
  onClose: () => void
}

function PreviewDialog({ media, onClose }: PreviewDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">{media.title || media.original_name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          {media.file_category === 'image' && (
            <img
              src={media.file_url}
              alt={media.alt_text || media.title || media.original_name}
              className="max-w-full h-auto"
            />
          )}

          {media.file_category === 'video' && (
            <video controls className="max-w-full h-auto">
              <source src={media.file_url} type={media.mime_type} />
              Your browser does not support the video tag.
            </video>
          )}

          {media.file_category === 'audio' && (
            <audio controls className="w-full">
              <source src={media.file_url} type={media.mime_type} />
              Your browser does not support the audio tag.
            </audio>
          )}

          {media.mime_type === 'application/pdf' && (
            <iframe
              src={media.file_url}
              className="w-full h-96"
              title={media.title || media.original_name}
            />
          )}

          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <div>
              <strong>File:</strong> {media.original_name}
            </div>
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

        <div className="flex justify-end p-4 border-t space-x-2">
          <a
            href={media.file_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-md"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </a>
        </div>
      </div>
    </div>
  )
}
