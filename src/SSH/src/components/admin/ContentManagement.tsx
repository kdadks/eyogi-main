import React, { useState, useEffect, useCallback } from 'react'
import { SafeReactQuill } from '../ui/SafeReactQuill'
import { toast } from 'sonner'
import { EyeIcon, PencilIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Page } from '../../types'
import { getPages, createPage, updatePage, deletePage } from '../../lib/api/pages'
import { getCurrentUser } from '../../lib/auth'
import { Button } from '../ui/Button'
import { sanitizeRichHtml } from '../../utils/sanitize'
import { Input } from '../ui/Input'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { toSentenceCase } from '../../lib/utils'

// Form data interface for creating/editing pages
interface PageFormData {
  title: string
  slug: string
  page_type: string
  is_published: boolean
  content: string
  seo_description: string
  seo_title?: string
  seo_keywords?: string[]
  featured_image_url?: string
  template?: string
  sort_order?: number
}

const initialFormData: PageFormData = {
  title: '',
  slug: '',
  page_type: 'legal',
  is_published: false,
  content: '',
  seo_description: '',
}

export default function ContentManagement() {
  const [pages, setPages] = useState<Page[]>([])
  const [filteredPages, setFilteredPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [viewingPage, setViewingPage] = useState<Page | null>(null)
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const [formData, setFormData] = useState<PageFormData>(initialFormData)
  const [saving, setSaving] = useState(false)

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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const pagesData = await getPages()
      setPages(pagesData)
    } catch {
      toast.error('Failed to load pages')
    } finally {
      setLoading(false)
    }
  }

  const filterPages = useCallback(() => {
    let filtered = pages

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (page) =>
          page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          page.slug.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((page) => page.page_type === typeFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'published') {
        filtered = filtered.filter((page) => page.is_published)
      } else if (statusFilter === 'draft') {
        filtered = filtered.filter((page) => !page.is_published)
      }
    }

    setFilteredPages(filtered)
  }, [pages, searchTerm, typeFilter, statusFilter])

  useEffect(() => {
    filterPages()
  }, [filterPages])

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingPage(null)
    setShowCreateModal(false)
    setShowEditModal(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Auto-generate slug when title changes for new pages
    if (name === 'title' && !editingPage) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }))
    }
  }

  const handleContentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, content: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const currentUser = await getCurrentUser()

      const pageData = {
        ...formData,
        content: { html: formData.content }, // Convert string to JSONB format
      }

      if (editingPage) {
        // Update existing page
        await updatePage(editingPage.id, pageData)
        const updatedPages = pages.map((page) =>
          page.id === editingPage.id
            ? { ...page, ...pageData, updated_at: new Date().toISOString() }
            : page,
        )
        setPages(updatedPages)
        toast.success('Page updated successfully')
      } else {
        // Create new page - include created_by
        const newPageData = {
          ...pageData,
          created_by: currentUser?.id, // Use actual user ID or null
        }
        const newPage = await createPage(newPageData)
        setPages([newPage, ...pages])
        toast.success('Page created successfully')
      }

      resetForm()
    } catch {
      toast.error('Failed to save page')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (page: Page) => {
    setEditingPage(page)
    setFormData({
      title: page.title,
      slug: page.slug,
      page_type: page.page_type,
      is_published: page.is_published,
      content:
        typeof page.content === 'object' && page.content?.html ? String(page.content.html) : '',
      seo_description: page.seo_description || '',
      seo_title: page.seo_title,
      seo_keywords: page.seo_keywords,
      featured_image_url: page.featured_image_url,
      template: page.template,
      sort_order: page.sort_order,
    })
    setShowEditModal(true)
  }

  const handleDelete = (page: Page) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Page',
      message: `Are you sure you want to delete "${page.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deletePage(page.id)
          const updatedPages = pages.filter((p) => p.id !== page.id)
          setPages(updatedPages)
          toast.success('Page deleted successfully')
        } catch {
          toast.error('Failed to delete page')
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
      },
    })
  }

  const handleTogglePublish = async (page: Page) => {
    try {
      const currentUser = await getCurrentUser()
      const updatedData: { is_published: boolean; published_by?: string } = {
        is_published: !page.is_published,
      }

      // Set published_by when publishing
      if (updatedData.is_published) {
        updatedData.published_by = currentUser?.id // Use actual user ID or null
      }

      await updatePage(page.id, updatedData)

      const updatedPages = pages.map((p) =>
        p.id === page.id ? { ...p, ...updatedData, updated_at: new Date().toISOString() } : p,
      )
      setPages(updatedPages)

      toast.success(`Page ${updatedData.is_published ? 'published' : 'unpublished'} successfully`)
    } catch {
      toast.error('Failed to update page status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="legal">Legal</option>
          <option value="page">Page</option>
          <option value="blog">Blog</option>
          <option value="gurukul">Gurukul</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Page
        </Button>
      </div>

      {/* Pages List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Published
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                      ? 'No pages match your filters'
                      : 'No pages created yet'}
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{page.title}</div>
                        <div className="text-sm text-gray-500">/{page.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {toSentenceCase(page.page_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          page.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {page.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(page.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.published_at ? new Date(page.published_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setViewingPage(page)}>
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(page)}>
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(page)}
                          className={page.is_published ? 'text-yellow-600' : 'text-green-600'}
                        >
                          {page.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(page)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Create New Page</h2>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <Input
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="page_type"
                      value={formData.page_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="legal">Legal</option>
                      <option value="page">Page</option>
                      <option value="blog">Blog</option>
                      <option value="gurukul">Gurukul</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_published"
                      id="is_published"
                      checked={formData.is_published}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                      Publish immediately
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SEO Description
                  </label>
                  <Input
                    name="seo_description"
                    value={formData.seo_description}
                    onChange={handleInputChange}
                    placeholder="Brief description for search engines"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <SafeReactQuill
                    key="create-editor"
                    value={formData.content}
                    onChange={handleContentChange}
                    placeholder="Enter page content..."
                    className="bg-white"
                    style={{ height: '300px', marginBottom: '50px' }}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ script: 'sub' }, { script: 'super' }],
                        [{ indent: '-1' }, { indent: '+1' }],
                        [{ direction: 'rtl' }],
                        [{ color: [] }, { background: [] }],
                        [{ align: [] }],
                        ['link', 'image', 'video'],
                        ['clean'],
                      ],
                    }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Page'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Edit Page</h2>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <Input
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="page_type"
                      value={formData.page_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="legal">Legal</option>
                      <option value="page">Page</option>
                      <option value="blog">Blog</option>
                      <option value="gurukul">Gurukul</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_published"
                      id="is_published_edit"
                      checked={formData.is_published}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label
                      htmlFor="is_published_edit"
                      className="text-sm font-medium text-gray-700"
                    >
                      Published
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SEO Description
                  </label>
                  <Input
                    name="seo_description"
                    value={formData.seo_description}
                    onChange={handleInputChange}
                    placeholder="Brief description for search engines"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <SafeReactQuill
                    key={editingPage ? `edit-${editingPage.id}` : 'edit-new'}
                    value={formData.content}
                    onChange={handleContentChange}
                    placeholder="Enter page content..."
                    className="bg-white"
                    style={{ height: '300px', marginBottom: '50px' }}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ script: 'sub' }, { script: 'super' }],
                        [{ indent: '-1' }, { indent: '+1' }],
                        [{ direction: 'rtl' }],
                        [{ color: [] }, { background: [] }],
                        [{ align: [] }],
                        ['link', 'image', 'video'],
                        ['clean'],
                      ],
                    }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Updating...' : 'Update Page'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">View Page</h2>
                <Button variant="ghost" size="sm" onClick={() => setViewingPage(null)}>
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">{viewingPage.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {toSentenceCase(viewingPage.page_type)}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        viewingPage.is_published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {viewingPage.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Slug:</strong> /{viewingPage.slug}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(viewingPage.created_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Created By:</strong> {viewingPage.created_by || 'System'}
                  </div>
                  {viewingPage.published_at && (
                    <div>
                      <strong>Published:</strong>{' '}
                      {new Date(viewingPage.published_at).toLocaleString()}
                    </div>
                  )}
                  <div>
                    <strong>Published By:</strong>{' '}
                    {viewingPage.published_by ||
                      (viewingPage.is_published ? 'System' : 'Not published')}
                  </div>
                </div>

                {viewingPage.seo_description && (
                  <div>
                    <strong>SEO Description:</strong>
                    <p className="text-sm text-gray-600">{viewingPage.seo_description}</p>
                  </div>
                )}

                <div>
                  <strong>Content:</strong>
                  <div className="mt-2 p-6 bg-gray-50 rounded border max-h-96 overflow-y-auto">
                    {typeof viewingPage.content === 'object' && viewingPage.content?.html ? (
                      <div
                        className="prose prose-sm max-w-none"
                        style={{
                          lineHeight: '1.6',
                          fontSize: '14px',
                        }}
                        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(String(viewingPage.content.html)) }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {String(viewingPage.content)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => setViewingPage(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
