
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Download,
  Plus,
  Eye,
  Clock,
  User,
} from 'lucide-react'
import {
  AdminLayout,
  StatCard,
  Card,
  CardBody,
  DataTable,
  Button,
  Badge,
  Modal,
  Select,
  Input,
  Textarea,
} from '@/components/admin'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

interface Page {
  id: string
  title: string
  slug: string
  content: string
  author_id: string
  author_name?: string
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  published_at?: string
  views?: number
}

export default function AdminPages() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchPages()
  }, [filterStatus, sortBy, sortOrder])

  const fetchPages = async () => {
    try {
      setLoading(true)
      let query = supabase.from('pages').select('*')

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query
      if (error) throw error
      setPages(data || [])
    } catch (error) {
      console.error('Error fetching pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        page.title.toLowerCase().includes(searchLower) ||
        page.slug.toLowerCase().includes(searchLower)
      )
    })
  }, [pages, searchTerm])

  const stats = {
    total: pages.length,
    published: pages.filter((p) => p.status === 'published').length,
    draft: pages.filter((p) => p.status === 'draft').length,
    totalViews: pages.reduce((sum, p) => sum + (p.views || 0), 0),
  }

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedPages(new Set(filteredPages.map((p) => p.id)))
    } else {
      setSelectedPages(new Set())
    }
  }

  const handleSelectRow = (row: Page, selected: boolean) => {
    const newSelected = new Set(selectedPages)
    if (selected) {
      newSelected.add(row.id)
    } else {
      newSelected.delete(row.id)
    }
    setSelectedPages(newSelected)
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Slug', 'Status', 'Author', 'Created', 'Views']
    const rows = filteredPages.map((p) => [
      p.id,
      p.title,
      p.slug,
      p.status,
      p.author_name || 'Unknown',
      new Date(p.created_at).toLocaleDateString(),
      p.views || 0,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pages-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (value: string) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{value}</code>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge
          variant={
            value === 'published'
              ? 'success'
              : value === 'draft'
                ? 'secondary'
                : 'warning'
          }
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'author_name',
      label: 'Author',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          {value || 'Unknown'}
        </div>
      ),
    },
    {
      key: 'views',
      label: 'Views',
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4 text-gray-400" />
          {value || 0}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          {new Date(value).toLocaleDateString()}
        </div>
      ),
    },
  ]

  return (
    <AdminLayout
      title="Pages"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Pages' },
      ]}
      onSearch={setSearchTerm}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Pages"
          value={stats.total}
          color="primary"
        />
        <StatCard
          title="Published"
          value={stats.published}
          color="success"
          change={{ value: 2, direction: 'up' }}
        />
        <StatCard
          title="Drafts"
          value={stats.draft}
          color="warning"
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          color="info"
        />
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Filter by Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />

              <div className="flex items-end gap-2">
                <Button
                  onClick={() => {
                    setFilterStatus('all')
                    setSearchTerm('')
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Reset Filters
                </Button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={exportToCSV} icon={<Download className="w-4 h-4" />}>
                Export CSV
              </Button>
              <Button
                onClick={() => setIsModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                New Page
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Data Table */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredPages}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          selectable
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          selectedRows={selectedPages}
          rowKey="id"
          pagination={{
            total: filteredPages.length,
            limit: 10,
            offset: 0,
          }}
          onView={(row) => console.log('View:', row)}
          onEdit={(row) => console.log('Edit:', row)}
          onDelete={(row) => console.log('Delete:', row)}
        />
      </Card>

      {/* New Page Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Page"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Page title"
            required
          />
          <Input
            label="Slug"
            placeholder="page-slug"
            required
          />
          <Textarea
            label="Content"
            placeholder="Page content"
            rows={12}
            required
          />
          <Select
            label="Status"
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
            ]}
            required
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Create Page</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
