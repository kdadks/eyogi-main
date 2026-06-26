
import React from 'react'
import { cn } from '@/utilities/cn'
import { AlertCircle } from 'lucide-react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  showCharCount?: boolean
  maxLength?: number
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      showCharCount = false,
      maxLength,
      value,
      ...props
    },
    ref,
  ) => {
    const charCount = typeof value === 'string' ? value.length : 0

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          maxLength={maxLength}
          value={value}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm font-sans',
            'border-neutral-300 bg-white text-neutral-900',
            'placeholder-neutral-400',
            'transition-all duration-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:bg-neutral-50 disabled:text-neutral-500 disabled:border-neutral-200 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            className,
          )}
          {...props}
        />

        <div className="flex items-start justify-between mt-1.5 gap-2">
          <div className="flex-1">
            {error && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {hint && !error && (
              <p className="text-sm text-neutral-500">{hint}</p>
            )}
          </div>

          {showCharCount && maxLength && (
            <span className="text-sm text-neutral-500 flex-shrink-0">
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
