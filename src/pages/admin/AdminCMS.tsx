import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  Globe,
  Calendar,
  Filter,
  Download,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Image,
  Layers,
  MoreVertical,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { Card, CardBody, CardHeader } from '@/components/admin/common/Card'
import { DataTable } from '@/components/admin/common/DataTable'
import { Button } from '@/components/admin/common/Button'
import { Badge } from '@/components/admin/common/Badge'
import { Select } from '@/components/admin/common/Select'
import { Input } from '@/components/admin/common/Input'
import { Modal } from '@/components/admin/common/Modal'
import { StatCard } from '@/components/admin/common/StatCard'
import { cmsAPI } from '@/lib/cms-api'
import type { CMSContent, CMSContentFilters, CMSLanguage } from '@/lib/cms-types'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function AdminCMS() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // State
  const [content, setContent] = useState<CMSContent[]>([])
  const [languages, setLanguages] = useState<CMSLanguage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    scheduled: 0,
    total_views: 0,
  })

  // Filters
  const [filters, setFilters] = useState<CMSContentFilters>({
    status: undefined,
    content_type: undefined,
    page_type: undefined,
    language_id: undefined,
    search: '',
    sort_by: 'updated_at',
    sort_order: 'desc',
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  // Fetch data
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true)
      const response = await cmsAPI.content.getAll(filters, page, limit)
      setContent(response.data)
      
      // Calculate stats
      setStats({
        total: response.total,
        published: response.data.filter((c) => c.status === 'published').length,
        drafts: response.data.filter((c) => c.status === 'draft').length,
        scheduled: response.data.filter((c) => c.status === 'scheduled').length,
        total_views: response.data.reduce((sum, c) => sum + c.views, 0),
      })
    } catch (error) {
      console.error('Error fetching content:', error)
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }, [filters, page, limit])

  const fetchLanguages = async () => {
    try {
      const langs = await cmsAPI.languages.getAll()
      setLanguages(langs)
    } catch (error) {
      console.error('Error fetching languages:', error)
    }
  }

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  useEffect(() => {
    fetchLanguages()
  }, [])

  // Handlers
  const handleCreate = () => {
    navigate('/admin/cms/editor/new')
  }

  const handleEdit = (id: string) => {
    navigate(`/admin/cms/editor/${id}`)
  }

  const handleView = (id: string) => {
    navigate(`/admin/cms/preview/${id}`)
  }

  const handleDuplicate = async (id: string) => {
    if (!user?.id) return
    
    try {
      const duplicate = await cmsAPI.content.duplicate(id, user.id)
      toast.success('Content duplicated successfully')
      fetchContent()
    } catch (error) {
      console.error('Error duplicating content:', error)
      toast.error('Failed to duplicate content')
    }
  }

  const handleDelete = async (id: string) => {
    setItemToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await cmsAPI.content.delete(itemToDelete)
      toast.success('Content deleted successfully')
      fetchContent()
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error deleting content:', error)
      toast.error('Failed to delete content')
    }
  }

  const handlePublish = async (id: string) => {
    if (!user?.id) return

    try {
      await cmsAPI.content.publish(id, user.id)
      toast.success('Content published successfully')
      fetchContent()
    } catch (error) {
      console.error('Error publishing content:', error)
      toast.error('Failed to publish content')
    }
  }

  const handleUnpublish = async (id: string) => {
    if (!user?.id) return

    try {
      await cmsAPI.content.unpublish(id, user.id)
      toast.success('Content unpublished successfully')
      fetchContent()
    } catch (error) {
      console.error('Error unpublishing content:', error)
      toast.error('Failed to unpublish content')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return

    try {
      await Promise.all(
        Array.from(selectedItems).map((id) => cmsAPI.content.delete(id))
      )
      toast.success(`${selectedItems.size} items deleted successfully`)
      setSelectedItems(new Set())
      fetchContent()
    } catch (error) {
      console.error('Error deleting items:', error)
      toast.error('Failed to delete items')
    }
  }

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Title',
      'Type',
      'Page Type',
      'Status',
      'Language',
      'Views',
      'Created',
      'Updated',
    ]
    const rows = content.map((item) => [
      item.id,
      item.title,
      item.content_type,
      item.page_type || '',
      item.status,
      item.language?.code || '',
      item.views,
      new Date(item.created_at).toLocaleDateString(),
      new Date(item.updated_at).toLocaleDateString(),
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cms-content-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      published: 'success',
      draft: 'secondary',
      pending_review: 'warning',
      scheduled: 'info',
      archived: 'default',
    }
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  // Content type icon helper
  const getContentTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      page: FileText,
      section: Layers,
      component: Layers,
      block: Image,
    }
    const Icon = icons[type] || FileText
    return <Icon className="w-4 h-4" />
  }

  // Table columns
  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value: string, row: CMSContent) => (
        <div className="flex items-center gap-2">
          {getContentTypeIcon(row.content_type)}
          <div>
            <div className="font-medium text-stone-900">{value}</div>
            <div className="text-xs text-stone-500">{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'content_type',
      label: 'Type',
      render: (value: string) => (
        <span className="text-sm capitalize">{value}</span>
      ),
    },
    {
      key: 'page_type',
      label: 'Page Type',
      render: (value: string) => (
        <span className="text-sm capitalize">{value || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'language',
      label: 'Language',
      render: (value: any) => (
        <div className="flex items-center gap-1">
          <Globe className="w-3 h-3 text-stone-400" />
          <span className="text-sm">{value?.code?.toUpperCase() || 'EN'}</span>
        </div>
      ),
    },
    {
      key: 'views',
      label: 'Views',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3 text-stone-400" />
          <span className="text-sm">{value || 0}</span>
        </div>
      ),
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1 text-sm text-stone-600">
          <Clock className="w-3 h-3" />
          {new Date(value).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: CMSContent) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleView(row.id)}
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(row.id)}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDuplicate(row.id)}
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </Button>
          {row.status === 'published' ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleUnpublish(row.id)}
              title="Unpublish"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handlePublish(row.id)}
              title="Publish"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row.id)}
            title="Delete"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout
      title="Content Management System"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'CMS' },
      ]}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Content"
          value={stats.total}
          icon={FileText}
          color="primary"
        />
        <StatCard
          title="Published"
          value={stats.published}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="Drafts"
          value={stats.drafts}
          icon={Edit}
          color="warning"
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduled}
          icon={Calendar}
          color="info"
        />
        <StatCard
          title="Total Views"
          value={stats.total_views}
          icon={Eye}
          color="purple"
        />
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardBody>
          <div className="space-y-4">
            {/* Search and Actions Row */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 w-full md:max-w-md">
                <Input
                  placeholder="Search content..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="primary"
                  onClick={handleCreate}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Content
                </Button>
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Export
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchContent}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Refresh
                </Button>
                {selectedItems.size > 0 && (
                  <Button
                    variant="danger"
                    onClick={handleBulkDelete}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Delete ({selectedItems.size})
                  </Button>
                )}
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Select
                label="Status"
                value={filters.status || 'all'}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value === 'all' ? undefined : e.target.value,
                  }))
                }
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending_review">Pending Review</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>

              <Select
                label="Content Type"
                value={filters.content_type || 'all'}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    content_type: e.target.value === 'all' ? undefined : e.target.value,
                  }))
                }
              >
                <option value="all">All Types</option>
                <option value="page">Page</option>
                <option value="section">Section</option>
                <option value="component">Component</option>
                <option value="block">Block</option>
              </Select>

              <Select
                label="Page Type"
                value={filters.page_type || 'all'}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    page_type: e.target.value === 'all' ? undefined : e.target.value,
                  }))
                }
              >
                <option value="all">All Pages</option>
                <option value="home">Home</option>
                <option value="about">About</option>
                <option value="faq">FAQ</option>
                <option value="membership">Membership</option>
                <option value="contact">Contact</option>
                <option value="donation">Donation</option>
                <option value="hinduism">Hinduism</option>
                <option value="forms">Forms</option>
                <option value="custom">Custom</option>
              </Select>

              <Select
                label="Language"
                value={filters.language_id || 'all'}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    language_id: e.target.value === 'all' ? undefined : e.target.value,
                  }))
                }
              >
                <option value="all">All Languages</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name} ({lang.code.toUpperCase()})
                  </option>
                ))}
              </Select>

              <Select
                label="Sort By"
                value={filters.sort_by}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sort_by: e.target.value }))
                }
              >
                <option value="updated_at">Last Updated</option>
                <option value="created_at">Created Date</option>
                <option value="title">Title</option>
                <option value="views">Views</option>
                <option value="status">Status</option>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Data Table */}
      <Card>
        <CardBody>
          <DataTable
            columns={columns}
            data={content}
            loading={loading}
            selectable
            selectedRows={selectedItems}
            onSelectRow={(row, selected) => {
              const newSelected = new Set(selectedItems)
              if (selected) {
                newSelected.add(row.id)
              } else {
                newSelected.delete(row.id)
              }
              setSelectedItems(newSelected)
            }}
            onSelectAll={(selected) => {
              if (selected) {
                setSelectedItems(new Set(content.map((item) => item.id)))
              } else {
                setSelectedItems(new Set())
              }
            }}
            emptyMessage="No content found. Create your first content to get started."
          />
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setItemToDelete(null)
        }}
        title="Delete Content"
      >
        <div className="space-y-4">
          <p className="text-stone-600">
            Are you sure you want to delete this content? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setItemToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
