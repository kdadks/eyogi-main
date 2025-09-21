import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { formatDate, generateSlug, toSentenceCase } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  CheckIcon,
  Bars3Icon,
  LinkIcon,
} from '@heroicons/react/24/outline'

interface ContentPage {
  id: string
  title: string
  slug: string
  type: 'page' | 'blog' | 'gurukul'
  status: 'published' | 'draft' | 'archived'
  author: string
  content: string
  meta_description: string
  created_at: string
  updated_at: string
  views: number
}

interface HeaderMenuItem {
  id: string
  name: string
  href: string
  order: number
  is_active: boolean
  icon?: string
  parent_id?: string
  children?: HeaderMenuItem[]
}

interface PageFormData {
  title: string
  slug: string
  type: 'page' | 'blog' | 'gurukul'
  status: 'published' | 'draft' | 'archived'
  content: string
  meta_description: string
}

interface MenuFormData {
  name: string
  href: string
  icon: string
  parent_id: string
  is_active: boolean
}

export default function ContentManagement() {
  const [pages, setPages] = useState<ContentPage[]>([])
  const [menuItems, setMenuItems] = useState<HeaderMenuItem[]>([])
  const [filteredPages, setFilteredPages] = useState<ContentPage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'pages' | 'menu'>('pages')

  // Page Management States
  const [showPageForm, setShowPageForm] = useState(false)
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null)
  const [viewingPage, setViewingPage] = useState<ContentPage | null>(null)
  const [pageFormData, setPageFormData] = useState<PageFormData>({
    title: '',
    slug: '',
    type: 'page',
    status: 'draft',
    content: '',
    meta_description: '',
  })
  const [pageFormLoading, setPageFormLoading] = useState(false)

  // Menu Management States
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<HeaderMenuItem | null>(null)
  const [menuFormData, setMenuFormData] = useState<MenuFormData>({
    name: '',
    href: '',
    icon: '',
    parent_id: '',
    is_active: true,
  })
  const [menuFormLoading, setMenuFormLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Auto-generate slug when title changes
    if (pageFormData.title && !editingPage) {
      setPageFormData((prev) => ({
        ...prev,
        slug: generateSlug(pageFormData.title),
      }))
    }
  }, [pageFormData.title, editingPage])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load real content pages from database
      // For now, use empty arrays until content API is implemented
      setPages([])
      setMenuItems([])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load content data')
    } finally {
      setLoading(false)
    }
  }

  const filterPages = React.useCallback(() => {
    let filtered = pages

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (page) =>
          page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          page.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
          page.content.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((page) => page.type === typeFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((page) => page.status === statusFilter)
    }

    setFilteredPages(filtered)
  }, [pages, searchTerm, typeFilter, statusFilter])

  useEffect(() => {
    filterPages()
  }, [filterPages])

  // Page Management Functions
  const resetPageForm = () => {
    setPageFormData({
      title: '',
      slug: '',
      type: 'page',
      status: 'draft',
      content: '',
      meta_description: '',
    })
    setShowPageForm(false)
    setEditingPage(null)
    setViewingPage(null)
  }

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPageFormLoading(true)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (editingPage) {
        // Update existing page
        const updatedPages = pages.map((page) =>
          page.id === editingPage.id
            ? {
                ...page,
                ...pageFormData,
                updated_at: new Date().toISOString(),
              }
            : page,
        )
        setPages(updatedPages)
        toast.success('Page updated successfully')
      } else {
        // Create new page
        const newPage: ContentPage = {
          id: Math.random().toString(36).substr(2, 9),
          ...pageFormData,
          author: 'Admin',
          views: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setPages([...pages, newPage])
        toast.success('Page created successfully')
      }

      resetPageForm()
    } catch (error) {
      console.error('Error saving page:', error)
      toast.error('Failed to save page')
    } finally {
      setPageFormLoading(false)
    }
  }

  const handleEditPage = (page: ContentPage) => {
    setEditingPage(page)
    setPageFormData({
      title: page.title,
      slug: page.slug,
      type: page.type,
      status: page.status,
      content: page.content,
      meta_description: page.meta_description,
    })
    setShowPageForm(true)
  }

  const handleViewPage = (page: ContentPage) => {
    setViewingPage(page)
  }

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return
    }

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      const updatedPages = pages.filter((page) => page.id !== pageId)
      setPages(updatedPages)
      toast.success('Page deleted successfully')
    } catch (error) {
      console.error('Error deleting page:', error)
      toast.error('Failed to delete page')
    }
  }

  // Menu Management Functions
  const resetMenuForm = () => {
    setMenuFormData({
      name: '',
      href: '',
      icon: '',
      parent_id: '',
      is_active: true,
    })
    setShowMenuForm(false)
    setEditingMenuItem(null)
  }

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMenuFormLoading(true)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (editingMenuItem) {
        // Update existing menu item
        const updatedMenuItems = menuItems.map((item) =>
          item.id === editingMenuItem.id
            ? {
                ...item,
                ...menuFormData,
                order: item.order,
              }
            : item,
        )
        setMenuItems(updatedMenuItems)
        toast.success('Menu item updated successfully')
      } else {
        // Create new menu item
        const newMenuItem: HeaderMenuItem = {
          id: Math.random().toString(36).substr(2, 9),
          ...menuFormData,
          order: menuItems.length + 1,
        }
        setMenuItems([...menuItems, newMenuItem])
        toast.success('Menu item created successfully')
      }

      resetMenuForm()
    } catch (error) {
      console.error('Error saving menu item:', error)
      toast.error('Failed to save menu item')
    } finally {
      setMenuFormLoading(false)
    }
  }

  const handleEditMenuItem = (menuItem: HeaderMenuItem) => {
    setEditingMenuItem(menuItem)
    setMenuFormData({
      name: menuItem.name,
      href: menuItem.href,
      icon: menuItem.icon || '',
      parent_id: menuItem.parent_id || '',
      is_active: menuItem.is_active,
    })
    setShowMenuForm(true)
  }

  const handleDeleteMenuItem = async (menuItemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
      return
    }

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      const updatedMenuItems = menuItems.filter((item) => item.id !== menuItemId)
      setMenuItems(updatedMenuItems)
      toast.success('Menu item deleted successfully')
    } catch (error) {
      console.error('Error deleting menu item:', error)
      toast.error('Failed to delete menu item')
    }
  }

  const handleToggleMenuStatus = async (menuItemId: string, currentStatus: boolean) => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200))

      const updatedMenuItems = menuItems.map((item) =>
        item.id === menuItemId ? { ...item, is_active: !currentStatus } : item,
      )
      setMenuItems(updatedMenuItems)
      toast.success(`Menu item ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating menu item status:', error)
      toast.error('Failed to update menu item status')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || colors.draft
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page':
        return DocumentTextIcon
      case 'blog':
        return DocumentDuplicateIcon
      case 'gurukul':
        return GlobeAltIcon
      default:
        return DocumentTextIcon
    }
  }

  const iconOptions = [
    { value: 'HomeIcon', label: 'Home' },
    { value: 'GlobeAltIcon', label: 'Globe' },
    { value: 'AcademicCapIcon', label: 'Academic' },
    { value: 'InformationCircleIcon', label: 'Info' },
    { value: 'PhoneIcon', label: 'Phone' },
    { value: 'BookOpenIcon', label: 'Book' },
    { value: 'UserGroupIcon', label: 'Users' },
  ]

  const stats = {
    totalPages: pages.length,
    published: pages.filter((p) => p.status === 'published').length,
    draft: pages.filter((p) => p.status === 'draft').length,
    archived: pages.filter((p) => p.status === 'archived').length,
    totalViews: pages.reduce((sum, p) => sum + p.views, 0),
    totalMenuItems: menuItems.length,
    activeMenuItems: menuItems.filter((m) => m.is_active).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalPages}</div>
            <div className="text-sm text-gray-600">Total Pages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <div className="text-sm text-gray-600">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            <div className="text-sm text-gray-600">Drafts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalViews.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Views</div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pages')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pages'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5" />
            <span>Pages & Content</span>
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'menu'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bars3Icon className="h-5 w-5" />
            <span>Header Menu</span>
          </button>
        </nav>
      </div>

      {/* Page View Modal */}
      {viewingPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Page Preview</h2>
                <Button variant="ghost" onClick={() => setViewingPage(null)}>
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Page Information</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <p>
                      <strong>Title:</strong> {viewingPage.title}
                    </p>
                    <p>
                      <strong>Slug:</strong> /{viewingPage.slug}
                    </p>
                    <p>
                      <strong>Type:</strong>{' '}
                      <Badge className={getStatusColor(viewingPage.type)} size="sm">
                        {toSentenceCase(viewingPage.type)}
                      </Badge>
                    </p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <Badge className={getStatusColor(viewingPage.status)} size="sm">
                        {toSentenceCase(viewingPage.status)}
                      </Badge>
                    </p>
                    <p>
                      <strong>Author:</strong> {viewingPage.author}
                    </p>
                    <p>
                      <strong>Views:</strong> {viewingPage.views.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Meta Description</h3>
                  <p className="text-sm text-gray-600">{viewingPage.meta_description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Content Preview</h3>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: viewingPage.content }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          {/* Page Form */}
          {showPageForm && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {editingPage ? 'Edit Page' : 'Create New Page'}
                  </h3>
                  <Button variant="ghost" onClick={resetPageForm}>
                    <XMarkIcon className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePageSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Page Title"
                      value={pageFormData.title}
                      onChange={(e) =>
                        setPageFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      required
                    />
                    <Input
                      label="URL Slug"
                      value={pageFormData.slug}
                      onChange={(e) =>
                        setPageFormData((prev) => ({ ...prev, slug: e.target.value }))
                      }
                      required
                      helperText="URL-friendly identifier"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Page Type</label>
                      <select
                        value={pageFormData.type}
                        onChange={(e) =>
                          setPageFormData((prev) => ({
                            ...prev,
                            type: e.target.value as 'page' | 'blog' | 'gurukul',
                          }))
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                      >
                        <option value="page">Page</option>
                        <option value="blog">Blog Post</option>
                        <option value="gurukul">Gurukul Page</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={pageFormData.status}
                        onChange={(e) =>
                          setPageFormData((prev) => ({
                            ...prev,
                            status: e.target.value as 'published' | 'draft' | 'archived',
                          }))
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Meta Description
                    </label>
                    <textarea
                      value={pageFormData.meta_description}
                      onChange={(e) =>
                        setPageFormData((prev) => ({ ...prev, meta_description: e.target.value }))
                      }
                      rows={2}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                      placeholder="Brief description for search engines..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Content</label>
                    <textarea
                      value={pageFormData.content}
                      onChange={(e) =>
                        setPageFormData((prev) => ({ ...prev, content: e.target.value }))
                      }
                      rows={10}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                      placeholder="Page content (HTML supported)..."
                      required
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button type="submit" loading={pageFormLoading}>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      {editingPage ? 'Update Page' : 'Create Page'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetPageForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Pages Management */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <h2 className="text-xl font-bold">Pages & Content</h2>

                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search pages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {/* Type Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Types</option>
                    <option value="page">Pages</option>
                    <option value="blog">Blog Posts</option>
                    <option value="gurukul">Gurukul Pages</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>

                  <Button onClick={() => setShowPageForm(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Page
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredPages.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pages found</h3>
                  <p className="text-gray-600">No pages match your current filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Page
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Updated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPages.map((page) => {
                        const TypeIcon = getTypeIcon(page.type)
                        return (
                          <tr key={page.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <TypeIcon className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {page.title}
                                  </div>
                                  <div className="text-sm text-gray-500">/{page.slug}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="capitalize text-sm text-gray-600">{page.type}</span>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={getStatusColor(page.status)} size="sm">
                                {toSentenceCase(page.status)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{page.author}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {page.views.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDate(page.updated_at)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewPage(page)}
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditPage(page)}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleDeletePage(page.id)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header Menu Tab */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Menu Form */}
          {showMenuForm && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {editingMenuItem ? 'Edit Menu Item' : 'Create New Menu Item'}
                  </h3>
                  <Button variant="ghost" onClick={resetMenuForm}>
                    <XMarkIcon className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMenuSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Menu Name"
                      value={menuFormData.name}
                      onChange={(e) =>
                        setMenuFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                    <Input
                      label="Link URL"
                      value={menuFormData.href}
                      onChange={(e) =>
                        setMenuFormData((prev) => ({ ...prev, href: e.target.value }))
                      }
                      required
                      placeholder="/page-url"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Icon</label>
                      <select
                        value={menuFormData.icon}
                        onChange={(e) =>
                          setMenuFormData((prev) => ({ ...prev, icon: e.target.value }))
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                      >
                        <option value="">No Icon</option>
                        {iconOptions.map((icon) => (
                          <option key={icon.value} value={icon.value}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={menuFormData.is_active}
                        onChange={(e) =>
                          setMenuFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                        }
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                        Active in Menu
                      </label>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button type="submit" loading={menuFormLoading}>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      {editingMenuItem ? 'Update Menu Item' : 'Create Menu Item'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetMenuForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Menu Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Header Menu Management</h2>
                  <p className="text-sm text-gray-600">Manage navigation menu items</p>
                </div>
                <Button onClick={() => setShowMenuForm(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Menu Item
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {menuItems.length === 0 ? (
                <div className="text-center py-8">
                  <Bars3Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items</h3>
                  <p className="text-gray-600">Create your first menu item to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {menuItems
                    .sort((a, b) => a.order - b.order)
                    .map((menuItem) => (
                      <div
                        key={menuItem.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Bars3Icon className="h-4 w-4 text-gray-400 cursor-move" />
                            <span className="text-sm text-gray-500">#{menuItem.order}</span>
                          </div>

                          <div className="flex items-center space-x-3">
                            {menuItem.icon && (
                              <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <LinkIcon className="h-4 w-4 text-gray-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{menuItem.name}</p>
                              <p className="text-sm text-gray-500">{menuItem.href}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <Badge
                            className={
                              menuItem.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {menuItem.is_active ? 'Active' : 'Inactive'}
                          </Badge>

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditMenuItem(menuItem)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={menuItem.is_active ? 'ghost' : 'secondary'}
                              onClick={() =>
                                handleToggleMenuStatus(menuItem.id, menuItem.is_active)
                              }
                            >
                              {menuItem.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteMenuItem(menuItem.id)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
