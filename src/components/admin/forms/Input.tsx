
import React from 'react'
import { cn } from '@/utilities/cn'
import { AlertCircle } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, prefix, suffix, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-neutral-500 text-sm">{prefix}</span>
          )}

          <input
            ref={ref}
            className={cn(
              'w-full px-3 py-2 border rounded-lg text-sm',
              'border-neutral-300 bg-white text-neutral-900',
              'placeholder-neutral-400',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 focus:border-primary-500',
              'disabled:bg-neutral-50 disabled:text-neutral-500 disabled:border-neutral-200 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
              prefix && 'pl-8',
              suffix && 'pr-8',
              className,
            )}
            {...props}
          />

          {suffix && (
            <span className="absolute right-3 text-neutral-500 text-sm">{suffix}</span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-1 mt-1.5 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {hint && !error && (
          <p className="mt-1.5 text-sm text-neutral-500">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
