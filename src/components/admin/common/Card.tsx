
import React from 'react'
import { cn } from '@/utilities/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  hoverable?: boolean
}

export function Card({
  className,
  variant = 'default',
  hoverable = false,
  children,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-lg border'

  const variantStyles = {
    default: 'bg-white border-neutral-200 shadow-sm',
    outlined: 'bg-white border-neutral-200',
    elevated: 'bg-white border-none shadow-lg',
  }

  const hoverStyles = hoverable
    ? 'transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer'
    : ''

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], hoverStyles, className)}
      {...props}
    >
      {children}
    </div>
  )
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('p-6 border-b border-neutral-200', className)} {...props}>
      {children}
    </div>
  )
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardBody({ className, children, ...props }: CardBodyProps) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  )
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('p-6 border-t border-neutral-200 bg-neutral-50', className)}
      {...props}
    >
      {children}
    </div>
  )
}
