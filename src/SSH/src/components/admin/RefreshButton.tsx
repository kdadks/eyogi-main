import React, { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface RefreshButtonProps {
  onRefresh?: () => void | Promise<void>
  className?: string
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh, className = '' }) => {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      if (onRefresh) {
        await onRefresh()
      } else {
        // Default: reload the page
        window.location.reload()
      }
    } finally {
      // Keep spinning for minimum 500ms for visual feedback
      setTimeout(() => {
        setIsRefreshing(false)
      }, 500)
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 ${className}`}
      title="Refresh page"
    >
      <ArrowPathIcon
        className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      <span className="ml-2 hidden sm:inline">Refresh</span>
    </button>
  )
}

export default RefreshButton
