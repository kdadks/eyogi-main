
import React from 'react'
import { cn } from '@/utilities/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'base' | 'lg'
}

export function Badge({
  className,
  variant = 'default',
  size = 'base',
  children,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full'

  const variantStyles = {
    default:
      'bg-neutral-100 text-neutral-800 border border-neutral-200',
    primary:
      'bg-primary-100 text-primary-800 border border-primary-200',
    success:
      'bg-green-100 text-green-800 border border-green-200',
    warning:
      'bg-yellow-100 text-yellow-800 border border-yellow-200',
    danger:
      'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    base: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  return (
    <span
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </span>
  )
}
