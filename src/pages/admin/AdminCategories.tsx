
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Hash,
} from 'lucide-react'
import {
  AdminLayout,
  Card,
  CardBody,
  DataTable,
  Button,
  Badge,
  Modal,
  Input,
  Textarea,
} from '@/components/admin'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  post_count?: number
  created_at: string
  updated_at: string
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
  })
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchCategories()
  }, [sortBy, sortOrder])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      let query = supabase.from('categories').select('*')

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        category.name.toLowerCase().includes(searchLower) ||
        category.slug.toLowerCase().includes(searchLower) ||
        (category.description?.toLowerCase().includes(searchLower) ?? false)
      )
    })
  }, [categories, searchTerm])

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    })
  }

  const openModal = (category?: Category) => {
    if (category) {
      setEditingId(category.id)
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        color: category.color || '#3B82F6',
      })
    } else {
      setEditingId(null)
      setFormData({
        name: '',
        slug: '',
        description: '',
        color: '#3B82F6',
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      alert('Name and slug are required')
      return
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            color: formData.color,
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          color: formData.color,
        })

        if (error) throw error
      }

      await fetchCategories()
      setIsModalOpen(false)
    } catch (error: any) {
      alert('Error saving category: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)

      if (error) throw error
      await fetchCategories()
    } catch (error: any) {
      alert('Error deleting category: ' + error.message)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value: string, row: Category) => (
        <div className="flex items-center gap-3">
          {row.color && (
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: row.color }}
            />
          )}
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (value: string) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{value}</code>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: string | undefined) => (
        <span className="text-sm text-gray-600 line-clamp-2">{value || '-'}</span>
      ),
    },
    {
      key: 'post_count',
      label: 'Posts',
      render: (value: number | undefined) => (
        <Badge variant="secondary">{value || 0}</Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ]

  return (
    <AdminLayout
      title="Categories"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Categories' },
      ]}
      onSearch={setSearchTerm}
    >
      <div className="mb-6 flex justify-end">
        <Button onClick={() => openModal()} icon={<Plus className="w-4 h-4" />}>
          New Category
        </Button>
      </div>

      {/* Data Table */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredCategories}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          rowKey="id"
          pagination={{
            total: filteredCategories.length,
            limit: 10,
            offset: 0,
          }}
          onView={(row) => openModal(row)}
          onEdit={(row) => openModal(row)}
          onDelete={(row) => handleDelete(row.id)}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Category' : 'New Category'}
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Technology"
            required
          />

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Input
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., technology"
                required
                hint="Auto-generated from name"
              />
            </div>
            <div className="pb-2">
              <Button
                onClick={() => setFormData({ ...formData, slug: generateSlug(formData.name) })}
                variant="secondary"
                size="sm"
                icon={<Copy className="w-3 h-3" />}
              >
                Regenerate
              </Button>
            </div>
          </div>

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this category"
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{formData.color}</code>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
