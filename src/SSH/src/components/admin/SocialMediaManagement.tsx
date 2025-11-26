import React, { useState, useEffect } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { toast } from 'sonner'
import {
  getSocialMediaLinksFromDB,
  createSocialMediaLinkInDB,
  updateSocialMediaLinkInDB,
  deleteSocialMediaLinkFromDB,
  updateSocialMediaLinksSortOrder,
  toggleSocialMediaLinkStatus,
  getSocialMediaStats,
  SocialMediaLink,
  SocialMediaStats,
} from '@/lib/api/socialMedia'

const PLATFORM_OPTIONS = [
  { label: 'Facebook', value: 'facebook' },
  { label: 'Twitter/X', value: 'twitter' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'TikTok', value: 'tiktok' },
]

interface DeleteConfirmState {
  isOpen: boolean
  linkId: string | null
  platform: string | null
  isDeleting: boolean
}

type FormData = Omit<SocialMediaLink, 'id' | 'created_at' | 'updated_at'>

export default function SocialMediaManagement() {
  const [links, setLinks] = useState<SocialMediaLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLink, setEditingLink] = useState<SocialMediaLink | null>(null)
  const [stats, setStats] = useState<SocialMediaStats>({ total: 0, active: 0 })
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    isOpen: false,
    linkId: null,
    platform: null,
    isDeleting: false,
  })

  const [formData, setFormData] = useState<FormData>({
    platform: 'facebook',
    url: '',
    is_active: true,
    sort_order: 0,
  })

  // Load social media links
  useEffect(() => {
    loadLinks()
  }, [])

  const loadLinks = async () => {
    setLoading(true)
    try {
      const socialLinks = await getSocialMediaLinksFromDB()
      setLinks(socialLinks)
      const socialStats = await getSocialMediaStats()
      setStats(socialStats)
    } catch (error) {
      console.error('Failed to load social media links:', error)
      toast.error('Failed to load social media links')
    } finally {
      setLoading(false)
    }
  }

  const handleAddLink = () => {
    setEditingLink(null)
    setFormData({
      platform: 'facebook',
      url: '',
      is_active: true,
      sort_order: links.length,
    })
    setShowForm(true)
  }

  const handleEditLink = (link: SocialMediaLink) => {
    setEditingLink(link)
    setFormData({
      platform: link.platform,
      url: link.url,
      is_active: link.is_active,
      sort_order: link.sort_order,
    })
    setShowForm(true)
  }

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
      toast.error('URL must start with http:// or https://')
      return
    }

    try {
      if (editingLink) {
        // Update existing link
        await updateSocialMediaLinkInDB(editingLink.id, {
          platform: formData.platform,
          url: formData.url,
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        })
        toast.success('Social media link updated successfully')
      } else {
        // Create new link
        await createSocialMediaLinkInDB({
          platform: formData.platform,
          url: formData.url,
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        })
        toast.success('Social media link created successfully')
      }

      setShowForm(false)
      await loadLinks()
    } catch (error) {
      console.error('Error saving link:', error)
      toast.error('Failed to save link')
    }
  }

  const handleDeleteItem = (link: SocialMediaLink) => {
    setDeleteConfirm({
      isOpen: true,
      linkId: link.id,
      platform: link.platform,
      isDeleting: false,
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.linkId) return

    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }))
    try {
      await deleteSocialMediaLinkFromDB(deleteConfirm.linkId)
      toast.success('Social media link deleted successfully')
      setDeleteConfirm({ isOpen: false, linkId: null, platform: null, isDeleting: false })
      await loadLinks()
    } catch (error) {
      console.error('Error deleting link:', error)
      toast.error('Failed to delete link')
      setDeleteConfirm({ isOpen: false, linkId: null, platform: null, isDeleting: false })
    }
  }

  const handleToggleStatus = async (link: SocialMediaLink) => {
    try {
      await toggleSocialMediaLinkStatus(link.id, !link.is_active)
      await loadLinks()
      const status = !link.is_active ? 'activated' : 'deactivated'
      toast.success(`Link ${status}`)
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Failed to update link status')
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return

    const linkId = links[index].id
    setReorderingId(linkId)

    const newLinks = [...links]
    // Swap the two items
    const temp = newLinks[index - 1]
    newLinks[index - 1] = newLinks[index]
    newLinks[index] = temp

    // Update sort_order for all items based on their new position
    const updatedLinks = newLinks.map((link, i) => ({
      ...link,
      sort_order: i,
    }))

    try {
      // Update database with new sort orders
      await updateSocialMediaLinksSortOrder(
        updatedLinks.map((link) => ({
          id: link.id,
          sort_order: link.sort_order,
        })),
      )
      setLinks(updatedLinks)
      toast.success('Link moved up')
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    } finally {
      setReorderingId(null)
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index === links.length - 1) return

    const linkId = links[index].id
    setReorderingId(linkId)

    const newLinks = [...links]
    // Swap the two items
    const temp = newLinks[index]
    newLinks[index] = newLinks[index + 1]
    newLinks[index + 1] = temp

    // Update sort_order for all items based on their new position
    const updatedLinks = newLinks.map((link, i) => ({
      ...link,
      sort_order: i,
    }))

    try {
      // Update database with new sort orders
      await updateSocialMediaLinksSortOrder(
        updatedLinks.map((link) => ({
          id: link.id,
          sort_order: link.sort_order,
        })),
      )
      setLinks(updatedLinks)
      toast.success('Link moved down')
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    } finally {
      setReorderingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
            <div className="w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
          </div>
          <p className="text-gray-600">Loading social media links...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards and Add Button */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200 p-3">
          <div className="text-xs font-medium text-red-700">Total Links</div>
          <div className="mt-1 text-lg font-bold text-red-900">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200 p-3">
          <div className="text-xs font-medium text-red-700">Active Links</div>
          <div className="mt-1 text-lg font-bold text-red-900">{stats.active}</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200 p-3">
          <div className="text-xs font-medium text-red-700">Inactive</div>
          <div className="mt-1 text-lg font-bold text-red-900">{stats.total - stats.active}</div>
        </div>
        <Button
          onClick={handleAddLink}
          className="flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium cursor-pointer col-span-1"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add</span>
        </Button>
      </div>

      {/* Social Media Links List */}
      <div className="space-y-3">
        {links.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-gray-600">No social media links yet. Add one to get started.</p>
          </div>
        ) : (
          links.map((link, index) => (
            <div
              key={link.id}
              draggable
              onDragStart={() => setDraggedItem(link.id)}
              onDragOver={() => setDragOverItem(link.id)}
              onDragEnd={() => {
                setDraggedItem(null)
                setDragOverItem(null)
              }}
              className={`bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between transition-opacity ${
                draggedItem === link.id ? 'opacity-50' : ''
              } ${dragOverItem === link.id ? 'border-blue-500 bg-blue-50' : ''}`}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 capitalize">{link.platform}</h4>
                    <p className="text-sm text-gray-600 truncate">{link.url}</p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      link.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {link.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleToggleStatus(link)}
                  title={link.is_active ? 'Deactivate' : 'Activate'}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                >
                  {link.is_active ? (
                    <EyeIcon className="w-5 h-5" />
                  ) : (
                    <EyeSlashIcon className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0 || reorderingId !== null}
                  title="Move up"
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reorderingId === link.id ? (
                    <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <ArrowUpIcon className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === links.length - 1 || reorderingId !== null}
                  title="Move down"
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reorderingId === link.id ? (
                    <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <ArrowDownIcon className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => handleEditLink(link)}
                  title="Edit"
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleDeleteItem(link)}
                  title="Delete"
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingLink ? 'Edit Social Media Link' : 'Add Social Media Link'}
              </h2>
            </div>

            <form onSubmit={handleSaveLink} className="p-6 space-y-4">
              {/* Platform */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform *</label>
                <select
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      platform: e.target.value as SocialMediaLink['platform'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {PLATFORM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  {editingLink ? 'Update Link' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Social Media Link"
        message={`Are you sure you want to delete this ${deleteConfirm.platform} link? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteConfirm.isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteConfirm({ isOpen: false, linkId: null, platform: null, isDeleting: false })
        }
      />
    </div>
  )
}
