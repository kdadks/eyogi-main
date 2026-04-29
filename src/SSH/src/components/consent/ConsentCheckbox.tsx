import React, { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { CONSENT_TEXT } from '../../lib/api/consent'

interface ConsentCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  subjectLabel?: string // e.g. "your child" or "yourself"
  error?: string
  disabled?: boolean
  defaultExpanded?: boolean
}

/**
 * Reusable consent acceptance checkbox with collapsible full consent text.
 * Used during registration, child add and elsewhere a one-time eYogi consent
 * is required from a parent or self-enrolling student.
 */
export default function ConsentCheckbox({
  checked,
  onChange,
  subjectLabel = 'the participant',
  error,
  disabled = false,
  defaultExpanded = false,
}: ConsentCheckboxProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div
      className={`rounded-lg border ${
        error ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50/60'
      } p-3 space-y-2`}
    >
      <div className="flex items-start gap-2">
        <DocumentTextIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-gray-900">
            Participation Consent <span className="text-red-500">*</span>
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            Required once for {subjectLabel} to participate in eYogi Gurukul activities,
            recordings and communications.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-xs font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
      >
        {expanded ? (
          <>
            <ChevronUpIcon className="h-3.5 w-3.5" />
            Hide full consent text
          </>
        ) : (
          <>
            <ChevronDownIcon className="h-3.5 w-3.5" />
            Read full consent text
          </>
        )}
      </button>

      {expanded && (
        <div className="text-xs text-gray-700 whitespace-pre-line max-h-40 overflow-y-auto bg-white border border-blue-100 rounded p-2 leading-relaxed">
          {CONSENT_TEXT}
        </div>
      )}

      <label className="flex items-start gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
        />
        <span className="text-xs sm:text-sm text-gray-800 leading-snug">
          I have read and agree to the eYogi Gurukul participation consent on behalf of{' '}
          <span className="font-medium">{subjectLabel}</span>.
        </span>
      </label>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
