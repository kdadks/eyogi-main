import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  ExclamationTriangleIcon,
  TrashIcon,
  ClockIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  createDeletionRequest,
  getDeletionImpact,
  getUserDeletionRequests,
  cancelDeletionRequest,
} from '../../lib/api/gdpr'
import type { DeletionRequest, DeletionImpact, DeletionRequestType } from '../../types/gdpr'

interface DataDeletionRequestProps {
  userId: string
  userRole: 'student' | 'parent' | 'teacher' | 'admin'
  targetUserId?: string // For parents requesting deletion for children
  targetUserName?: string
  className?: string
  compactView?: boolean // Hide the GDPR info section for consolidated display
}

export default function DataDeletionRequest({
  userId,
  userRole,
  targetUserId,
  targetUserName,
  className = '',
  compactView = false,
}: DataDeletionRequestProps) {
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deletionType, setDeletionType] = useState<DeletionRequestType>('student_data')
  const [reason, setReason] = useState('')
  const [impact, setImpact] = useState<DeletionImpact | null>(null)
  const [existingRequests, setExistingRequests] = useState<DeletionRequest[]>([])
  const [acknowledged, setAcknowledged] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null)

  const actualTargetUserId = targetUserId || userId
  const actualTargetUserName = targetUserName || 'your'
  const isParentRequesting = userRole === 'parent' && targetUserId && targetUserId !== userId

  const loadExistingRequests = useCallback(async () => {
    try {
      const requests = await getUserDeletionRequests(userId)
      setExistingRequests(requests)
    } catch (error) {
      console.error('Error loading deletion requests:', error)
    }
  }, [userId])

  useEffect(() => {
    loadExistingRequests()
  }, [loadExistingRequests])

  const loadImpact = async () => {
    try {
      setLoading(true)
      const impactData = await getDeletionImpact(actualTargetUserId)
      setImpact(impactData)
    } catch (error) {
      console.error('Error loading impact:', error)
      toast.error('Failed to load impact analysis')
    } finally {
      setLoading(false)
    }
  }

  const handleShowForm = () => {
    setShowForm(true)
    loadImpact()
  }

  const handleSubmitRequest = async () => {
    if (!acknowledged) {
      toast.error('Please acknowledge that you understand the consequences')
      return
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the deletion request')
      return
    }

    setLoading(true)
    try {
      // Get IP address and user agent
      const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => null)
      const ipData = ipResponse ? await ipResponse.json() : null

      const request = await createDeletionRequest({
        user_id: userId,
        target_user_id: actualTargetUserId,
        request_type: deletionType,
        reason: reason.trim(),
        ip_address: ipData?.ip,
        user_agent: navigator.userAgent,
      })

      if (request) {
        toast.success('Deletion request submitted successfully')
        setShowForm(false)
        setReason('')
        setAcknowledged(false)
        loadExistingRequests()
      } else {
        toast.error('Failed to submit deletion request')
      }
    } catch (error) {
      console.error('Error submitting deletion request:', error)
      toast.error('An error occurred while submitting the request')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = (requestId: string) => {
    setRequestToCancel(requestId)
    setShowCancelModal(true)
  }

  const confirmCancelRequest = async () => {
    if (!requestToCancel) return

    setLoading(true)
    setShowCancelModal(false)
    try {
      const success = await cancelDeletionRequest(requestToCancel, userId)
      if (success) {
        toast.success('Deletion request cancelled')
        loadExistingRequests()
      } else {
        toast.error('Failed to cancel deletion request')
      }
    } catch (error) {
      console.error('Error cancelling deletion request:', error)
      toast.error('An error occurred while cancelling the request')
    } finally {
      setLoading(false)
      setRequestToCancel(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
    }

    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Filter requests relevant to this component instance
  const relevantRequests = existingRequests.filter(
    (req) => req.target_user_id === actualTargetUserId,
  )

  const hasPendingRequest = relevantRequests.some((req) =>
    ['pending', 'processing', 'approved'].includes(req.status),
  )

  if (showForm) {
    return (
      <div
        className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/20 ${className}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-900">Request Data Deletion</h3>
          </div>
          <Button variant="outline" onClick={() => setShowForm(false)} disabled={loading}>
            Cancel
          </Button>
        </div>

        <div className="space-y-6">
          {/* Warning Banner */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-900 mb-2">Warning</h4>
                <p className="text-sm text-red-800">
                  This action will permanently delete{' '}
                  {isParentRequesting ? `${actualTargetUserName}'s` : 'your'} personal data from our
                  system. This process cannot be undone. Please read carefully before proceeding.
                </p>
              </div>
            </div>
          </div>

          {/* Deletion Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deletion Type</label>
            <select
              value={deletionType}
              onChange={(e) => setDeletionType(e.target.value as DeletionRequestType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              disabled={loading}
            >
              <option value="student_data">Delete Student Data Only</option>
              <option value="full_account">Delete Full Account</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {deletionType === 'full_account'
                ? 'This will delete all data and close the account permanently'
                : 'This will delete personal data but anonymize academic records'}
            </p>
          </div>

          {/* Impact Analysis */}
          {impact && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Data to be Affected:</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Enrollments:</span>
                  <span className="font-medium text-gray-900">{impact.enrollments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Certificates:</span>
                  <span className="font-medium text-gray-900">{impact.certificates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Attendance Records:</span>
                  <span className="font-medium text-gray-900">{impact.attendance_records}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Batch Assignments:</span>
                  <span className="font-medium text-gray-900">{impact.batch_students}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Compliance Records:</span>
                  <span className="font-medium text-gray-900">{impact.compliance_submissions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consent Records:</span>
                  <span className="font-medium text-gray-900">{impact.consent_records}</span>
                </div>
                <div className="flex justify-between col-span-2 pt-2 border-t border-gray-300">
                  <span className="font-semibold text-gray-700">Total Records:</span>
                  <span className="font-bold text-gray-900">
                    {deletionType === 'full_account'
                      ? impact.total_records
                      : impact.enrollments +
                        impact.certificates +
                        impact.attendance_records +
                        impact.batch_students +
                        impact.compliance_submissions +
                        impact.consent_records}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Deletion Request <span className="text-red-600">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you are requesting data deletion..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              disabled={loading}
            />
          </div>

          {/* Acknowledgment */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="acknowledge"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1"
                disabled={loading}
              />
              <label htmlFor="acknowledge" className="text-sm text-gray-700">
                I understand that this request will be reviewed by an administrator and that the
                deletion process is irreversible once approved. I acknowledge that{' '}
                {isParentRequesting ? `${actualTargetUserName}'s` : 'my'} certificates will be
                anonymized for legal compliance, and all personal data will be permanently removed.
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={loading || !acknowledged || !reason.trim()}
              loading={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Submit Deletion Request
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/20 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <ShieldCheckIcon className="h-8 w-8 text-orange-600" />
          <h3 className="text-xl font-semibold text-gray-900">Data Privacy & Deletion</h3>
        </div>
      </div>

      <div className="space-y-6">
        {/* Information Section - Hidden in compact view */}
        {!compactView && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Your Right to Data Deletion
                </h4>
                <p className="text-sm text-blue-800 mb-2">
                  Under GDPR Article 17, you have the right to request deletion of{' '}
                  {isParentRequesting ? `${actualTargetUserName}'s` : 'your'} personal data. This
                  includes:
                </p>
                <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                  <li>Personal information and contact details</li>
                  <li>Enrollment and course data</li>
                  <li>Attendance records</li>
                  <li>Consent records</li>
                  <li>Compliance submissions</li>
                </ul>
                <p className="text-sm text-blue-800 mt-2">
                  Note: Certificates may be anonymized rather than deleted for legal compliance and
                  accreditation purposes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Existing Requests */}
        {relevantRequests.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {isParentRequesting ? `${actualTargetUserName}'s Deletion Requests` : 'Your Deletion Requests'}
            </h4>
            <div className="space-y-3">
              {relevantRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(request.status)}
                        <span className="text-xs text-gray-500">
                          {new Date(request.requested_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Target:</strong> {request.target_user?.full_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Type:</strong> {request.request_type.replace('_', ' ')}
                      </p>
                      {request.reason && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Reason:</strong> {request.reason}
                        </p>
                      )}
                      {request.rejection_reason && (
                        <p className="text-sm text-red-600 mt-2">
                          <strong>Rejection Reason:</strong> {request.rejection_reason}
                        </p>
                      )}
                    </div>
                    {request.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleCancelRequest(request.id)}
                        disabled={loading}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Request Button */}
        {!hasPendingRequest && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handleShowForm}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Request Data Deletion
            </Button>
          </div>
        )}

        {hasPendingRequest && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <ClockIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  You have a pending deletion request. Please wait for administrator review before
                  submitting a new request.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
          For questions about data deletion, contact:{' '}
          <a href="mailto:info@eyogigurukul.com" className="text-orange-600 hover:underline">
            info@eyogigurukul.com
          </a>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 rounded-full bg-yellow-100">
                <XCircleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Cancel Deletion Request
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to cancel this deletion request? You can submit a new
                  request at any time.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false)
                  setRequestToCancel(null)
                }}
                disabled={loading}
              >
                Keep Request
              </Button>
              <Button
                onClick={confirmCancelRequest}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                disabled={loading}
              >
                Cancel Request
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
