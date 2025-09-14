'use client'

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  // glassmorphism + sheen styles (CSS-driven)
  const base = 'relative overflow-hidden rounded-lg'
  const glass = 'bg-gradient-to-br from-white/30 via-white/10 to-white/5 border border-white/20 backdrop-blur-md'
  const glow = 'shadow-[0_8px_30px_rgba(16,24,40,0.08)]'

  return (
    <div className={cn(base, glass, glow, className)}>
      {/* Shiny moving reflection (CSS: .card-sheen) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="card-sheen" />
      </div>

      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
      {children}
    </div>
  )
}

export function CardContent({ className, children }: CardProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-gray-200', className)}>
      {children}
    </div>
  )
}