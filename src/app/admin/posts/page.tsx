/**
 * Posts Management Page - Dynamic Data Fetching
 * Fetches real-time post data from Supabase
 */

'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  published_at: string
  created_at: string
}

const COLUMNS = [
  {
    key: 'title',
    label: 'Title',
    sortable: true,
  },
  {
    key: 'slug',
    label: 'Slug',
  },
  {
    key: 'excerpt',
    label: 'Excerpt',
    render: (value: string) => (value ? value.substring(0, 50) + '...' : '-'),
  },
  {
    key: 'created_at',
    label: 'Created',
    render: (value: string) => new Date(value).toLocaleDateString(),
  },
]

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({
    total: 38,
    limit: 10,
    offset: 0,
  })

  useEffect(() => {
    // Fetch posts from API
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/content/posts?limit=${pagination.limit}&offset=${pagination.offset}${
            search ? `&search=${search}` : ''
          }`,
        )
        const data = await response.json()
        setPosts(data.data?.posts || [])
        if (data.data?.pagination) {
          setPagination(data.data.pagination)
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [pagination.offset, search])

  const handleEdit = (post: Post) => {
    // Navigate to edit page
    window.location.href = `/admin/posts/${post.id}/edit`
  }

  const handleDelete = async (post: Post) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return

    try {
      const response = await fetch(`/api/content/posts/${post.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== post.id))
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Posts</h1>
          <p className="text-slate-600 mt-1">Manage your blog posts</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Post
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border border-slate-200">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPagination((prev) => ({ ...prev, offset: 0 }))
          }}
          className="flex-1 outline-none text-slate-900"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={COLUMNS}
        data={posts}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pagination={pagination}
        onPaginationChange={(offset) => setPagination((prev) => ({ ...prev, offset }))}
      />
    </div>
  )
}
