
import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utilities/cn'

export interface NotificationProps {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  onClose: (id: string) => void
}

export function Notification({
  id,
  type,
  title,
  message,
  onClose,
}: NotificationProps) {
  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  }

  const iconClasses = {
    success: '✓',
    error: '✕',
    info: 'ⓘ',
    warning: '⚠',
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 max-w-md p-4 rounded-lg border shadow-lg animate-in fade-in slide-in-from-right',
        typeClasses[type],
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 text-lg font-bold">
          {iconClasses[type]}
        </span>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{title}</h3>
          {message && <p className="text-sm mt-1 opacity-90">{message}</p>}
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 opacity-70 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface NotificationCenterProps {
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    title: string
    message?: string
  }>
  onClose: (id: string) => void
}

export function NotificationCenter({
  notifications,
  onClose,
}: NotificationCenterProps) {
  return (
    <div className="fixed bottom-0 right-0 z-50 space-y-2 p-4">
      {notifications.map((notif) => (
        <Notification
          key={notif.id}
          id={notif.id}
          type={notif.type}
          title={notif.title}
          message={notif.message}
          onClose={onClose}
        />
      ))}
    </div>
  )
}
