import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Enrollment } from '@/types'
import {
  getAllEnrollments,
  updateEnrollmentStatus,
  bulkUpdateEnrollments,
} from '@/lib/api/enrollments'
import { formatDate, getStatusColor, toSentenceCase } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  BookOpenIcon,
  CurrencyEuroIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

export default function EnrollmentManagement() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set())
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    loadEnrollments()
  }, [])

  const filterEnrollments = React.useCallback(() => {
    let filtered = enrollments

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (enrollment) =>
          enrollment.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enrollment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enrollment.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((enrollment) => enrollment.status === statusFilter)
    }

    setFilteredEnrollments(filtered)
  }, [enrollments, searchTerm, statusFilter])

  useEffect(() => {
    filterEnrollments()
  }, [filterEnrollments])

  const loadEnrollments = async () => {
    try {
      const data = await getAllEnrollments()
      setEnrollments(data)
    } catch (error) {
      console.error('Error loading enrollments:', error)
      toast.error('Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEnrollment = (enrollmentId: string) => {
    const newSelected = new Set(selectedEnrollments)
    if (newSelected.has(enrollmentId)) {
      newSelected.delete(enrollmentId)
    } else {
      newSelected.add(enrollmentId)
    }
    setSelectedEnrollments(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedEnrollments.size === filteredEnrollments.length) {
      setSelectedEnrollments(new Set())
    } else {
      setSelectedEnrollments(new Set(filteredEnrollments.map((e) => e.id)))
    }
  }

  const handleUpdateStatus = async (enrollmentId: string, status: Enrollment['status']) => {
    setActionLoading((prev) => new Set(prev).add(enrollmentId))
    try {
      await updateEnrollmentStatus(enrollmentId, status)
      await loadEnrollments()
      toast.success(`Enrollment ${status} successfully`)
    } catch (error) {
      console.error('Error updating enrollment:', error)
      toast.error('Failed to update enrollment')
    } finally {
      setActionLoading((prev) => {
        const newSet = new Set(prev)
        newSet.delete(enrollmentId)
        return newSet
      })
    }
  }

  const handleBulkUpdate = async (status: Enrollment['status']) => {
    if (selectedEnrollments.size === 0) {
      toast.error('Please select enrollments to update')
      return
    }

    setBulkLoading(true)
    try {
      await bulkUpdateEnrollments(Array.from(selectedEnrollments), status)
      await loadEnrollments()
      setSelectedEnrollments(new Set())
      toast.success(`${selectedEnrollments.size} enrollments ${status} successfully`)
    } catch (error) {
      console.error('Error bulk updating enrollments:', error)
      toast.error('Failed to update enrollments')
    } finally {
      setBulkLoading(false)
    }
  }

  const stats = {
    total: enrollments.length,
    pending: enrollments.filter((e) => e.status === 'pending').length,
    approved: enrollments.filter((e) => e.status === 'approved').length,
    completed: enrollments.filter((e) => e.status === 'completed').length,
    rejected: enrollments.filter((e) => e.status === 'rejected').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h2 className="text-xl font-bold">Enrollment Management</h2>

            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students, courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedEnrollments.size > 0 && (
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedEnrollments.size} enrollment{selectedEnrollments.size !== 1 ? 's' : ''}{' '}
                selected
              </span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkUpdate('approved')}
                  loading={bulkLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleBulkUpdate('rejected')}
                  loading={bulkLoading}
                >
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Reject All
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No enrollments found</h3>
              <p className="text-gray-600">No enrollments match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedEnrollments.size === filteredEnrollments.length &&
                          filteredEnrollments.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrolled Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedEnrollments.has(enrollment.id)}
                          onChange={() => handleSelectEnrollment(enrollment.id)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {enrollment.student?.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">{enrollment.student?.email}</div>
                            <div className="text-xs text-gray-400">
                              ID: {enrollment.student?.student_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <BookOpenIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {enrollment.course?.title || 'No Course'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {enrollment.course?.course_number} • Level: {enrollment.course?.level}
                            </div>
                            <div className="text-xs text-gray-400">
                              {enrollment.course?.gurukul?.name || 'Unknown Gurukul'} • ₹
                              {enrollment.course?.price || 0}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(enrollment.status)} size="sm">
                          {toSentenceCase(enrollment.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center mb-1">
                            <CurrencyEuroIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="font-medium">₹{enrollment.course?.price || 0}</span>
                          </div>
                          <Badge
                            className={getStatusColor(enrollment.payment_status || 'pending')}
                            size="sm"
                          >
                            {toSentenceCase(enrollment.payment_status || 'pending')}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(enrollment.enrolled_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {enrollment.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(enrollment.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                title="Approve enrollment"
                                disabled={actionLoading.has(enrollment.id)}
                              >
                                {actionLoading.has(enrollment.id) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                ) : (
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleUpdateStatus(enrollment.id, 'rejected')}
                                title="Reject enrollment"
                                disabled={actionLoading.has(enrollment.id)}
                              >
                                {actionLoading.has(enrollment.id) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                ) : (
                                  <XCircleIcon className="h-4 w-4 mr-1" />
                                )}
                                Reject
                              </Button>
                            </>
                          )}
                          {enrollment.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(enrollment.id, 'completed')}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              title="Mark as completed"
                              disabled={actionLoading.has(enrollment.id)}
                            >
                              {actionLoading.has(enrollment.id) ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                              ) : (
                                <ClockIcon className="h-4 w-4 mr-1" />
                              )}
                              Complete
                            </Button>
                          )}
                          {enrollment.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-800" size="sm">
                              ✓ Completed
                            </Badge>
                          )}
                          {enrollment.status === 'rejected' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(enrollment.id, 'pending')}
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                              title="Revert to pending"
                              disabled={actionLoading.has(enrollment.id)}
                            >
                              {actionLoading.has(enrollment.id) ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                              ) : (
                                'Reset'
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
