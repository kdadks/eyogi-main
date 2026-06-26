
import React from 'react'
import { cn } from '@/utilities/cn'
import {
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  closable?: boolean
  onClose?: () => void
}

export function Alert({
  type = 'info',
  title,
  children,
  closable = false,
  onClose,
  className,
  ...props
}: AlertProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  const config = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertTriangle,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: AlertCircle,
    },
  }

  const alertConfig = config[type]
  const Icon = alertConfig.icon

  return (
    <div
      className={cn(
        'p-4 rounded-lg border flex items-start gap-3',
        alertConfig.bg,
        alertConfig.border,
        alertConfig.text,
        className,
      )}
      {...props}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <div className="text-sm">{children}</div>
      </div>
      {closable && (
        <button
          onClick={handleClose}
          className="text-current hover:opacity-70 flex-shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  )
}
