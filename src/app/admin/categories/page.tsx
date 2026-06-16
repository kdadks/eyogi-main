/**
 * Categories Management Page
 */

'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { DataTable } from '@/components/admin/DataTable'

interface Category {
  id: string
  name: string
  slug: string
  description: string
}

const DEMO_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Spiritual and Educational Awareness',
    slug: 'spiritual-awareness',
    description: 'Teachings about Hindu philosophy and spiritual practices',
  },
  {
    id: '2',
    name: 'Hinduism Basics',
    slug: 'hinduism-basics',
    description: 'Foundational concepts and practices of Hinduism',
  },
]

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'slug', label: 'Slug' },
  {
    key: 'description',
    label: 'Description',
    render: (value: string) => value.substring(0, 40) + '...',
  },
]

export default function CategoriesPage() {
  const [categories] = useState<Category[]>(DEMO_CATEGORIES)

  const handleEdit = (category: Category) => {
    alert(`Edit: ${category.name}`)
  }

  const handleDelete = (category: Category) => {
    alert(`Delete: ${category.name}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
        <p className="text-slate-600 mt-1">Manage post categories</p>
      </div>

      <DataTable
        columns={COLUMNS}
        data={categories}
        loading={false}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
