/**
 * Pages Management Page
 */

'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

interface Page {
  id: string
  title: string
  slug: string
  excerpt: string
  created_at: string
}

const COLUMNS = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'slug', label: 'Slug' },
  {
    key: 'created_at',
    label: 'Created',
    render: (value: string) => new Date(value).toLocaleDateString(),
  },
]

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(false)
  }, [search])

  const handleEdit = (page: Page) => {
    window.location.href = `/admin/pages/${page.id}/edit`
  }

  const handleDelete = async (page: Page) => {
    if (!confirm(`Delete "${page.title}"?`)) return
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pages</h1>
          <p className="text-slate-600 mt-1">Manage your website pages</p>
        </div>
        <Link
          href="/admin/pages/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Page
        </Link>
      </div>

      <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border border-slate-200">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search pages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 outline-none text-slate-900"
        />
      </div>

      <DataTable
        columns={COLUMNS}
        data={pages}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
