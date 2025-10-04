import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 25, 50, 100],
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getVisiblePages = () => {
    const visiblePages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          visiblePages.push(i)
        }
        visiblePages.push('...')
        visiblePages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        visiblePages.push(1)
        visiblePages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          visiblePages.push(i)
        }
      } else {
        visiblePages.push(1)
        visiblePages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          visiblePages.push(i)
        }
        visiblePages.push('...')
        visiblePages.push(totalPages)
      }
    }

    return visiblePages
  }

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page)
    }
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between items-center">
        {/* Results info */}
        <div className="flex items-center text-sm text-gray-700">
          <p>
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
          {showItemsPerPage && onItemsPerPageChange && (
            <div className="ml-4 flex items-center">
              <label htmlFor="itemsPerPage" className="mr-2 text-sm text-gray-700">
                Show:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {itemsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        <div className="flex items-center space-x-1">
          {/* Previous button */}
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-3 py-2 rounded-l-md border text-sm font-medium ${
              currentPage === 1
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Previous</span>
          </button>

          {/* Page numbers */}
          <div className="flex">
            {getVisiblePages().map((page, index) => (
              <button
                key={index}
                onClick={() => handlePageClick(page)}
                disabled={page === '...'}
                className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : page === '...'
                      ? 'bg-white border-gray-300 text-gray-700 cursor-default'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-3 py-2 rounded-r-md border text-sm font-medium ${
              currentPage === totalPages
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <span className="mr-1 hidden sm:inline">Next</span>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Pagination
