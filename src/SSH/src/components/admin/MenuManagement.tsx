import React, { useState, useEffect } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { toast } from 'sonner'
import {
  getMenuItemsFromDB,
  createMenuItemInDB,
  updateMenuItemInDB,
  deleteMenuItemFromDB,
  MenuItemType,
} from '@/lib/api/menus'

interface MenuStats {
  headerItems: number
  footerItems: number
  totalItems: number
  activeItems: number
}

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMenu, setSelectedMenu] = useState<'header' | 'footer'>('header')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null)
  const [stats, setStats] = useState<MenuStats>({
    headerItems: 0,
    footerItems: 0,
    totalItems: 0,
    activeItems: 0,
  })

  const [formData, setFormData] = useState<Partial<MenuItemType>>({
    type: 'custom',
    isActive: true,
    sortOrder: 0,
  })
  const [parentMenuId, setParentMenuId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

  // Load menu items from database
  useEffect(() => {
    loadMenuItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMenu])

  const loadMenuItems = async () => {
    setLoading(true)
    try {
      // Load only items for the selected menu
      const items = await getMenuItemsFromDB(selectedMenu)
      setMenuItems(items)
      // Update stats with the loaded items
      await updateStats()
    } catch (error) {
      console.error('Failed to load menu items:', error)
      toast.error('Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }

  const updateStats = async () => {
    // Get all menu items from database to calculate total stats
    try {
      const headerItems = await getMenuItemsFromDB('header')
      const footerItems = await getMenuItemsFromDB('footer')
      const allItems = [...headerItems, ...footerItems]

      const activeItems = allItems.filter((i) => i.isActive).length
      const totalItems = allItems.length

      setStats({
        headerItems: headerItems.length,
        footerItems: footerItems.length,
        totalItems,
        activeItems,
      })
    } catch (error) {
      console.error('Error updating stats:', error)
    }
  }

  const handleAddItem = () => {
    setEditingItem(null)
    setFormData({
      type: 'custom',
      isActive: true,
      sortOrder: 0,
      metadata: {},
    })
    setParentMenuId(null)
    setShowForm(true)
  }

  const handleEditItem = (item: MenuItemType) => {
    setEditingItem(item)
    setFormData(item)
    setParentMenuId(item.metadata?.parentMenuId || null)
    setShowForm(true)
  }

  const handleDeleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      try {
        const success = await deleteMenuItemFromDB(id)
        if (success) {
          const updated = menuItems.filter((item) => item.id !== id)
          setMenuItems(updated)
          toast.success('Menu item deleted')
          await updateStats()
        } else {
          toast.error('Failed to delete menu item')
        }
      } catch (error) {
        console.error('Error deleting menu item:', error)
        toast.error('Failed to delete menu item')
      }
    }
  }

  const handleToggleActive = async (id: string) => {
    const item = menuItems.find((i) => i.id === id)
    if (!item) return

    try {
      const updated = await updateMenuItemInDB(id, { isActive: !item.isActive })
      if (updated) {
        const newItems = menuItems.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i))
        setMenuItems(newItems)
        toast.success('Menu item updated')
        await updateStats()
      } else {
        toast.error('Failed to update menu item')
      }
    } catch (error) {
      console.error('Error updating menu item:', error)
      toast.error('Failed to update menu item')
    }
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title) {
      toast.error('Please enter a title')
      return
    }

    try {
      const metadata = {
        ...(formData.metadata || {}),
        ...(parentMenuId && { parentMenuId }),
      }

      if (editingItem) {
        // Update existing
        const updated = await updateMenuItemInDB(editingItem.id, {
          ...formData,
          metadata,
        })
        if (updated) {
          const newItems = menuItems.map((item) => (item.id === editingItem.id ? updated : item))
          setMenuItems(newItems)
          toast.success('Menu item updated')
          await updateStats()
        } else {
          toast.error('Failed to update menu item')
        }
      } else {
        // Add new
        const newItem = await createMenuItemInDB({
          title: formData.title || '',
          type: (formData.type || 'custom') as 'page' | 'custom' | 'external',
          url: formData.url || formData.href || '',
          href: formData.url || formData.href || '',
          label: formData.label || formData.title || '',
          icon: formData.icon || '',
          badge: formData.badge || '',
          sortOrder: formData.sortOrder || 0,
          isActive: formData.isActive ?? true,
          openInNewTab: formData.openInNewTab || false,
          description: formData.description || '',
          metadata,
        })

        if (newItem) {
          const newItems = [...menuItems, newItem]
          setMenuItems(newItems)
          toast.success('Menu item created')
          await updateStats()
        } else {
          toast.error('Failed to create menu item')
        }
      }

      setShowForm(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving menu item:', error)
      toast.error('Failed to save menu item')
    }
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverItem(itemId)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = async (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault()
    setDragOverItem(null)

    if (!draggedItem || draggedItem === targetItemId) {
      setDraggedItem(null)
      return
    }

    try {
      const draggedIndex = filteredItems.findIndex((item) => item.id === draggedItem)
      const targetIndex = filteredItems.findIndex((item) => item.id === targetItemId)

      if (draggedIndex === -1 || targetIndex === -1) return

      // Create a new array with reordered items
      const newItems = [...filteredItems]
      const [movedItem] = newItems.splice(draggedIndex, 1)
      newItems.splice(targetIndex, 0, movedItem)

      // Update sort orders
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        sortOrder: index,
      }))

      setMenuItems(
        menuItems.map((item) => {
          const updated = updatedItems.find((u) => u.id === item.id)
          return updated || item
        }),
      )

      // Save all updated items to database
      for (const item of updatedItems) {
        await updateMenuItemInDB(item.id, { sortOrder: item.sortOrder })
      }

      toast.success('Menu items reordered successfully')
    } catch (error) {
      console.error('Error reordering items:', error)
      toast.error('Failed to reorder items')
      loadMenuItems() // Reload on error
    } finally {
      setDraggedItem(null)
    }
  }

  const filteredItems = menuItems.filter((item) => !item.metadata?.parentMenuId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
          <p className="text-gray-600">Loading menu items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Total Items</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalItems}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Active Items</div>
          <div className="mt-2 text-3xl font-bold text-green-600">{stats.activeItems}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Header Items</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">{stats.headerItems}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Footer Items</div>
          <div className="mt-2 text-3xl font-bold text-purple-600">{stats.footerItems}</div>
        </div>
      </div>

      {/* Menu Selector & Add Button */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedMenu('header')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedMenu === 'header'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Header Menu
          </button>
          <button
            onClick={() => setSelectedMenu('footer')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedMenu === 'footer'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Footer Menu
          </button>
        </div>
        <Button
          onClick={handleAddItem}
          className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Item</span>
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
            </div>

            <form onSubmit={handleSaveItem} className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* LEFT COLUMN */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      placeholder="Menu item title"
                    />
                  </div>

                  {/* Link Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link Type
                    </label>
                    <select
                      value={formData.type || 'custom'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as 'page' | 'custom' | 'external',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    >
                      <option value="custom">Custom URL</option>
                      <option value="external">External Link</option>
                      <option value="page">Page Link</option>
                    </select>
                  </div>

                  {/* URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                    <input
                      type="text"
                      value={formData.url || ''}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      placeholder="/about or https://example.com"
                    />
                  </div>

                  {/* Label */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                    <input
                      type="text"
                      value={formData.label || ''}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      placeholder="Display label"
                    />
                  </div>

                  {/* Icon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <input
                      type="text"
                      value={formData.icon || ''}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      placeholder="e.g., Home, Users"
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-4">
                  {/* Parent Menu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Menu (Submenu)
                    </label>
                    <select
                      value={parentMenuId || ''}
                      onChange={(e) => setParentMenuId(e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    >
                      <option value="">None - Top Level</option>
                      {menuItems
                        .filter(
                          (item) => item.id !== editingItem?.id && !item.metadata?.parentMenuId,
                        )
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Badge */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
                    <input
                      type="text"
                      value={formData.badge || ''}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      placeholder="e.g., New, Beta"
                    />
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, sortOrder: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.openInNewTab || false}
                        onChange={(e) =>
                          setFormData({ ...formData, openInNewTab: e.target.checked })
                        }
                        className="rounded border-gray-300 text-orange-500 focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Open in new tab</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive ?? true}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-orange-500 focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      placeholder="Tooltip or description"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
                >
                  {editingItem ? 'Update' : 'Create'} Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No menu items yet. Add your first item!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 w-10"></th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">URL</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => {
                    const isSubmenu = item.metadata?.parentMenuId
                    const parentItem = isSubmenu
                      ? filteredItems.find((i) => i.id === item.metadata?.parentMenuId)
                      : null
                    return (
                      <tr
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, item.id)}
                        className={`transition-colors cursor-move ${
                          draggedItem === item.id ? 'opacity-50 bg-blue-50' : ''
                        } ${
                          dragOverItem === item.id && draggedItem !== item.id
                            ? 'border-t-2 border-orange-400 bg-orange-50'
                            : 'hover:bg-gray-50'
                        } ${isSubmenu ? 'bg-gray-50' : ''}`}
                      >
                        <td className="px-4 py-4 text-center">
                          <EllipsisVerticalIcon className="w-4 h-4 text-gray-400" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {isSubmenu && <span className="text-gray-400 mr-2">↳</span>}
                            {item.title}
                          </div>
                          {item.label && item.label !== item.title && (
                            <div className="text-xs text-gray-600">{item.label}</div>
                          )}
                          {parentItem && (
                            <div className="text-xs text-gray-500">under: {parentItem.title}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 truncate max-w-xs">{item.url}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.sortOrder}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleActive(item.id)}
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              item.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {item.isActive ? (
                              <>
                                <EyeIcon className="w-3 h-3" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <EyeSlashIcon className="w-3 h-3" />
                                <span>Inactive</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-600 hover:text-blue-700 transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-700 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
