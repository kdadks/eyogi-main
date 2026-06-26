
import React from 'react'
import { cn } from '@/utilities/cn'
import { Check, Minus } from 'lucide-react'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  indeterminate?: boolean
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, indeterminate = false, ...props }, ref) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate
      }
    }, [indeterminate])

    return (
      <div className="flex items-start gap-3">
        <div className="relative pt-0.5">
          <input
            ref={checkboxRef}
            type="checkbox"
            className={cn(
              'w-5 h-5 rounded border-2 border-neutral-300 bg-white',
              'cursor-pointer transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'checked:bg-primary-600 checked:border-primary-600',
              'checked:focus:ring-primary-500',
              'disabled:bg-neutral-100 disabled:border-neutral-200 disabled:cursor-not-allowed',
              error && 'border-red-500',
              'appearance-none',
              className,
            )}
            {...props}
          />

          {/* Custom checkmark icon */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {indeterminate ? (
              <Minus className="w-3 h-3 text-white opacity-0 checked:opacity-100 transition-opacity" />
            ) : (
              <Check className="w-3 h-3 text-white opacity-0 checked:opacity-100 transition-opacity" />
            )}
          </div>
        </div>

        {label && (
          <label className="flex-1 text-sm text-neutral-700 cursor-pointer">
            {label}
            {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
