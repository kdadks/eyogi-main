import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '../ui/Badge'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  AcademicCapIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline'
import { getBatches, deleteBatch, getBatchStats } from '../../lib/api/batches'
import { getGurukuls } from '../../lib/api/gurukuls'
import { Batch, Gurukul } from '../../types'
import { usePermissions } from '../../hooks/usePermissions'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'
import { sanitizeHtml } from '../../utils/sanitize'
import BatchModal from './BatchModal'
import StudentAssignmentModal from './StudentAssignmentModal'
import CourseAssignmentModal from './CourseAssignmentModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'

const BatchManagement: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([])
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    completed: 0,
    archived: 0,
  })

  // Modal states
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  // Filters
  const [filterGurukul, setFilterGurukul] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const { canAccessResource } = usePermissions()
  const { profile } = useSupabaseAuth()

  const canCreate = canAccessResource('batches', 'create')
  const canUpdate = canAccessResource('batches', 'update')
  const canDelete = canAccessResource('batches', 'delete')
  const canAssignStudents = canAccessResource('batch_students', 'create')
  const canAssignCourses = canAccessResource('batch_courses', 'create')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setCurrentPage(1)
    try {
      const [batchData, gurukulData, statsData] = await Promise.all([
        getBatches({
          gurukul_id: filterGurukul || undefined,
          status: filterStatus || undefined,
          is_active: true,
        }),
        getGurukuls(),
        getBatchStats(),
      ])

      setBatches(batchData)
      setGurukuls(gurukulData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [filterGurukul, filterStatus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateBatch = () => {
    setEditingBatch(null)
    setShowBatchModal(true)
  }

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch)
    setShowBatchModal(true)
  }

  const handleDeleteBatch = async (batch: Batch) => {
    if (!canDelete || !profile) return

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Batch',
      message: `Are you sure you want to delete batch "${batch.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteBatch(batch.id)
          await fetchData()
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        } catch (error) {
          console.error('Error deleting batch:', error)
          alert('Failed to delete batch')
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }
      },
    })
  }

  const handleStudentAssignment = (batch: Batch) => {
    setSelectedBatch(batch)
    setShowStudentModal(true)
  }

  const handleCourseAssignment = (batch: Batch) => {
    setSelectedBatch(batch)
    setShowCourseModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'completed':
        return 'bg-purple-100 text-purple-800'
      case 'archived':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString()
  }

  const formatStatus = (status: string) => {
    if (!status) return 'Unknown'
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <QueueListIcon className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <AcademicCapIcon className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.archived}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-end justify-between">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Gurukul
                </label>
                <select
                  value={filterGurukul}
                  onChange={(e) => setFilterGurukul(e.target.value)}
                  className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Gurukuls</option>
                  {gurukuls.map((gurukul) => (
                    <option key={gurukul.id} value={gurukul.id}>
                      {gurukul.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Create Batch Button */}
            {canCreate && (
              <Button
                onClick={() => setShowBatchModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create New Batch
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batches Grid */}
      <div className="space-y-4">
        {(() => {
          const startIndex = (currentPage - 1) * itemsPerPage
          const endIndex = startIndex + itemsPerPage
          const paginatedBatches = batches.slice(startIndex, endIndex)
          const totalPages = Math.ceil(batches.length / itemsPerPage)

          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedBatches.map((batch) => (
                  <Card key={batch.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{batch.name}</CardTitle>
                        <Badge className={getStatusColor(batch.status)}>
                          {formatStatus(batch.status)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <AcademicCapIcon className="h-4 w-4 mr-2" />
                          <span>{batch.gurukul?.name || 'Unknown Gurukul'}</span>
                        </div>

                        {batch.description && (
                          <div
                            className="text-sm text-gray-600"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(batch.description) }}
                          />
                        )}

                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span>
                            {batch.start_date ? formatDate(batch.start_date) : 'TBD'} -{' '}
                            {batch.end_date ? formatDate(batch.end_date) : 'TBD'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            <span>{batch.student_count || 0} students</span>
                          </div>
                          <div className="flex items-center">
                            <BookOpenIcon className="h-4 w-4 mr-1" />
                            <span>{batch.course_count || 0} courses</span>
                          </div>
                        </div>

                        {batch.teacher && (
                          <div className="text-sm text-gray-600">
                            <strong>Teacher:</strong> {batch.teacher.full_name}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBatch(batch)}
                              className="flex items-center space-x-1"
                            >
                              <PencilIcon className="h-3 w-3" />
                              <span>Edit</span>
                            </Button>
                          )}

                          {canAssignStudents && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStudentAssignment(batch)}
                              className="flex items-center space-x-1"
                            >
                              <UserGroupIcon className="h-3 w-3" />
                              <span>Students</span>
                            </Button>
                          )}

                          {canAssignCourses && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCourseAssignment(batch)}
                              className="flex items-center space-x-1"
                            >
                              <BookOpenIcon className="h-3 w-3" />
                              <span>Courses</span>
                            </Button>
                          )}

                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBatch(batch)}
                              className="flex items-center space-x-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            >
                              <TrashIcon className="h-3 w-3" />
                              <span>Delete</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, batches.length)} of{' '}
                        {batches.length} batches (Page {currentPage} of {totalPages})
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )
        })()}
      </div>

      {batches.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <QueueListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
            <p className="text-gray-600 mb-4">
              {filterGurukul || filterStatus
                ? 'No batches match your current filters.'
                : 'Get started by creating your first batch.'}
            </p>
            {canCreate && !filterGurukul && !filterStatus && (
              <Button onClick={handleCreateBatch}>Create First Batch</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showBatchModal && (
        <BatchModal
          batch={editingBatch}
          gurukuls={gurukuls}
          onClose={() => setShowBatchModal(false)}
          onSuccess={() => {
            setShowBatchModal(false)
            fetchData()
          }}
        />
      )}

      {showStudentModal && selectedBatch && (
        <StudentAssignmentModal
          batch={selectedBatch}
          onClose={() => setShowStudentModal(false)}
          onSuccess={() => {
            setShowStudentModal(false)
            fetchData()
          }}
        />
      )}

      {showCourseModal && selectedBatch && (
        <CourseAssignmentModal
          batch={selectedBatch}
          onClose={() => setShowCourseModal(false)}
          onSuccess={() => {
            setShowCourseModal(false)
            fetchData()
          }}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        variant="danger"
      />
    </div>
  )
}

export default BatchManagement
