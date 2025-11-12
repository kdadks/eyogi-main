import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, UserIcon, ClockIcon, ComputerDesktopIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { StudentConsent } from '../../lib/api/consent'

interface ConsentAuditModalProps {
  consent: StudentConsent | null
  studentName: string
  onClose: () => void
}

export default function ConsentAuditModal({ consent, studentName, onClose }: ConsentAuditModalProps) {
  if (!consent) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Consent Audit Trail</h2>
                  <p className="text-blue-100 mt-1">Student: {studentName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Consent Status */}
              <div className="mb-6">
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    consent.withdrawn
                      ? 'bg-red-100 text-red-800'
                      : consent.consent_given
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {consent.withdrawn
                    ? '🔴 Consent Withdrawn'
                    : consent.consent_given
                      ? '✅ Consent Given'
                      : '⚠️ No Consent'}
                </div>
              </div>

              {/* Consent Given Section */}
              {consent.consent_given && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <UserIcon className="w-5 h-5 mr-2" />
                    Consent Given Details
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                          Given By
                        </label>
                        <p className="text-green-900 font-medium mt-1">
                          {consent.consented_by_user?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-green-700">
                          {consent.consented_by_user?.email || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                          User ID
                        </label>
                        <p className="text-green-900 font-mono text-sm mt-1">
                          {consent.consented_by || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-green-200">
                      <div>
                        <label className="text-xs font-medium text-green-700 uppercase tracking-wide flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          Date & Time
                        </label>
                        <p className="text-green-900 font-medium mt-1">
                          {formatDate(consent.consent_date)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-green-700 uppercase tracking-wide flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          IP Address
                        </label>
                        <p className="text-green-900 font-mono text-sm mt-1">
                          {consent.ip_address || 'Not recorded'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-green-200">
                      <label className="text-xs font-medium text-green-700 uppercase tracking-wide flex items-center">
                        <ComputerDesktopIcon className="w-4 h-4 mr-1" />
                        User Agent (Browser/Device)
                      </label>
                      <p className="text-green-900 text-sm mt-1 break-all">
                        {consent.user_agent || 'Not recorded'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Withdrawn Section */}
              {consent.withdrawn && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">Consent Withdrawn</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-red-700 uppercase tracking-wide flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Withdrawn Date & Time
                      </label>
                      <p className="text-red-900 font-medium mt-1">
                        {formatDate(consent.withdrawn_date)}
                      </p>
                    </div>
                    {consent.withdrawn_reason && (
                      <div>
                        <label className="text-xs font-medium text-red-700 uppercase tracking-wide">
                          Reason
                        </label>
                        <p className="text-red-900 mt-1 bg-red-100 rounded-lg p-3">
                          {consent.withdrawn_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Student Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Full Name
                    </label>
                    <p className="text-gray-900 font-medium mt-1">
                      {consent.student?.full_name || studentName}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Student ID
                    </label>
                    <p className="text-gray-900 font-medium mt-1">
                      {consent.student?.student_id || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Email
                    </label>
                    <p className="text-gray-900 mt-1">{consent.student?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Database ID
                    </label>
                    <p className="text-gray-900 font-mono text-xs mt-1 break-all">
                      {consent.student_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* System Timestamps */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">System Timestamps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                      Record Created
                    </label>
                    <p className="text-blue-900 mt-1">{formatDate(consent.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                      Last Updated
                    </label>
                    <p className="text-blue-900 mt-1">{formatDate(consent.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Consent Text Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Consent Text</h3>
                <div className="bg-white rounded-lg p-4 max-h-48 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap border border-gray-300">
                  {consent.consent_text}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end border-t border-gray-200">
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
