
import React from 'react'
import { cn } from '@/utilities/cn'

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            ref={ref}
            type="radio"
            className={cn(
              'w-5 h-5 border-2 border-neutral-300 bg-white',
              'cursor-pointer transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'checked:border-primary-600',
              'checked:focus:ring-primary-500',
              'disabled:bg-neutral-100 disabled:border-neutral-200 disabled:cursor-not-allowed',
              error && 'border-red-500',
              'appearance-none rounded-full',
              'checked:bg-primary-600',
              className,
            )}
            {...props}
          />
        </div>

        {label && (
          <label className="text-sm text-neutral-700 cursor-pointer">
            {label}
            {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
      </div>
    )
  },
)

Radio.displayName = 'Radio'
