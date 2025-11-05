'use client'
'use client'
import React from 'react'
import { cn } from '@/lib/utils'
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  className?: string
  children: React.ReactNode
}
export function Badge({ variant = 'default', size = 'md', className, children }: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-md break-words text-center'
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-gray-200 text-gray-700',
    outline: 'border border-gray-300 text-gray-700 bg-white',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm max-w-xs sm:max-w-none',
  }

  // Convert children to sentence case (capitalize first letter only)
  const formatText = (text: React.ReactNode): React.ReactNode => {
    if (typeof text === 'string') {
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    }
    return text
  }

  return (
    <span className={cn(baseClasses, variants[variant], sizes[size], className)}>
      {formatText(children)}
    </span>
  )
}
