import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Gurukul } from '@/types'
import { getAllGurukuls, createGurukul, updateGurukul, deleteGurukul } from '@/lib/api/gurukuls'
import { getCourses } from '@/lib/api/courses'
import { formatDate, generateSlug } from '@/lib/utils'
import toast from 'react-hot-toast'
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
  })
  const [formLoading, setFormLoading] = useState(false)
  useEffect(() => {
    loadData()
  }, [])
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
      const [gurukulData, coursesData] = await Promise.all([getAllGurukuls(), getCourses()])
      setGurukuls(gurukulData)
      // Count courses per gurukul
      const counts: Record<string, number> = {}
      coursesData.forEach((course) => {
        counts[course.gurukul_id] = (counts[course.gurukul_id] || 0) + 1
      })
      setCourseCounts(counts)
    } catch (error) {
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
    })
    setShowCreateForm(false)
    setEditingGurukul(null)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      if (editingGurukul) {
        await updateGurukul(editingGurukul.id, formData)
        toast.success('Gurukul updated successfully')
      } else {
        await createGurukul({
          ...formData,
          is_active: true,
          sort_order: 0,
        })
        toast.success('Gurukul created successfully')
      }
      await loadData()
      resetForm()
    } catch (error) {
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
    })
    setShowCreateForm(true)
  }
  const handleDelete = async (gurukulId: string) => {
    if (!confirm('Are you sure you want to delete this gurukul? This action cannot be undone.')) {
      return
    }
    try {
      await deleteGurukul(gurukulId)
      await loadData()
      toast.success('Gurukul deleted successfully')
    } catch (error) {
      toast.error('Failed to delete gurukul')
    }
  }
  const handleToggleStatus = async (gurukulId: string, currentStatus: boolean) => {
    try {
      await updateGurukul(gurukulId, { is_active: !currentStatus })
      await loadData()
      toast.success(`Gurukul ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
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
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                  required
                />
              </div>
              <Input
                label="Image URL"
                value={formData.image_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                helperText="Optional: URL to gurukul image"
              />
              <div className="flex space-x-4">
                <Button type="submit" loading={formLoading}>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {editingGurukul ? 'Update Gurukul' : 'Create Gurukul'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
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
            <h2 className="text-xl font-bold">Gurukul Management</h2>
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
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
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
                              {gurukul.description}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Gurukul Details</h2>
              <button
                onClick={() => setViewingGurukul(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
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
                        <p className="mt-1 text-sm text-gray-900 font-semibold">{viewingGurukul.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Slug</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">/{viewingGurukul.slug}</p>
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
                        <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingGurukul.sort_order || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ID</label>
                        <p className="mt-1 text-xs text-gray-500 font-mono break-all">{viewingGurukul.id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">URL Path</label>
                        <p className="mt-1 text-sm text-blue-600">/gurukuls/{viewingGurukul.slug}</p>
                      </div>
                    </div>
                  </div>
                  {viewingGurukul.image_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={viewingGurukul.image_url}
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
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {viewingGurukul.description || 'No description provided'}
                  </p>
                </div>
                {/* Statistics & Performance */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics & Performance</h3>
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
                {/* Technical Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Database ID</label>
                        <p className="mt-1 text-xs text-gray-500 font-mono break-all bg-white px-2 py-1 rounded border">{viewingGurukul.id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Public URL</label>
                        <p className="mt-1 text-sm text-blue-600 bg-white px-2 py-1 rounded border">
                          /gurukuls/{viewingGurukul.slug}
                        </p>
                      </div>
                      {viewingGurukul.image_url && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Image URL</label>
                          <p className="mt-1 text-xs text-gray-500 break-all bg-white px-2 py-1 rounded border">
                            {viewingGurukul.image_url}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Timestamps */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(viewingGurukul.created_at)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(viewingGurukul.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
