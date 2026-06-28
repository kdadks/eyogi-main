// src/pages/admin/AdminPosts.tsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Plus, Eye, Clock, User, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  AdminLayout, StatCard, Card, CardBody, DataTable,
  Button, Badge, Select, Input,
} from '@/components/admin'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  status: 'draft' | 'published' | 'archived'
  author_name?: string
  views?: number
  created_at: string
  updated_at: string
}

export default function AdminPosts() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())

  const fetchPosts = async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from('posts').select('*')
    if (filterStatus !== 'all') query = query.eq('status', filterStatus)
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    const { data, error } = await query
    if (!error) setPosts((data ?? []) as Post[])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [filterStatus, sortBy, sortOrder])

  const filteredPosts = useMemo(() =>
    posts.filter((p) => {
      const s = searchTerm.toLowerCase()
      return p.title.toLowerCase().includes(s) || p.slug.toLowerCase().includes(s)
    }),
    [posts, searchTerm],
  )

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    totalViews: posts.reduce((sum, p) => sum + (p.views || 0), 0),
  }

  const handleDelete = async (post: Post) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (!error) setPosts((prev) => prev.filter((p) => p.id !== post.id))
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Status', 'Created']
    const rows = filteredPosts.map((p) => [p.id, p.title, p.status, new Date(p.created_at).toLocaleDateString()])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `posts-${new Date().toISOString().split('T')[0]}.csv` })
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    { key: 'title', label: 'Title', sortable: true },
    {
      key: 'status', label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'published' ? 'success' : value === 'draft' ? 'secondary' : 'warning'}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'author_name', label: 'Author',
      render: (value: string) => <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />{value || 'Unknown'}</div>,
    },
    {
      key: 'views', label: 'Views',
      render: (value: number) => <div className="flex items-center gap-1"><Eye className="w-4 h-4 text-gray-400" />{value || 0}</div>,
    },
    {
      key: 'created_at', label: 'Created', sortable: true,
      render: (value: string) => <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-4 h-4" />{new Date(value).toLocaleDateString()}</div>,
    },
  ]

  return (
    <AdminLayout
      title="Blog Posts"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Blog Posts' }]}
      actions={
        <Button onClick={() => navigate('/admin/posts/new')} icon={<Plus className="w-4 h-4" />}>
          New Post
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Posts" value={stats.total} color="primary" />
        <StatCard title="Published" value={stats.published} color="success" />
        <StatCard title="Drafts" value={stats.draft} color="warning" />
        <StatCard title="Total Views" value={stats.totalViews} color="info" />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-40">
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
            </div>
            <Button onClick={exportToCSV} variant="outline" icon={<Download className="w-4 h-4" />}>Export CSV</Button>
            <Button onClick={() => navigate('/admin/posts/new')} icon={<Plus className="w-4 h-4" />}>New Post</Button>
          </div>
        </CardBody>
      </Card>

      {!loading && posts.length === 0 ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
                <FileText className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-800 mb-1">No posts yet</h3>
                <p className="text-stone-500 text-sm max-w-sm">
                  Posts you create here appear on the <strong>/hinduism</strong> page. Create your first post to get started.
                </p>
              </div>
              <Button onClick={() => navigate('/admin/posts/new')} icon={<Plus className="w-4 h-4" />}>
                Create First Post
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={filteredPosts}
            loading={loading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(key) => { if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortBy(key); setSortOrder('asc') } }}
            selectable
            onSelectAll={(selected) => setSelectedPosts(selected ? new Set(filteredPosts.map((p) => p.id)) : new Set())}
            onSelectRow={(row, selected) => {
              const next = new Set(selectedPosts)
              selected ? next.add(row.id) : next.delete(row.id)
              setSelectedPosts(next)
            }}
            selectedRows={selectedPosts}
            rowKey="id"
            pagination={{ total: filteredPosts.length, limit: 10, offset: 0 }}
            onEdit={(row) => navigate(`/admin/posts/${row.id}/edit`)}
            onDelete={handleDelete}
            onView={(row) => navigate(`/admin/posts/${row.id}/edit`)}
          />
        </Card>
      )}
    </AdminLayout>
  )
}
