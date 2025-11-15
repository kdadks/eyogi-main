import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  getComplianceItems,
  getComplianceSubmissions,
  getComplianceAdminStats,
  createComplianceItem,
  updateComplianceItem,
  deleteComplianceItem,
  reviewComplianceSubmission,
} from '../../lib/api/compliance'
import type {
  ComplianceItem,
  ComplianceItemType,
  ComplianceSubmission,
  ComplianceAdminStats,
} from '../../types/compliance'

type TabType = 'overview' | 'items' | 'submissions' | 'forms'

export default function ComplianceManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ComplianceAdminStats | null>(null)
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [submissions, setSubmissions] = useState<ComplianceSubmission[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')
  const [itemsPage, setItemsPage] = useState(1)
  const itemsPerPage = 15
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_role: 'teacher' as 'teacher' | 'parent' | 'student',
    type: 'form_submission' as 'form_submission' | 'verification' | 'document_upload',
    has_form: false,
    is_mandatory: false,
    due_date: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load each separately to isolate errors
      const statsData = await getComplianceAdminStats()
      setStats(statsData)

      const itemsData = await getComplianceItems()
      setItems(itemsData)

      const submissionsData = await getComplianceSubmissions({})
      setSubmissions(submissionsData)
    } catch (error) {
      console.error('❌ Error loading compliance data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      toast.error('Failed to load compliance data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    setModalMode('add')
    setSelectedItem(null)
    setFormData({
      title: '',
      description: '',
      target_role: 'teacher',
      type: 'form_submission',
      has_form: false,
      is_mandatory: false,
      due_date: '',
    })
    setShowItemModal(true)
  }

  const handleViewItem = (item: ComplianceItem) => {
    setModalMode('view')
    setSelectedItem(item)
    setShowItemModal(true)
  }

  const handleEditItem = (item: ComplianceItem) => {
    setModalMode('edit')
    setSelectedItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      target_role: item.target_role,
      type:
        (item.type as 'form_submission' | 'verification' | 'document_upload') || 'form_submission',
      has_form: item.has_form || false,
      is_mandatory: item.is_mandatory,
      due_date: item.due_date || '',
    })
    setShowItemModal(true)
  }

  const handleDeleteClick = (item: ComplianceItem) => {
    setSelectedItem(item)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return

    try {
      await deleteComplianceItem(selectedItem.id)
      toast.success(`Successfully deleted "${selectedItem.title}"`)
      setShowDeleteModal(false)
      setSelectedItem(null)
      // Reload data
      await loadData()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
  }

  const handleFormSubmit = async () => {
    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Description is required')
      return
    }

    try {
      if (modalMode === 'add') {
        // Let's copy an existing item structure exactly and only change what we need
        if (items.length > 0) {
          console.log('✅ Copying structure from existing item:', items[0])
        }

        // Only include actual database columns, not relations like 'form'
        // Use exact values from existing items to ensure constraint compatibility
        const existingItem = items.length > 0 ? items[0] : null
        console.log('🔍 Using exact field values from existing item:', {
          type: existingItem?.type,
          target_role: existingItem?.target_role,
          created_by: existingItem?.created_by,
        })

        const itemData = {
          title: formData.title,
          description: formData.description,
          target_role: existingItem ? existingItem.target_role : formData.target_role, // Use exact target_role from existing
          type: (existingItem ? existingItem.type : formData.type) as ComplianceItemType, // Use exact type from existing or form
          has_form: formData.has_form,
          is_mandatory: formData.is_mandatory,
          due_date: formData.due_date || undefined,
          form_id: undefined,
          is_active: true,
          created_by: existingItem
            ? existingItem.created_by
            : '00000000-0000-0000-0000-000000000000',
        }

        console.log('Creating compliance item with data:', itemData)

        const result = await createComplianceItem(itemData)

        console.log('Create result:', result)
        toast.success('Compliance item created successfully')
      } else if (modalMode === 'edit' && selectedItem) {
        await updateComplianceItem(selectedItem.id, {
          title: formData.title,
          description: formData.description,
          target_role: formData.target_role,
          type: formData.type,
          has_form: formData.has_form,
          is_mandatory: formData.is_mandatory,
          due_date: formData.due_date || undefined,
        })
        toast.success('Compliance item updated successfully')
      }

      setShowItemModal(false)
      setSelectedItem(null)
      await loadData()
    } catch (error) {
      console.error('Error saving item:', error)

      // Get more detailed error message
      let errorMessage = `Failed to ${modalMode === 'add' ? 'create' : 'update'} item`
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage += `: ${error.message}`
        }
        if ('details' in error) {
          console.error('Error details:', error.details)
        }
        if ('hint' in error) {
          console.error('Error hint:', error.hint)
        }
      }

      toast.error(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded shadow p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center text-gray-600 mt-3 text-sm">Loading compliance data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-medium text-sm">Error loading data</h3>
              <p className="text-red-700 text-xs mt-1">{error}</p>
              <Button
                onClick={loadData}
                variant="outline"
                className="mt-2 h-7 px-2 text-xs"
                size="sm"
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="mb-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded max-w-md">
          {[
            { key: 'overview', label: 'Overview', icon: ChartBarIcon },
            { key: 'items', label: 'Items', icon: DocumentTextIcon },
            { key: 'submissions', label: 'Submissions', icon: UserGroupIcon },
            { key: 'forms', label: 'Forms', icon: PencilIcon },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Total items</p>
                      <p className="text-xl font-bold text-gray-900">{stats?.total_items || 0}</p>
                    </div>
                    <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Total submissions</p>
                      <p className="text-xl font-bold text-gray-900">
                        {stats?.total_submissions || 0}
                      </p>
                    </div>
                    <UserGroupIcon className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Pending reviews</p>
                      <p className="text-xl font-bold text-gray-900">
                        {stats?.pending_reviews || 0}
                      </p>
                    </div>
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Approved</p>
                      <p className="text-xl font-bold text-gray-900">
                        {stats?.approved_submissions || 0}
                      </p>
                    </div>
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-semibold text-gray-900">Recent submissions</h3>
              </CardHeader>
              <CardContent className="pt-2">
                {submissions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-xs">No submissions yet</p>
                ) : (
                  <div className="space-y-2">
                    {submissions.slice(0, 5).map((submission) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0">
                            <UserGroupIcon className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">
                              {submission.user?.full_name || 'Unknown user'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {submission.compliance_item?.title || 'Unknown item'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            submission.status === 'approved'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : submission.status === 'rejected'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}
                        >
                          {submission.status?.charAt(0).toUpperCase() +
                            submission.status?.slice(1).toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'items' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <Button className="h-7 px-3 text-xs rounded" onClick={handleAddItem}>
                <PlusIcon className="h-3 w-3 mr-1" />
                Add item
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                {items.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-xs">
                    No compliance items found
                  </p>
                ) : (
                  <div className="space-y-3">
                    {items
                      .slice((itemsPage - 1) * itemsPerPage, itemsPage * itemsPerPage)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200 font-medium">
                                {item.target_role?.charAt(0).toUpperCase() +
                                  item.target_role?.slice(1).toLowerCase() || 'Unknown'}
                              </span>
                              {item.is_mandatory && (
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded border border-red-200 font-medium">
                                  Mandatory
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                            {item.due_date && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Due: {new Date(item.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <button
                              className="h-7 w-7 p-0 rounded border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                              onClick={() => handleViewItem(item)}
                              title="View"
                            >
                              <EyeIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="h-7 w-7 p-0 rounded border border-gray-300 bg-white text-gray-700 hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1"
                              onClick={() => handleEditItem(item)}
                              title="Edit"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="h-7 w-7 p-0 rounded border border-gray-300 bg-white text-gray-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                              onClick={() => handleDeleteClick(item)}
                              title="Delete"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    {items.length > itemsPerPage && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-xs text-gray-600">
                          Showing {(itemsPage - 1) * itemsPerPage + 1} to{' '}
                          {Math.min(itemsPage * itemsPerPage, items.length)} of {items.length}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setItemsPage(Math.max(1, itemsPage - 1))}
                            disabled={itemsPage === 1}
                          >
                            ← Prev
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setItemsPage(
                                Math.min(Math.ceil(items.length / itemsPerPage), itemsPage + 1),
                              )
                            }
                            disabled={itemsPage === Math.ceil(items.length / itemsPerPage)}
                          >
                            Next →
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'submissions' && (
          <SubmissionsTab submissions={submissions} onReview={loadData} />
        )}

        {activeTab === 'forms' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardContent className="p-4">
                <p className="text-gray-500 text-center py-4 text-xs">
                  Forms management coming soon
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete compliance item</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete "<strong>{selectedItem.title}</strong>"? This
                  action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    className="h-8 px-3 text-xs rounded"
                    onClick={() => {
                      setShowDeleteModal(false)
                      setSelectedItem(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-8 px-3 text-xs rounded bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteConfirm}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Item Modal (Add/Edit/View) */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === 'add'
                  ? 'Add compliance item'
                  : modalMode === 'edit'
                    ? 'Edit compliance item'
                    : 'View compliance item'}
              </h3>
              <button
                onClick={() => {
                  setShowItemModal(false)
                  setSelectedItem(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {modalMode === 'view' && selectedItem ? (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-semibold text-gray-900 text-base">{selectedItem.title}</h4>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200 font-medium">
                        {selectedItem.target_role?.charAt(0).toUpperCase() +
                          selectedItem.target_role?.slice(1).toLowerCase()}
                      </span>
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded border border-gray-200 font-medium">
                        {selectedItem.type === 'form_submission' && 'Form Submission'}
                        {selectedItem.type === 'verification' && 'Verification'}
                        {selectedItem.type === 'document_upload' && 'Document Upload'}
                      </span>
                      {selectedItem.is_mandatory && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded border border-red-200 font-medium">
                          Mandatory
                        </span>
                      )}
                      {selectedItem.has_form && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded border border-green-200 font-medium">
                          Has Form
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {selectedItem.description}
                    </p>
                  </div>

                  {selectedItem.due_date && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Due date
                      </label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedItem.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Created: {new Date(selectedItem.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="h-8 px-3 text-xs rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setShowItemModal(false)
                          setSelectedItem(null)
                        }}
                      >
                        Close
                      </button>
                      <button
                        className="h-8 px-3 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        onClick={() => {
                          if (selectedItem) {
                            handleEditItem(selectedItem)
                          }
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleFormSubmit()
                  }}
                >
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter compliance item title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter description"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Target role
                      </label>
                      <select
                        value={formData.target_role}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            target_role: e.target.value as 'teacher' | 'parent' | 'student',
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="teacher">Teacher</option>
                        <option value="parent">Parent</option>
                        <option value="student">Student</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value as ComplianceItemType })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="form_submission">Form Submission</option>
                        <option value="verification">Verification</option>
                        <option value="document_upload">Document Upload</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="has_form"
                          checked={formData.has_form}
                          onChange={(e) => setFormData({ ...formData, has_form: e.target.checked })}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="has_form" className="text-sm font-medium text-gray-700">
                          Has Form
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        Note: Only check this if a form is created and linked. Otherwise, users can
                        use the checkbox to mark completion.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Due date (optional)
                      </label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        id="is_mandatory"
                        checked={formData.is_mandatory}
                        onChange={(e) =>
                          setFormData({ ...formData, is_mandatory: e.target.checked })
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="is_mandatory"
                        className="ml-2 text-xs font-medium text-gray-700"
                      >
                        Mandatory
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      className="h-8 px-3 text-xs rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setShowItemModal(false)
                        setSelectedItem(null)
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-8 px-3 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      {modalMode === 'add' ? 'Create item' : 'Update item'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// Submissions Tab Component
function SubmissionsTab({
  submissions,
  onReview,
}: {
  submissions: ComplianceSubmission[]
  onReview: () => void
}) {
  const [selectedSubmission, setSelectedSubmission] = useState<ComplianceSubmission | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [rejectionReason, setRejectionReason] = useState('')
  const [filter, setFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all')
  const [reviewing, setReviewing] = useState(false)
  const [submissionPage, setSubmissionPage] = useState(1)
  const submissionsPerPage = 15

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'all') return true
    return sub.status === filter
  })

  const handleReview = (submission: ComplianceSubmission, action: 'approve' | 'reject') => {
    setSelectedSubmission(submission)
    setReviewAction(action)
    setRejectionReason('')
    setShowReviewModal(true)
  }

  const handleConfirmReview = async () => {
    if (!selectedSubmission) return

    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setReviewing(true)
    try {
      console.log('🔄 Starting review process...', {
        submissionId: selectedSubmission.id,
        action: reviewAction,
      })

      // Get current user ID - in a real app, this would come from auth context
      // For now, pass null since we don't have a valid reviewer ID
      const reviewerId = null

      const result = await reviewComplianceSubmission(selectedSubmission.id, reviewerId, {
        submission_id: selectedSubmission.id,
        action: reviewAction,
        rejection_reason: reviewAction === 'reject' ? rejectionReason : undefined,
      })

      console.log('✅ Review completed:', result)

      toast.success(
        `Submission ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`,
        { duration: 4000 },
      )
      setShowReviewModal(false)
      setSelectedSubmission(null)
      onReview() // Reload data
    } catch (error) {
      console.error('❌ Error reviewing submission:', error)

      let errorMessage = 'Failed to review submission. '
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage += (error as Error).message
        } else if ('details' in error) {
          errorMessage += String((error as { details: unknown }).details)
        } else {
          errorMessage += 'Please try again.'
        }
      } else {
        errorMessage += 'Please try again.'
      }

      toast.error(errorMessage, { duration: 6000 })
    } finally {
      setReviewing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'submitted', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1.5">
                ({submissions.filter((s) => s.status === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          {filteredSubmissions.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">
              No {filter !== 'all' ? filter : ''} submissions found
            </p>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions
                .slice(
                  (submissionPage - 1) * submissionsPerPage,
                  submissionPage * submissionsPerPage,
                )
                .map((submission) => (
                  <div
                    key={submission.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {submission.compliance_item?.title || 'Unknown Item'}
                          </h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-sm font-medium ${
                              submission.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : submission.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {submission.status?.charAt(0).toUpperCase() +
                              submission.status?.slice(1).toLowerCase()}
                          </span>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                          <div className="flex items-center space-x-1">
                            <UserGroupIcon className="h-3.5 w-3.5" />
                            <span>{submission.user?.full_name || 'Unknown User'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-3.5 w-3.5" />
                            <span>
                              {new Date(submission.submitted_at).toLocaleDateString()}{' '}
                              {new Date(submission.submitted_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Form Data */}
                        {submission.form_data && (
                          <div className="mt-3 bg-gray-50 rounded p-3 border border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-2">
                              Submission Details:
                            </p>
                            <div className="space-y-1">
                              {Object.entries(submission.form_data).map(([key, value]) => (
                                <div key={key} className="text-xs">
                                  <span className="text-gray-600">{key}:</span>{' '}
                                  <span className="text-gray-900 font-medium">
                                    {typeof value === 'boolean'
                                      ? value
                                        ? 'Yes'
                                        : 'No'
                                      : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {submission.status === 'rejected' && submission.rejection_reason && (
                          <div className="mt-3 bg-red-50 rounded p-3 border border-red-200">
                            <p className="text-xs font-medium text-red-800 mb-1">
                              Rejection Reason:
                            </p>
                            <p className="text-xs text-red-700">{submission.rejection_reason}</p>
                          </div>
                        )}

                        {/* Review Info */}
                        {(submission.status === 'approved' || submission.status === 'rejected') &&
                          submission.reviewed_at && (
                            <div className="mt-2 text-xs text-gray-500">
                              Reviewed on {new Date(submission.reviewed_at).toLocaleDateString()}
                              {submission.reviewer && ` by ${submission.reviewer.full_name}`}
                            </div>
                          )}
                      </div>

                      {/* Action Buttons */}
                      {submission.status === 'submitted' && (
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleReview(submission, 'approve')}
                          >
                            <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => handleReview(submission, 'reject')}
                          >
                            <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {filteredSubmissions.length > submissionsPerPage && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-600">
                    Showing {(submissionPage - 1) * submissionsPerPage + 1} to{' '}
                    {Math.min(submissionPage * submissionsPerPage, filteredSubmissions.length)} of{' '}
                    {filteredSubmissions.length}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSubmissionPage(Math.max(1, submissionPage - 1))}
                      disabled={submissionPage === 1}
                    >
                      ← Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setSubmissionPage(
                          Math.min(
                            Math.ceil(filteredSubmissions.length / submissionsPerPage),
                            submissionPage + 1,
                          ),
                        )
                      }
                      disabled={
                        submissionPage ===
                        Math.ceil(filteredSubmissions.length / submissionsPerPage)
                      }
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {reviewAction === 'approve' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {reviewAction === 'approve' ? 'Approve Submission' : 'Reject Submission'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {reviewAction === 'approve'
                    ? `Are you sure you want to approve this submission for "${selectedSubmission.compliance_item?.title}"?`
                    : `Please provide a reason for rejecting this submission for "${selectedSubmission.compliance_item?.title}".`}
                </p>

                {reviewAction === 'reject' && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                      placeholder="Enter the reason for rejection..."
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      setShowReviewModal(false)
                      setSelectedSubmission(null)
                    }}
                    disabled={reviewing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className={`h-8 px-3 text-xs ${
                      reviewAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                    onClick={handleConfirmReview}
                    disabled={reviewing}
                  >
                    {reviewing ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Processing...
                      </span>
                    ) : reviewAction === 'approve' ? (
                      'Approve'
                    ) : (
                      'Reject'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
