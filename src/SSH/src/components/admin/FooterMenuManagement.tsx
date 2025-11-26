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
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { toast } from 'sonner'
import {
  getMenuItemsFromDB,
  createMenuItemInDB,
  updateMenuItemInDB,
  deleteMenuItemFromDB,
  MenuItemType,
} from '@/lib/api/menus'
import * as LucideIcons from 'lucide-react'

interface FooterStats {
  totalItems: number
  activeItems: number
  sections: number
}

// Available Lucide icons for menu items
const AVAILABLE_ICONS = [
  { name: 'None', value: '' },
  { name: 'Home', value: 'Home' },
  { name: 'GraduationCap', value: 'GraduationCap' },
  { name: 'BookOpen', value: 'BookOpen' },
  { name: 'Users', value: 'Users' },
  { name: 'User', value: 'User' },
  { name: 'Mail', value: 'Mail' },
  { name: 'Phone', value: 'Phone' },
  { name: 'MapPin', value: 'MapPin' },
  { name: 'Calendar', value: 'Calendar' },
  { name: 'Clock', value: 'Clock' },
  { name: 'FileText', value: 'FileText' },
  { name: 'Image', value: 'Image' },
  { name: 'Video', value: 'Video' },
  { name: 'Music', value: 'Music' },
  { name: 'Download', value: 'Download' },
  { name: 'Upload', value: 'Upload' },
  { name: 'Settings', value: 'Settings' },
  { name: 'HelpCircle', value: 'HelpCircle' },
  { name: 'Info', value: 'Info' },
  { name: 'AlertCircle', value: 'AlertCircle' },
  { name: 'CheckCircle', value: 'CheckCircle' },
  { name: 'XCircle', value: 'XCircle' },
  { name: 'Star', value: 'Star' },
  { name: 'Heart', value: 'Heart' },
  { name: 'Award', value: 'Award' },
  { name: 'Trophy', value: 'Trophy' },
  { name: 'Target', value: 'Target' },
  { name: 'Zap', value: 'Zap' },
  { name: 'TrendingUp', value: 'TrendingUp' },
  { name: 'BarChart', value: 'BarChart' },
  { name: 'PieChart', value: 'PieChart' },
  { name: 'Activity', value: 'Activity' },
  { name: 'Globe', value: 'Globe' },
  { name: 'Compass', value: 'Compass' },
  { name: 'Navigation', value: 'Navigation' },
  { name: 'Send', value: 'Send' },
  { name: 'MessageCircle', value: 'MessageCircle' },
  { name: 'MessageSquare', value: 'MessageSquare' },
  { name: 'Briefcase', value: 'Briefcase' },
  { name: 'Package', value: 'Package' },
  { name: 'ShoppingCart', value: 'ShoppingCart' },
  { name: 'CreditCard', value: 'CreditCard' },
  { name: 'DollarSign', value: 'DollarSign' },
  { name: 'Gift', value: 'Gift' },
  { name: 'Tag', value: 'Tag' },
  { name: 'Bookmark', value: 'Bookmark' },
  { name: 'Archive', value: 'Archive' },
  { name: 'Folder', value: 'Folder' },
  { name: 'FolderOpen', value: 'FolderOpen' },
  { name: 'Shield', value: 'Shield' },
  { name: 'Lock', value: 'Lock' },
  { name: 'Unlock', value: 'Unlock' },
  { name: 'Key', value: 'Key' },
  { name: 'Eye', value: 'Eye' },
  { name: 'EyeOff', value: 'EyeOff' },
]

export default function FooterMenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null)
  const [stats, setStats] = useState<FooterStats>({
    totalItems: 0,
    activeItems: 0,
    sections: 0,
  })

  const [formData, setFormData] = useState<Partial<MenuItemType>>({
    type: 'custom',
    isActive: true,
    sortOrder: 0,
  })
  const [parentMenuId, setParentMenuId] = useState<string | null>(null)
  const [sectionName, setSectionName] = useState<string>('')
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    itemId: string | null
    itemTitle: string
    isDeleting: boolean
  }>({
    isOpen: false,
    itemId: null,
    itemTitle: '',
    isDeleting: false,
  })

  // Load menu items from database
  useEffect(() => {
    loadMenuItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMenuItems = async () => {
    setLoading(true)
    try {
      // Load both footer (parent) and footer-child items
      const parentItems = await getMenuItemsFromDB('footer')
      const childItems = await getMenuItemsFromDB('footer-child')
      const allItems = [...parentItems, ...childItems]

      // Check for items that have parentMenuId but wrong menu field
      const itemsNeedingFix = allItems.filter(
        (item) => item.metadata?.parentMenuId && item.menu === 'footer',
      )

      if (itemsNeedingFix.length > 0) {
        for (const item of itemsNeedingFix) {
          await updateMenuItemInDB(item.id, {
            metadata: {
              ...item.metadata,
              menu: 'footer-child',
            },
          })
        }
        // Reload after fixing
        const parentItemsFixed = await getMenuItemsFromDB('footer')
        const childItemsFixed = await getMenuItemsFromDB('footer-child')
        const allItemsFixed = [...parentItemsFixed, ...childItemsFixed]
        setMenuItems(allItemsFixed)
        await updateStats(allItemsFixed)
        toast.success(`Fixed ${itemsNeedingFix.length} items with incorrect menu type`)
        return
      }

      setMenuItems(allItems)
      // Update stats
      await updateStats(allItems)
    } catch (error) {
      console.error('[FooterMenu] Failed to load menu items:', error)
      toast.error('Failed to load footer menu items')
    } finally {
      setLoading(false)
    }
  }

  const updateStats = async (items: MenuItemType[]) => {
    try {
      const activeItems = items.filter((i) => i.isActive).length

      // Count unique sections
      const sections = new Set<string>()
      items.forEach((item) => {
        if (!item.metadata?.parentMenuId) {
          const section = item.metadata?.section
          if (section) {
            sections.add(section)
          }
        }
      })

      setStats({
        totalItems: items.length,
        activeItems,
        sections: sections.size,
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
    setSectionName('')
    setShowForm(true)
  }

  const handleEditItem = (item: MenuItemType) => {
    setEditingItem(item)
    setFormData(item)
    setParentMenuId(item.metadata?.parentMenuId || null)
    setSectionName(item.metadata?.section || '')
    setShowForm(true)
  }

  const handleDeleteItem = (id: string) => {
    const item = menuItems.find((i) => i.id === id)
    const itemTitle = item?.title || 'this item'

    setDeleteConfirm({
      isOpen: true,
      itemId: id,
      itemTitle,
      isDeleting: false,
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.itemId) return

    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }))

    try {
      const success = await deleteMenuItemFromDB(deleteConfirm.itemId)
      if (success) {
        const updated = menuItems.filter((item) => item.id !== deleteConfirm.itemId)
        setMenuItems(updated)
        toast.success(`"${deleteConfirm.itemTitle}" deleted successfully`)
        await updateStats(updated)
      } else {
        toast.error('Failed to delete menu item')
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
      toast.error('Failed to delete menu item')
    } finally {
      setDeleteConfirm({
        isOpen: false,
        itemId: null,
        itemTitle: '',
        isDeleting: false,
      })
    }
  }

  const handleToggleActive = async (id: string) => {
    const item = menuItems.find((i) => i.id === id)
    if (!item) return

    const loadingToast = toast.loading(
      item.isActive ? 'Deactivating menu item...' : 'Activating menu item...',
    )
    try {
      const updated = await updateMenuItemInDB(id, { isActive: !item.isActive })
      toast.dismiss(loadingToast)
      if (updated) {
        const newItems = menuItems.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i))
        setMenuItems(newItems)
        toast.success(
          `"${item.title}" ${!item.isActive ? 'activated' : 'deactivated'} successfully`,
        )
        await updateStats(newItems)
      } else {
        toast.error('Failed to update menu item')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
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
      // Determine if this is a child item based on parentMenuId
      const isChild = !!parentMenuId
      const menuType = isChild ? 'footer-child' : 'footer'

      const metadata = {
        ...(formData.metadata || {}),
        ...(parentMenuId && { parentMenuId }),
        ...(sectionName && { section: sectionName }),
        menu: menuType,
      }

      const loadingToast = toast.loading(
        editingItem ? 'Updating menu item...' : 'Creating menu item...',
      )

      if (editingItem) {
        // Update existing
        const updated = await updateMenuItemInDB(editingItem.id, {
          ...formData,
          metadata,
        })
        toast.dismiss(loadingToast)
        if (updated) {
          await loadMenuItems() // Reload to get updated hierarchy
          toast.success(`"${formData.title}" updated successfully`)
        } else {
          toast.error('Failed to update menu item')
        }
      } else {
        // Add new - set menu type based on parent
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
          metadata: { ...metadata, menuType },
        })

        toast.dismiss(loadingToast)
        if (newItem) {
          await loadMenuItems() // Reload to get updated hierarchy
          toast.success(`"${formData.title}" created successfully`)
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
      const draggedItemData = menuItems.find((item) => item.id === draggedItem)
      const targetItemData = menuItems.find((item) => item.id === targetItemId)

      if (!draggedItemData || !targetItemData) return

      // Check if target is a parent item (menu = 'footer')
      const targetIsParent =
        targetItemData.menu === 'footer' || !targetItemData.metadata?.parentMenuId

      if (targetIsParent && e.shiftKey) {
        // Shift + Drop = Make dragged item a child of target
        const updated = await updateMenuItemInDB(draggedItem, {
          metadata: {
            ...draggedItemData.metadata,
            parentMenuId: targetItemId,
            menu: 'footer-child',
          },
        })

        if (updated) {
          toast.success(`"${draggedItemData.title}" moved under "${targetItemData.title}"`)
          await loadMenuItems()
        } else {
          toast.error('Failed to update menu item')
        }
      } else {
        // Normal drop = Reorder items
        // Rebuild filteredItems from current menuItems state
        const currentParentItems = menuItems.filter(
          (item) => item.menu === 'footer' || !item.metadata?.parentMenuId,
        )
        const currentChildItems = menuItems.filter(
          (item) => item.menu === 'footer-child' && item.metadata?.parentMenuId,
        )

        const currentFilteredItems: MenuItemType[] = []
        const currentParentIds = new Set(currentParentItems.map((p) => p.id))

        currentParentItems
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .forEach((parent) => {
            currentFilteredItems.push(parent)
            const children = currentChildItems
              .filter((child) => child.metadata?.parentMenuId === parent.id)
              .sort((a, b) => a.sortOrder - b.sortOrder)
            currentFilteredItems.push(...children)
          })

        // Add orphaned children
        const currentOrphaned = currentChildItems.filter(
          (child) => !currentParentIds.has(child.metadata?.parentMenuId),
        )
        if (currentOrphaned.length > 0) {
          currentFilteredItems.push(...currentOrphaned.sort((a, b) => a.sortOrder - b.sortOrder))
        }

        const draggedIndex = currentFilteredItems.findIndex((item) => item.id === draggedItem)
        const targetIndex = currentFilteredItems.findIndex((item) => item.id === targetItemId)

        if (draggedIndex === -1 || targetIndex === -1) {
          return
        }

        const newItems = [...currentFilteredItems]
        const [movedItem] = newItems.splice(draggedIndex, 1)
        newItems.splice(targetIndex, 0, movedItem)

        const updatedItems = newItems.map((item, index) => ({
          ...item,
          sortOrder: index,
        }))

        // Update local state optimistically
        setMenuItems(
          menuItems.map((item) => {
            const updated = updatedItems.find((u) => u.id === item.id)
            return updated || item
          }),
        )

        // Save to database
        for (const item of updatedItems) {
          await updateMenuItemInDB(item.id, { sortOrder: item.sortOrder })
        }

        toast.success('Menu items reordered successfully')
      }
    } catch (error) {
      console.error('Error handling drop:', error)
      toast.error('Failed to update menu items')
      loadMenuItems()
    } finally {
      setDraggedItem(null)
    }
  }

  // Build hierarchical structure: parents first, then their children
  const parentItems = menuItems.filter(
    (item) => item.menu === 'footer' || !item.metadata?.parentMenuId,
  )
  const childItems = menuItems.filter(
    (item) => item.menu === 'footer-child' && item.metadata?.parentMenuId,
  )

  const filteredItems: MenuItemType[] = []
  const parentIds = new Set(parentItems.map((p) => p.id))

  parentItems
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach((parent) => {
      filteredItems.push(parent)
      // Add children of this parent
      const children = childItems
        .filter((child) => child.metadata?.parentMenuId === parent.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      filteredItems.push(...children)
    })

  // Check for orphaned children (children whose parent doesn't exist)
  const orphanedChildren = childItems.filter(
    (child) => !parentIds.has(child.metadata?.parentMenuId),
  )

  // Add orphaned children at the end so they're still visible and can be fixed
  if (orphanedChildren.length > 0) {
    filteredItems.push(...orphanedChildren.sort((a, b) => a.sortOrder - b.sortOrder))
  }

  // Get unique sections
  const sections = new Set<string>()
  menuItems.forEach((item) => {
    if (item.metadata?.section) {
      sections.add(item.metadata.section)
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
          </div>
          <p className="text-gray-600">Loading footer menu items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards and Add Button */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-3">
          <div className="text-xs font-medium text-purple-700">Total Items</div>
          <div className="mt-1 text-lg font-bold text-purple-900">{stats.totalItems}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-3">
          <div className="text-xs font-medium text-purple-700">Active Items</div>
          <div className="mt-1 text-lg font-bold text-purple-900">{stats.activeItems}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-3">
          <div className="text-xs font-medium text-purple-700">Sections</div>
          <div className="mt-1 text-lg font-bold text-purple-900">{stats.sections}</div>
        </div>
        <Button
          onClick={handleAddItem}
          className="flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium cursor-pointer col-span-1"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add</span>
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit Footer Menu Item' : 'Add Footer Menu Item'}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="Display label"
                    />
                  </div>

                  {/* Icon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={formData.icon || ''}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      >
                        {AVAILABLE_ICONS.map((icon) => (
                          <option key={icon.value} value={icon.value}>
                            {icon.name}
                          </option>
                        ))}
                      </select>
                      {formData.icon &&
                        (() => {
                          const IconComponent = LucideIcons[
                            formData.icon as keyof typeof LucideIcons
                          ] as React.ComponentType<{ className?: string }>
                          return IconComponent ? (
                            <div className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg bg-gray-50">
                              <IconComponent className="w-5 h-5 text-gray-600" />
                            </div>
                          ) : null
                        })()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Select an icon from the dropdown</p>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-4">
                  {/* Section Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section (Optional)
                    </label>
                    <select
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">-- Default Section --</option>
                      {Array.from(sections).map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Parent Menu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Menu (Make this a child item)
                    </label>
                    <select
                      value={parentMenuId || ''}
                      onChange={(e) => setParentMenuId(e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">None - Top Level Item</option>
                      {menuItems
                        .filter(
                          (item) =>
                            item.id !== editingItem?.id &&
                            (item.menu === 'footer' || !item.metadata?.parentMenuId),
                        )
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Or use Shift+Drag to nest items in the table
                    </p>
                  </div>

                  {/* Badge */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
                    <input
                      type="text"
                      value={formData.badge || ''}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                        className="rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Open in new tab</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive !== false}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded border-gray-300"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="Optional tooltip or description"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingItem(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium cursor-pointer"
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
            <p className="text-gray-600">No footer menu items yet. Add your first item!</p>
          </div>
        ) : (
          <div>
            {/* Instructions Banner */}
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Drag items to reorder. Hold{' '}
                <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">
                  Shift
                </kbd>{' '}
                while dropping to make an item a child of another.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 w-10"></th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">URL</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Order
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map((item) => {
                    const isChild = item.menu === 'footer-child' && item.metadata?.parentMenuId
                    return (
                      <tr
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, item.id)}
                        className={`transition-colors cursor-move ${
                          isChild ? 'bg-gray-50' : ''
                        } ${draggedItem === item.id ? 'opacity-50 bg-purple-50' : ''} ${
                          dragOverItem === item.id && draggedItem !== item.id
                            ? 'border-t-2 border-purple-400 bg-purple-50'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <td className="px-4 py-4 text-center">
                          <EllipsisVerticalIcon className="w-4 h-4 text-gray-400" />
                        </td>
                        <td className={`px-6 py-4 ${isChild ? 'pl-12' : ''}`}>
                          <div className="flex items-center gap-2">
                            {isChild && <span className="text-gray-400">↳</span>}
                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          </div>
                          {item.label && item.label !== item.title && (
                            <div className="text-xs text-gray-600">{item.label}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {item.metadata?.section || 'Default'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {item.type
                              .split(' ')
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                              )
                              .join(' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 truncate max-w-xs">{item.url}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.sortOrder}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleActive(item.id)}
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
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
                              className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-700 transition-colors cursor-pointer"
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
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${deleteConfirm.itemTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteConfirm({
            isOpen: false,
            itemId: null,
            itemTitle: '',
            isDeleting: false,
          })
        }
        variant="danger"
        loading={deleteConfirm.isDeleting}
      />
    </div>
  )
}
