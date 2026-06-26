
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, MoveUp, MoveDown, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import {
  AdminLayout,
  Card,
  CardBody,
  Button,
  Modal,
  Input,
  Textarea,
  Badge,
  Spinner,
} from '@/components/admin'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

interface AboutSection {
  id: string
  section: string
  title: string | null
  content: string | null
  image_url: string | null
  order_index: number
  is_active: boolean
  metadata: any
}

export default function AdminAboutContent() {
  const [sections, setSections] = useState<AboutSection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<AboutSection>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .order('order_index', { ascending: true })

      if (error) throw error
      setSections(data || [])
    } catch (err) {
      console.error('Error fetching sections:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (section: AboutSection) => {
    setEditingId(section.id)
    setEditForm(section)
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({})
    setIsModalOpen(false)
  }

  const handleSave = async () => {
    if (!editingId) return

    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('about_content')
        .update({
          title: editForm.title,
          content: editForm.content,
          image_url: editForm.image_url,
          is_active: editForm.is_active,
        })
        .eq('id', editingId)

      if (error) throw error

      await fetchSections()
      handleCancel()
    } catch (err: any) {
      alert('Error saving: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return

    try {
      const { error } = await supabase.from('about_content').delete().eq('id', id)

      if (error) throw error
      await fetchSections()
    } catch (err: any) {
      alert('Error deleting: ' + err.message)
    }
  }

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex((s) => s.id === id)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= sections.length) return

    const current = sections[currentIndex]
    const target = sections[targetIndex]

    try {
      await Promise.all([
        supabase
          .from('about_content')
          .update({ order_index: target.order_index })
          .eq('id', current.id),
        supabase
          .from('about_content')
          .update({ order_index: current.order_index })
          .eq('id', target.id),
      ])

      await fetchSections()
    } catch (err: any) {
      alert('Error reordering: ' + err.message)
    }
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('about_content')
        .update({ is_active: !currentActive })
        .eq('id', id)

      if (error) throw error
      await fetchSections()
    } catch (err: any) {
      alert('Error toggling: ' + err.message)
    }
  }

  if (loading) {
    return (
      <AdminLayout
        title="About Page Content"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'About Content' }]}
      >
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="About Page Content"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'About Content' },
      ]}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-gray-600">Manage sections displayed on the About page</p>
        </div>
        <Button
          onClick={() => {
            setEditForm({ is_active: true })
            setEditingId(null)
            setIsModalOpen(true)
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Section
        </Button>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-gray-500">No sections found. Create one to get started.</p>
            </CardBody>
          </Card>
        ) : (
          sections.map((section, index) => (
            <Card
              key={section.id}
              variant={section.is_active ? 'default' : 'outlined'}
              className={section.is_active ? '' : 'opacity-60'}
            >
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="primary">{section.section}</Badge>
                      {!section.is_active && (
                        <Badge variant="secondary">Hidden</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {section.title || '(No title)'}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {section.content || '(No content)'}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    {/* Visibility Toggle */}
                    <button
                      onClick={() => toggleActive(section.id, section.is_active)}
                      className="p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      title={section.is_active ? 'Hide section' : 'Show section'}
                    >
                      {section.is_active ? (
                        <Eye className="w-4 h-4 text-gray-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {/* Move Up */}
                    <button
                      onClick={() => handleReorder(section.id, 'up')}
                      disabled={index === 0}
                      className="p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
                    >
                      <MoveUp className="w-4 h-4 text-gray-600" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleReorder(section.id, 'down')}
                      disabled={index === sections.length - 1}
                      className="p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
                    >
                      <MoveDown className="w-4 h-4 text-gray-600" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleEdit(section)}
                      className="p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(section.id)}
                      className="p-2 rounded-lg border border-red-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {section.image_url && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <img
                      src={section.image_url}
                      alt={section.title || ''}
                      className="max-w-sm h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title={editingId ? 'Edit Section' : 'Add New Section'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Section Type"
            value={editForm.section || ''}
            onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
            placeholder="e.g., mission, vision, history"
            required
            disabled={!!editingId}
          />

          <Input
            label="Title"
            value={editForm.title || ''}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            placeholder="Section title"
            required
          />

          <Textarea
            label="Content"
            value={editForm.content || ''}
            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
            placeholder="Section content"
            rows={6}
            required
          />

          <Input
            label="Image URL (Optional)"
            type="url"
            value={editForm.image_url || ''}
            onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
            placeholder="https://..."
          />

          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={handleCancel}
              variant="secondary"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving}
            >
              {editingId ? 'Update Section' : 'Create Section'}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
