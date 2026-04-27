'use client'
'use client'
import React from 'react'
import { cn } from '@/lib/utils'
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  error?: string
  helperText?: string
  rightIcon?: React.ReactNode
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, rightIcon, ...props }, ref) => {
    // Generate ID from label only if label is a string
    const inputId =
      id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs sm:text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className={cn('relative', rightIcon && 'flex items-center')}>
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-11 sm:h-12 px-3 py-2.5 touch-manipulation',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              rightIcon && 'pr-10',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-0 inset-y-0 flex items-center pr-3">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
