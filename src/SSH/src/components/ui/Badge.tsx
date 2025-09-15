'use client'

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  className?: string
  children: React.ReactNode
}

export function Badge({ 
  variant = 'default', 
  size = 'md', 
  className, 
  children 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full break-words text-center'
  
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm sm:px-3 sm:py-1.5 sm:text-base max-w-xs sm:max-w-none'
  }

  return (
    <span className={cn(baseClasses, variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}