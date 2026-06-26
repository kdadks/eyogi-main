
import React from 'react'
import { cn } from '@/utilities/cn'

export interface TimelineItem {
  id: string
  title: string
  description?: string
  timestamp: Date
  type: 'info' | 'success' | 'warning' | 'danger'
  icon?: React.ReactNode
}

interface ActivityTimelineProps {
  items: TimelineItem[]
  maxItems?: number
}

export function ActivityTimeline({ items, maxItems = 5 }: ActivityTimelineProps) {
  const displayedItems = items.slice(0, maxItems)

  const colorClasses = {
    info: 'bg-blue-100 text-blue-600 border-blue-200',
    success: 'bg-green-100 text-green-600 border-green-200',
    warning: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    danger: 'bg-red-100 text-red-600 border-red-200',
  }

  const lineClasses = {
    info: 'bg-blue-200',
    success: 'bg-green-200',
    warning: 'bg-yellow-200',
    danger: 'bg-red-200',
  }

  return (
    <div className="space-y-6">
      {displayedItems.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          {/* Timeline line and dot */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full border-2 flex items-center justify-center',
                colorClasses[item.type],
              )}
            >
              {item.icon || (
                <div className="w-3 h-3 rounded-full bg-current opacity-60" />
              )}
            </div>
            {index < displayedItems.length - 1 && (
              <div
                className={cn('w-0.5 h-12 mt-2', lineClasses[item.type])}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pt-1">
            <h4 className="font-semibold text-sm text-neutral-900">{item.title}</h4>
            {item.description && (
              <p className="text-sm text-neutral-600 mt-1">{item.description}</p>
            )}
            <p className="text-xs text-neutral-500 mt-2">
              {new Date(item.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
