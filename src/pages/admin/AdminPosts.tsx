
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

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author_id: string
  author_name?: string
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  published_at?: string
  views?: number
  featured_image_url?: string
}

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchPosts()
  }, [filterStatus, sortBy, sortOrder])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      let query = supabase.from('posts').select('*')

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query
      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        post.title.toLowerCase().includes(searchLower) ||
        post.slug.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower)
      )
    })
  }, [posts, searchTerm])

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    totalViews: posts.reduce((sum, p) => sum + (p.views || 0), 0),
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
      setSelectedPosts(new Set(filteredPosts.map((p) => p.id)))
    } else {
      setSelectedPosts(new Set())
    }
  }

  const handleSelectRow = (row: Post, selected: boolean) => {
    const newSelected = new Set(selectedPosts)
    if (selected) {
      newSelected.add(row.id)
    } else {
      newSelected.delete(row.id)
    }
    setSelectedPosts(newSelected)
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Status', 'Author', 'Created', 'Views']
    const rows = filteredPosts.map((p) => [
      p.id,
      p.title,
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
    a.download = `posts-${new Date().toISOString().split('T')[0]}.csv`
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
      title="Blog Posts"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Blog Posts' },
      ]}
      onSearch={setSearchTerm}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Posts"
          value={stats.total}
          color="primary"
        />
        <StatCard
          title="Published"
          value={stats.published}
          color="success"
          change={{ value: 5, direction: 'up' }}
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
          change={{ value: 24, direction: 'up' }}
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
                New Post
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Data Table */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredPosts}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          selectable
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          selectedRows={selectedPosts}
          rowKey="id"
          pagination={{
            total: filteredPosts.length,
            limit: 10,
            offset: 0,
          }}
          onView={(row) => console.log('View:', row)}
          onEdit={(row) => console.log('Edit:', row)}
          onDelete={(row) => console.log('Delete:', row)}
        />
      </Card>

      {/* New Post Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Post"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Enter post title"
            required
          />
          <Input
            label="Slug"
            placeholder="post-slug"
            required
          />
          <Textarea
            label="Excerpt"
            placeholder="Brief summary of the post"
            rows={3}
          />
          <Textarea
            label="Content"
            placeholder="Full post content"
            rows={8}
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
            <Button onClick={() => setIsModalOpen(false)}>Create Post</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
