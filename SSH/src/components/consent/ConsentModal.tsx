import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { CONSENT_TEXT, giveConsent, withdrawConsent } from '../../lib/api/consent'
import { toast } from 'react-hot-toast'

interface ConsentModalProps {
  studentId: string
  studentName: string
  consentedBy: string // Parent/Guardian or self (student)
  currentConsent?: {
    consent_given: boolean
    consent_date: string | null
    withdrawn: boolean
  } | null
  onClose: () => void
  onSuccess: () => void
  isParent?: boolean // Whether this is being shown to a parent (for wording)
}

const ConsentModal: React.FC<ConsentModalProps> = ({
  studentId,
  studentName,
  consentedBy,
  currentConsent,
  onClose,
  onSuccess,
  isParent = false,
}) => {
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')

  const hasConsent = currentConsent?.consent_given && !currentConsent?.withdrawn

  const handleGiveConsent = async () => {
    if (!agreed) {
      toast.error('Please read and agree to the consent terms')
      return
    }

    setLoading(true)
    try {
      // Get IP address and user agent for audit trail
      const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => null)
      const ipData = ipResponse ? await ipResponse.json() : null

      const result = await giveConsent({
        student_id: studentId,
        consented_by: consentedBy,
        ip_address: ipData?.ip,
        user_agent: navigator.userAgent,
      })

      if (result) {
        toast.success(`Consent recorded successfully for ${studentName}`)
        onSuccess()
      } else {
        toast.error('Failed to record consent. Please try again.')
      }
    } catch (error) {
      console.error('Error giving consent:', error)
      toast.error('An error occurred while recording consent')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawConsent = async () => {
    setLoading(true)
    try {
      const result = await withdrawConsent(studentId, withdrawReason)

      if (result) {
        toast.success('Consent withdrawn successfully')
        onSuccess()
      } else {
        toast.error('Failed to withdraw consent. Please try again.')
      }
    } catch (error) {
      console.error('Error withdrawing consent:', error)
      toast.error('An error occurred while withdrawing consent')
    } finally {
      setLoading(false)
    }
  }

  if (showWithdraw) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Withdraw Consent</h2>
                  <p className="text-sm text-gray-600 mt-1">{studentName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed"
                disabled={loading}
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                You are about to withdraw consent for {studentName} to participate in eYogi Gurukul
                activities.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Withdrawing consent may affect {studentName}'s ability
                  to participate in certain activities and may impact their enrollment status.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for withdrawal (optional)
              </label>
              <textarea
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Please provide a reason for withdrawing consent..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
            <Button onClick={() => setShowWithdraw(false)} variant="outline" disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleWithdrawConsent}
              variant="primary"
              loading={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Withdrawing...' : 'Withdraw Consent'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {hasConsent ? 'Consent Status' : 'eYogi Gurukul Participation Consent'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {isParent ? `For ${studentName}` : 'Your participation consent'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed"
              disabled={loading}
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {hasConsent && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Consent Given</p>
                <p className="text-xs text-green-700 mt-1">
                  Consent was provided on{' '}
                  {currentConsent.consent_date
                    ? new Date(currentConsent.consent_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Unknown date'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Consent Text */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Consent Agreement</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {CONSENT_TEXT}
            </div>
          </div>

          {!hasConsent && (
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agree-checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="agree-checkbox" className="text-sm text-gray-700 cursor-pointer">
                {isParent ? (
                  <>
                    I confirm that I am the parent/legal guardian of {studentName}, and I have read
                    and agree to the above consent terms on behalf of my child.
                  </>
                ) : (
                  <>
                    I confirm that I have read and agree to the above consent terms for my
                    participation in eYogi Gurukul activities.
                  </>
                )}
              </label>
            </div>
          )}

          {hasConsent && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You can withdraw consent at any time by clicking the
                "Withdraw Consent" button below. Withdrawing consent may affect participation in
                eYogi activities. To withdraw your personal data, please send a formal request to{' '}
                <a href="mailto:info@eyogigurukul.com" className="underline hover:text-yellow-900">
                  info@eyogigurukul.com
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between gap-3 flex-shrink-0">
          <div>
            {hasConsent && (
              <Button
                onClick={() => setShowWithdraw(true)}
                variant="outline"
                disabled={loading}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Withdraw Consent
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" disabled={loading}>
              {hasConsent ? 'Close' : 'Cancel'}
            </Button>
            {!hasConsent && (
              <Button
                onClick={handleGiveConsent}
                variant="primary"
                loading={loading}
                disabled={!agreed}
              >
                {loading ? 'Submitting...' : 'I Agree - Submit Consent'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ConsentModal
