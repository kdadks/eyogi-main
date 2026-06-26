
import React from 'react'
import { cn } from '@/utilities/cn'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
  onNavigate?: (href: string) => void
}

export function Breadcrumb({ items, onNavigate, className, ...props }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)} {...props}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-neutral-400" />}
          {item.href ? (
            <button
              onClick={() => onNavigate?.(item.href!)}
              className="text-primary-600 hover:text-primary-700 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-neutral-600">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
