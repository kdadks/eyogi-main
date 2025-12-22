import React from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ConsentStatusBadgeProps {
  consentGiven: boolean
  withdrawn: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  onClick?: () => void
  className?: string
}

const ConsentStatusBadge: React.FC<ConsentStatusBadgeProps> = ({
  consentGiven,
  withdrawn,
  size = 'md',
  showLabel = true,
  onClick,
  className = '',
}) => {
  const getStatus = () => {
    if (withdrawn) {
      return {
        label: 'Consent Withdrawn',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircleIcon,
        iconColor: 'text-red-600',
      }
    }
    if (consentGiven) {
      return {
        label: 'Consent Given',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircleIcon,
        iconColor: 'text-green-600',
      }
    }
    return {
      label: 'No Consent',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-600',
    }
  }

  const status = getStatus()
  const Icon = status.icon

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded border font-medium ${status.color} ${sizeClasses[size]} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      type={onClick ? 'button' : undefined}
    >
      <Icon className={`${iconSizes[size]} ${status.iconColor}`} />
      {showLabel && status.label}
    </Component>
  )
}

export default ConsentStatusBadge
