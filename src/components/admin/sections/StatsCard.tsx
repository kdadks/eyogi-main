
import React from 'react'
import { cn } from '@/utilities/cn'

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    direction: 'up' | 'down'
  }
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  trend?: {
    value: number
    label: string
  }
}

export function StatCard({
  title,
  value,
  change,
  icon,
  color = 'primary',
  trend,
}: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 border-primary-200',
    success: 'bg-green-50 text-green-600 border-green-200',
    warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    danger: 'bg-red-50 text-red-600 border-red-200',
    info: 'bg-blue-50 text-blue-600 border-blue-200',
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-2">{title}</p>
          <div className="flex items-baseline gap-2 mb-4">
            <p className="text-3xl font-bold text-neutral-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change && (
              <span
                className={cn(
                  'text-sm font-semibold',
                  change.direction === 'up'
                    ? 'text-green-600'
                    : 'text-red-600',
                )}
              >
                {change.direction === 'up' ? '↑' : '↓'} {Math.abs(change.value)}%
              </span>
            )}
          </div>
          {trend && (
            <p className="text-xs text-neutral-500">
              {trend.label}: <span className="font-semibold text-neutral-900">{trend.value}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
