import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Badge } from '../ui/Badge'
import {
  ShieldCheckIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  getAllDeletionRequests,
  reviewDeletionRequest,
  executeDeletion,
  getDeletionStats,
  getDeletionRequestWithImpact,
  getDeletionAuditLogs,
} from '../../lib/api/gdpr'
import type {
  DeletionRequest,
  DeletionRequestStatus,
  DeletionRequestWithImpact,
  DeletionStats,
  DeletionAuditLog,
} from '../../types/gdpr'

interface GDPRDeletionManagementProps {
  adminId: string
  className?: string
}

type TabType = 'pending' | 'approved' | 'completed' | 'all'

export default function GDPRDeletionManagement({
  adminId,
  className = '',
}: GDPRDeletionManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<DeletionRequest[]>([])
  const [stats, setStats] = useState<DeletionStats | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequestWithImpact | null>(null)
  const [auditLogs, setAuditLogs] = useState<DeletionAuditLog[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [reviewReason, setReviewReason] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'execute' | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const statusFilter: DeletionRequestStatus | undefined =
        activeTab === 'all' ? undefined : (activeTab as DeletionRequestStatus)

      const [requestsData, statsData] = await Promise.all([
        getAllDeletionRequests({ status: statusFilter }),
        getDeletionStats(),
      ])

      setRequests(requestsData.data)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading deletion data:', error)
      toast.error('Failed to load deletion requests')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleViewDetails = async (request: DeletionRequest) => {
    try {
      setLoading(true)
      const [requestWithImpact, logs] = await Promise.all([
        getDeletionRequestWithImpact(request.id),
        getDeletionAuditLogs(request.id),
      ])

      if (requestWithImpact) {
        setSelectedRequest(requestWithImpact)
        setAuditLogs(logs)
        setShowDetails(true)
      }
    } catch (error) {
      console.error('Error loading request details:', error)
      toast.error('Failed to load request details')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return

    if (action === 'reject' && !reviewReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setConfirmAction(action)
    setShowConfirmModal(true)
  }

  const confirmReview = async () => {
    if (!selectedRequest || !confirmAction || confirmAction === 'execute') return

    setShowConfirmModal(false)
    setLoading(true)
    try {
      const result = await reviewDeletionRequest(
        selectedRequest.id,
        adminId,
        confirmAction as 'approve' | 'reject',
        confirmAction === 'reject' ? reviewReason : undefined,
      )

      if (result) {
        toast.success(
          `Deletion request ${confirmAction === 'approve' ? 'approved' : 'rejected'} successfully`,
        )
        setShowDetails(false)
        setReviewReason('')
        setConfirmAction(null)
        loadData()
      } else {
        toast.error('Failed to review deletion request')
      }
    } catch (error) {
      console.error('Error reviewing deletion request:', error)
      toast.error('An error occurred while reviewing the request')
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteDeletion = async () => {
    if (!selectedRequest) return
    setConfirmAction('execute')
    setShowConfirmModal(true)
  }

  const confirmExecuteDeletion = async () => {
    if (!selectedRequest || deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setDeleting(true)
    setLoading(true)
    try {
      const result = await executeDeletion(selectedRequest.id, adminId)

      if (result.success) {
        const isFullAccountDeletion = selectedRequest.request_type === 'full_account'
        toast.success(
          isFullAccountDeletion
            ? 'Full account deleted successfully. User has been logged out and redirected to home page.'
            : 'Data deletion executed successfully',
          { duration: 5000 },
        )
        setShowConfirmModal(false)
        setShowDetails(false)
        setConfirmAction(null)
        setDeleteConfirmText('')
        loadData()
      } else {
        toast.error(`Deletion failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error executing deletion:', error)
      toast.error('An error occurred during deletion')
    } finally {
      setDeleting(false)
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<
      string,
      { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
    > = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: ClockIcon,
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircleIcon,
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircleIcon,
      },
      processing: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: ClockIcon,
      },
      completed: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: CheckCircleIcon,
      },
      failed: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: ExclamationTriangleIcon,
      },
    }

    const style = styles[status] || styles.pending
    const Icon = style.icon

    return (
      <Badge className={`${style.bg} ${style.text} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredRequests = requests.filter(
    (req) =>
      req.target_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.target_user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requester?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (showDetails && selectedRequest) {
    return (
      <>
        <Card className={`${className}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-8 w-8 text-orange-600" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Deletion Request Details</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Request ID: {selectedRequest.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Back to List
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Request Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Target User</label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedRequest.target_user?.full_name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500">{selectedRequest.target_user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Requested By</label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedRequest.requester?.full_name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500">{selectedRequest.requester?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Request Type</label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedRequest.request_type.replace('_', ' ')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Requested At</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(selectedRequest.requested_at).toLocaleString()}
                </p>
              </div>
              {selectedRequest.reviewed_at && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Reviewed At</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(selectedRequest.reviewed_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Reason */}
            {selectedRequest.reason && (
              <div>
                <label className="text-sm font-medium text-gray-700">Reason for Deletion</label>
                <p className="text-sm text-gray-900 mt-2 bg-gray-50 p-3 rounded-md">
                  {selectedRequest.reason}
                </p>
              </div>
            )}

            {/* Rejection Reason */}
            {selectedRequest.rejection_reason && (
              <div>
                <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
                <p className="text-sm text-red-700 mt-2 bg-red-50 p-3 rounded-md">
                  {selectedRequest.rejection_reason}
                </p>
              </div>
            )}

            {/* Impact Analysis */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Impact Analysis</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Profiles:</span>
                  <span className="font-medium text-gray-900">
                    {selectedRequest.impact.profiles}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Enrollments:</span>
                  <span className="font-medium text-gray-900">
                    {selectedRequest.impact.enrollments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Certificates:</span>
                  <span className="font-medium text-gray-900">
                    {selectedRequest.impact.certificates}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Attendance:</span>
                  <span className="font-medium text-gray-900">
                    {selectedRequest.impact.attendance_records}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Batch Assignments:</span>
                  <span className="font-medium text-gray-900">
                    {selectedRequest.impact.batch_students}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Compliance:</span>
                  <span className="font-medium text-gray-900">
                    {selectedRequest.impact.compliance_submissions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consent Records:</span>
                  <span className="font-medium text-gray-900">
                    {selectedRequest.impact.consent_records}
                  </span>
                </div>
                {selectedRequest.impact.children_accounts > 0 && (
                  <div className="flex justify-between col-span-2 bg-red-50 -mx-4 px-4 py-2 border-y border-red-200">
                    <span className="text-red-800 font-semibold flex items-center gap-2">
                      ⚠️ Children Accounts (Cascading):
                    </span>
                    <span className="font-bold text-red-900">
                      {selectedRequest.impact.children_accounts}
                    </span>
                  </div>
                )}
                <div className="flex justify-between col-span-2 pt-2 border-t border-gray-300">
                  <span className="font-semibold text-gray-700">Total Records:</span>
                  <span className="font-bold text-gray-900">
                    {selectedRequest.impact.total_records}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Logs */}
            {auditLogs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Audit Trail</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="text-xs bg-gray-50 p-2 rounded border border-gray-200"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {log.action} - {log.table_name}
                        </span>
                        <span
                          className={`font-semibold ${log.success ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <div className="text-gray-600">Records affected: {log.records_affected}</div>
                      <div className="text-gray-500">
                        {new Date(log.performed_at).toLocaleString()}
                      </div>
                      {log.error_message && (
                        <div className="text-red-600 mt-1">Error: {log.error_message}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200">
              {selectedRequest.status === 'pending' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleReview('reject')}
                      disabled={loading}
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      Reject Request
                    </Button>
                    <Button
                      onClick={() => handleReview('approve')}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Approve Request
                    </Button>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'approved' && (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-red-900 mb-1">
                          Critical Action Required
                        </h4>
                        <p className="text-sm text-red-800">
                          This deletion request has been approved. You can now execute the deletion.
                          This action is IRREVERSIBLE and will permanently delete{' '}
                          {selectedRequest.impact.total_records} records.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleExecuteDeletion}
                      disabled={loading}
                      className="bg-red-700 hover:bg-red-800 text-white"
                    >
                      <TrashIcon className="h-5 w-5 mr-2" />
                      Execute Deletion
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Modal for Details View */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`p-2 rounded-full ${
                    confirmAction === 'execute'
                      ? 'bg-red-100'
                      : confirmAction === 'approve'
                        ? 'bg-green-100'
                        : 'bg-yellow-100'
                  }`}
                >
                  {confirmAction === 'execute' ? (
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  ) : confirmAction === 'approve' ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {confirmAction === 'execute'
                      ? selectedRequest?.request_type === 'full_account'
                        ? 'Execute Account Deletion'
                        : 'Execute Data Deletion'
                      : confirmAction === 'approve'
                        ? 'Approve Deletion Request'
                        : 'Reject Deletion Request'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {confirmAction === 'execute' ? (
                      <>
                        <strong className="text-red-600">CRITICAL ACTION:</strong> You are about to
                        {selectedRequest?.request_type === 'full_account'
                          ? ' permanently delete the entire account'
                          : ' permanently delete data'}{' '}
                        for <strong>{selectedRequest?.target_user?.full_name}</strong>.
                        <br />
                        <br />
                        This will{' '}
                        {selectedRequest?.request_type === 'full_account'
                          ? 'remove the user completely from the system, deleting'
                          : 'delete'}{' '}
                        <strong>{selectedRequest?.impact.total_records} records</strong> and{' '}
                        <strong className="text-red-600">CANNOT BE UNDONE</strong>.
                      </>
                    ) : confirmAction === 'approve' ? (
                      <>
                        Are you sure you want to approve this deletion request? The data can be
                        executed for deletion after approval.
                      </>
                    ) : (
                      <>Are you sure you want to reject this deletion request?</>
                    )}
                  </p>
                </div>
              </div>

              {confirmAction === 'execute' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <code className="bg-red-100 text-red-600 px-2 py-1 rounded">DELETE</code>{' '}
                    to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Type DELETE"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmModal(false)
                    setConfirmAction(null)
                    setDeleteConfirmText('')
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmAction === 'execute' ? confirmExecuteDeletion : confirmReview}
                  className={
                    confirmAction === 'execute'
                      ? 'bg-red-600 hover:bg-red-700'
                      : confirmAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-yellow-600 hover:bg-yellow-700'
                  }
                  disabled={
                    (confirmAction === 'execute' && deleteConfirmText !== 'DELETE') || deleting
                  }
                >
                  {deleting && confirmAction === 'execute' ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>
                        {selectedRequest?.request_type === 'full_account'
                          ? 'Deleting Account...'
                          : 'Deleting Data...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      {confirmAction === 'execute'
                        ? selectedRequest?.request_type === 'full_account'
                          ? 'Execute Account Deletion'
                          : 'Execute Deletion'
                        : confirmAction === 'approve'
                          ? 'Approve'
                          : 'Reject'}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className={`flex flex-col gap-6 ${className}`}>
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_requests}</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pending_requests}</p>
                </div>
                <ClockIcon className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Approved</p>
                  <p className="text-2xl font-bold text-green-900">{stats.approved_requests}</p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">{stats.rejected_requests}</p>
                </div>
                <XCircleIcon className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Completed</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.completed_requests}</p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {(['pending', 'approved', 'completed', 'all'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="text-sm text-gray-600 mt-2">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No deletion requests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(request.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(request.requested_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {request.target_user?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-600 mb-1">
                      {request.target_user?.email} • {request.request_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested by: {request.requester?.full_name}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(request)}
                    disabled={loading}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`p-2 rounded-full ${
                  confirmAction === 'execute'
                    ? 'bg-red-100'
                    : confirmAction === 'approve'
                      ? 'bg-green-100'
                      : 'bg-yellow-100'
                }`}
              >
                {confirmAction === 'execute' ? (
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                ) : confirmAction === 'approve' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {confirmAction === 'execute'
                    ? selectedRequest?.request_type === 'full_account'
                      ? 'Execute Account Deletion'
                      : 'Execute Data Deletion'
                    : confirmAction === 'approve'
                      ? 'Approve Deletion Request'
                      : 'Reject Deletion Request'}
                </h3>
                <p className="text-sm text-gray-600">
                  {confirmAction === 'execute' ? (
                    <>
                      <strong className="text-red-600">CRITICAL ACTION:</strong> You are about to
                      {selectedRequest?.request_type === 'full_account'
                        ? ' permanently delete the entire account'
                        : ' permanently delete data'}{' '}
                      for <strong>{selectedRequest?.target_user?.full_name}</strong>.
                      <br />
                      <br />
                      This will{' '}
                      {selectedRequest?.request_type === 'full_account'
                        ? 'remove the user completely from the system, deleting'
                        : 'delete'}{' '}
                      <strong>{selectedRequest?.impact.total_records} records</strong> and{' '}
                      <strong className="text-red-600">CANNOT BE UNDONE</strong>.
                    </>
                  ) : confirmAction === 'approve' ? (
                    <>
                      Are you sure you want to approve this deletion request? The data can be
                      executed for deletion after approval.
                    </>
                  ) : (
                    <>Are you sure you want to reject this deletion request?</>
                  )}
                </p>
              </div>
            </div>

            {confirmAction === 'execute' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <code className="bg-red-100 text-red-600 px-2 py-1 rounded">DELETE</code> to
                  confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Type DELETE"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmModal(false)
                  setConfirmAction(null)
                  setDeleteConfirmText('')
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction === 'execute' ? confirmExecuteDeletion : confirmReview}
                className={
                  confirmAction === 'execute'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                }
                disabled={
                  (confirmAction === 'execute' && deleteConfirmText !== 'DELETE') || deleting
                }
              >
                {deleting && confirmAction === 'execute' ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>
                      {selectedRequest?.request_type === 'full_account'
                        ? 'Deleting Account...'
                        : 'Deleting Data...'}
                    </span>
                  </div>
                ) : (
                  <>
                    {confirmAction === 'execute'
                      ? selectedRequest?.request_type === 'full_account'
                        ? 'Execute Account Deletion'
                        : 'Execute Deletion'
                      : confirmAction === 'approve'
                        ? 'Approve'
                        : 'Reject'}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
