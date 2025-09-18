'use client'

'use client'

import React, { useRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props },
    forwardedRef,
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

    const variants = {
      primary: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
      secondary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      outline:
        'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-orange-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-orange-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm min-h-[40px]',
      md: 'px-4 py-2 text-sm min-h-[44px]',
      lg: 'px-6 py-3 text-base min-h-[48px]',
    }
    // ref for ripple creation - combine with forwarded ref
    const ref = useRef<HTMLButtonElement | null>(null)

    // Combine refs
    React.useEffect(() => {
      if (forwardedRef) {
        if (typeof forwardedRef === 'function') {
          forwardedRef(ref.current)
        } else {
          forwardedRef.current = ref.current
        }
      }
    }, [forwardedRef])

    // preserve any external onMouseDown and onKeyDown passed via props
    const externalOnMouseDown = props.onMouseDown as
      | React.MouseEventHandler<HTMLButtonElement>
      | undefined
    const externalOnKeyDown = props.onKeyDown as
      | React.KeyboardEventHandler<HTMLButtonElement>
      | undefined

    // ripple colors per variant
    const rippleColors: Record<string, string> = {
      primary: 'rgba(255,165,0,0.28)', // orange
      secondary: 'rgba(59,130,246,0.20)', // blue-500
      outline: 'rgba(99,102,241,0.08)', // subtle
      ghost: 'rgba(0,0,0,0.08)',
      danger: 'rgba(239,68,68,0.22)',
    }

    const rippleDuration = 350 // ms (shorter)
    const rippleSizeFactor = 0.5 // smaller base size

    const createRipple = (x: number, y: number) => {
      const btn = ref.current
      if (!btn) return

      const rect = btn.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * rippleSizeFactor
      const ripple = document.createElement('span')
      ripple.style.position = 'absolute'
      ripple.style.borderRadius = '50%'
      ripple.style.pointerEvents = 'none'
      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${x - rect.left - size / 2}px`
      ripple.style.top = `${y - rect.top - size / 2}px`
      const color = rippleColors[variant] || 'rgba(255,255,255,0.28)'
      ripple.style.background = color
      ripple.style.transform = 'scale(0)'
      ripple.style.opacity = '1'
      ripple.style.transition = `transform ${rippleDuration}ms cubic-bezier(.22,.9,.31,1), opacity ${rippleDuration}ms ease-out`
      ripple.style.zIndex = '10'

      btn.appendChild(ripple)

      // trigger animation
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(3)'
        ripple.style.opacity = '0'
      })

      // cleanup after animation
      const remove = () => {
        try {
          ripple.remove()
        } catch {
          /* ignore */
        }
      }
      ripple.addEventListener('transitionend', remove)
      // fallback
      setTimeout(remove, rippleDuration + 50)
    }

    const handleMouseDown: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      // run external handler first
      externalOnMouseDown?.(e)
      createRipple(e.clientX, e.clientY)
    }

    const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
      // run external handler first
      externalOnKeyDown?.(e)
      // trigger ripple for Enter or Space
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        // center of button
        const btn = ref.current
        if (!btn) return
        const rect = btn.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        createRipple(cx, cy)
      }
    }

    return (
      <button
        ref={ref}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        className={cn(
          // ensure overflow hidden for ripple and relative positioning
          baseClasses + ' relative overflow-hidden',
          // stronger hover/glow and active press scale for glossy feel
          'hover:shadow-[0_20px_40px_rgba(255,165,0,0.18)] active:scale-[0.99] transition-transform',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
