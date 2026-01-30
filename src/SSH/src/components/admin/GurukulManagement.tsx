import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Gurukul } from '@/types'
import { getAllGurukuls, createGurukul, updateGurukul, deleteGurukul } from '@/lib/api/gurukuls'
import { getCourses } from '@/lib/api/courses'
import { formatDate, generateSlug } from '@/lib/utils'
import { sanitizeHtml } from '@/utils/sanitize'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import MediaSelector from '../MediaSelector'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useRefresh } from '@/contexts/RefreshContext'
import {
  GlobeAltIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
interface GurukulFormData {
  name: string
  slug: string
  description: string
  image_url: string
  cover_image_url: string
  selected_cover_media_id?: string
  selected_content_media_id?: string
}
export default function GurukulManagement() {
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [courseCounts, setCourseCounts] = useState<Record<string, number>>({})
  const [filteredGurukuls, setFilteredGurukuls] = useState<Gurukul[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingGurukul, setEditingGurukul] = useState<Gurukul | null>(null)
  const [viewingGurukul, setViewingGurukul] = useState<Gurukul | null>(null)
  const [formData, setFormData] = useState<GurukulFormData>({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    cover_image_url: '',
    selected_cover_media_id: undefined,
    selected_content_media_id: undefined,
  })
  const [formLoading, setFormLoading] = useState(false)
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false)
  const quillRef = React.useRef<ReactQuill>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
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
  const { refreshKey } = useRefresh()

  useEffect(() => {
    loadData()
  }, [refreshKey])
  useEffect(() => {
    // Auto-generate slug when name changes
    if (formData.name && !editingGurukul) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(formData.name),
      }))
    }
  }, [formData.name, editingGurukul])
  const loadData = async () => {
    try {
      const [gurukulData, coursesResult] = await Promise.all([getAllGurukuls(), getCourses()])
      setGurukuls(gurukulData)
      // Count courses per gurukul
      const counts: Record<string, number> = {}
      coursesResult.courses.forEach((course) => {
        counts[course.gurukul_id] = (counts[course.gurukul_id] || 0) + 1
      })
      setCourseCounts(counts)
    } catch {
      toast.error('Failed to load gurukul data')
    } finally {
      setLoading(false)
    }
  }

  const filterGurukuls = React.useCallback(() => {
    let filtered = gurukuls
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (gurukul) =>
          gurukul.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          gurukul.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
          gurukul.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    // Filter by status
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      filtered = filtered.filter((gurukul) => gurukul.is_active === isActive)
    }
    setFilteredGurukuls(filtered)
  }, [gurukuls, searchTerm, statusFilter])
  useEffect(() => {
    filterGurukuls()
  }, [filterGurukuls])
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      cover_image_url: '',
      selected_cover_media_id: undefined,
      selected_content_media_id: undefined,
    })
    setShowCreateForm(false)
    setEditingGurukul(null)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      // Remove form-only fields that don't exist in database
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { selected_cover_media_id, selected_content_media_id, ...gurukulData } = formData

      if (editingGurukul) {
        await updateGurukul(editingGurukul.id, gurukulData)
        toast.success('Gurukul updated successfully')
      } else {
        await createGurukul({
          ...gurukulData,
          is_active: true,
          sort_order: 0,
        })
        toast.success('Gurukul created successfully')
      }
      await loadData()
      resetForm()
    } catch {
      toast.error('Failed to save gurukul')
    } finally {
      setFormLoading(false)
    }
  }
  const handleEdit = (gurukul: Gurukul) => {
    setEditingGurukul(gurukul)
    setFormData({
      name: gurukul.name,
      slug: gurukul.slug,
      description: gurukul.description,
      image_url: gurukul.image_url || '',
      cover_image_url: gurukul.cover_image_url || '',
      selected_cover_media_id: undefined,
      selected_content_media_id: undefined,
    })
    setShowCreateForm(true)
  }
  const handleDelete = async (gurukulId: string) => {
    const gurukulToDelete = gurukuls.find((g) => g.id === gurukulId)
    if (!gurukulToDelete) return

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Gurukul',
      message: `Are you sure you want to delete "${gurukulToDelete.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteGurukul(gurukulId)
          await loadData()
          toast.success('Gurukul deleted successfully')
        } catch {
          toast.error('Failed to delete gurukul')
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
      },
    })
  }
  const handleToggleStatus = async (gurukulId: string, currentStatus: boolean) => {
    try {
      await updateGurukul(gurukulId, { is_active: !currentStatus })
      await loadData()
      toast.success(`Gurukul ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch {
      toast.error('Failed to update gurukul status')
    }
  }
  const stats = {
    total: gurukuls.length,
    active: gurukuls.filter((g) => g.is_active).length,
    inactive: gurukuls.filter((g) => g.is_active === false).length,
    totalCourses: Object.values(courseCounts).reduce((sum, count) => sum + count, 0),
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Gurukuls</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            <div className="text-sm text-gray-600">Inactive</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCourses}</div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </CardContent>
        </Card>
      </div>
      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingGurukul ? 'Edit Gurukul' : 'Create New Gurukul'}
              </h3>
              <Button variant="ghost" onClick={resetForm}>
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Gurukul Name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="Slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  required
                  helperText="URL-friendly identifier"
                />
              </div>
              {/* Cover Image Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Image/Video
                </label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMediaSelectorOpen(true)}
                    className="flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Select Media</span>
                  </Button>
                  {formData.cover_image_url && (
                    <span className="text-xs text-gray-500">✓ Media selected</span>
                  )}
                </div>

                {/* Show selected cover media preview */}
                {formData.selected_cover_media_id && formData.cover_image_url && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex items-center space-x-2">
                        <img
                          src={formData.cover_image_url}
                          alt="Selected cover media"
                          className="w-8 h-8 object-cover rounded"
                        />
                        <span className="text-sm text-gray-600">Cover media selected</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            selected_cover_media_id: undefined,
                            cover_image_url: '',
                          }))
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Rich Text Description */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <ReactQuill
                  ref={quillRef}
                  value={formData.description}
                  onChange={(value: string) =>
                    setFormData((prev) => ({ ...prev, description: value }))
                  }
                  placeholder="Enter Gurukul description"
                  className="bg-white"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Rich text description with support for formatting
                </p>
              </div>
              <div className="flex space-x-4">
                <Button type="submit" loading={formLoading}>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {editingGurukul ? 'Update Gurukul' : 'Create Gurukul'}
                </Button>
                <Button type="button" variant="danger" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {/* Gurukul Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search gurukuls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button onClick={() => setShowCreateForm(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Gurukul
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGurukuls.length === 0 ? (
            <div className="text-center py-8">
              <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No gurukuls found</h3>
              <p className="text-gray-600">No gurukuls match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gurukul
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGurukuls.map((gurukul) => (
                    <tr key={gurukul.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{gurukul.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: sanitizeHtml(gurukul.description),
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">/{gurukul.slug}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <BookOpenIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-600">
                            {courseCounts[gurukul.id] || 0} courses
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            gurukul.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                          size="sm"
                        >
                          {gurukul.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(gurukul.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingGurukul(gurukul)}
                            title="View Gurukul Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(gurukul)}>
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={gurukul.is_active ? 'ghost' : 'secondary'}
                            onClick={() => handleToggleStatus(gurukul.id, gurukul.is_active)}
                          >
                            {gurukul.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(gurukul.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Gurukul Details Modal */}
      {viewingGurukul && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-300">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600">
              <h2 className="text-xl font-bold text-white">Gurukul Details</h2>
              <button
                onClick={() => setViewingGurukul(null)}
                className="p-2 hover:bg-white/20 rounded-lg text-white/80 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Header with Image */}
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-sm text-gray-900 font-semibold">
                          {viewingGurukul.name}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <Badge
                          className={
                            viewingGurukul.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                          size="sm"
                        >
                          {viewingGurukul.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Sort Order
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingGurukul.sort_order || 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {(viewingGurukul.cover_image_url || viewingGurukul.image_url) && (
                    <div className="flex-shrink-0">
                      <img
                        src={viewingGurukul.cover_image_url || viewingGurukul.image_url}
                        alt={viewingGurukul.name}
                        className="w-48 h-32 object-cover rounded-lg border shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  <div className="text-sm text-gray-900 leading-relaxed">
                    {viewingGurukul.description ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(viewingGurukul.description),
                        }}
                      />
                    ) : (
                      'No description provided'
                    )}
                  </div>
                </div>
                {/* Statistics & Performance */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Statistics & Performance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <BookOpenIcon className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-900">Total Courses</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {courseCounts[viewingGurukul.id] || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <GlobeAltIcon className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-900">Status</p>
                          <p className="text-lg font-bold text-green-600">
                            {viewingGurukul.is_active ? 'Live' : 'Offline'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">#</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-orange-900">Priority</p>
                          <p className="text-lg font-bold text-orange-600">
                            {viewingGurukul.sort_order || 'Not set'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Selector Modal */}
      {mediaSelectorOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Cover Media</h3>
              <button
                onClick={() => setMediaSelectorOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>✕
              </button>
            </div>
            <MediaSelector
              multiple={false}
              accept={['image', 'video']}
              compact={false}
              showUpload={true}
              onSelect={(mediaFiles) => {
                if (mediaFiles.length > 0) {
                  const selectedMedia = mediaFiles[0]
                  setFormData((prev) => ({
                    ...prev,
                    selected_cover_media_id: selectedMedia.id,
                    cover_image_url: selectedMedia.file_url,
                  }))
                }
                setMediaSelectorOpen(false)
              }}
              title="Select Cover Media"
              emptyMessage="No images or videos found. Upload some media first."
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        variant="danger"
      />
    </div>
  )
}
