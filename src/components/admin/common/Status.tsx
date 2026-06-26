
import React from 'react'
import { cn } from '@/utilities/cn'

export interface StatusProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'error'
  label?: string
  showDot?: boolean
}

export function Status({ status, label, showDot = true }: StatusProps) {
  const statusConfig = {
    active: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      dot: 'bg-green-500',
      label: 'Active',
    },
    inactive: {
      bg: 'bg-neutral-50',
      border: 'border-neutral-200',
      text: 'text-neutral-600',
      dot: 'bg-neutral-400',
      label: 'Inactive',
    },
    pending: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      dot: 'bg-yellow-500',
      label: 'Pending',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      dot: 'bg-green-500',
      label: 'Success',
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      dot: 'bg-orange-500',
      label: 'Warning',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      dot: 'bg-red-500',
      label: 'Error',
    },
  }

  const config = statusConfig[status]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium text-sm',
        config.bg,
        config.border,
        config.text,
      )}
    >
      {showDot && <div className={cn('w-2 h-2 rounded-full', config.dot)} />}
      {label || config.label}
    </div>
  )
}
