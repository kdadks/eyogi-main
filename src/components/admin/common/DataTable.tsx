
import React, { useRef, useEffect } from 'react'
import { cn } from '@/utilities/cn'
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  label: string
  width?: string
  render?: (value: any, row: T, index: number) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: string) => void
  selectable?: boolean
  onSelectAll?: (selected: boolean) => void
  onSelectRow?: (row: T, selected: boolean) => void
  selectedRows?: Set<string>
  rowKey?: keyof T
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
  pagination?: {
    total: number
    limit: number
    offset: number
  }
  onPaginationChange?: (offset: number) => void
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found',
  sortBy,
  sortOrder = 'asc',
  onSort,
  selectable = false,
  onSelectAll,
  onSelectRow,
  selectedRows = new Set(),
  rowKey = 'id' as keyof T,
  onEdit,
  onDelete,
  onView,
  pagination,
  onPaginationChange,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedRows.size === data.length
  const someSelected = selectedRows.size > 0 && !allSelected
  const checkboxRef = useRef<HTMLInputElement>(null)

  // Handle indeterminate state properly
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const currentPage = pagination ? Math.floor(pagination.offset / pagination.limit) + 1 : 1
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1

  const handleSelectAll = () => {
    onSelectAll?.(!allSelected)
  }

  const handleSelectRow = (row: T) => {
    onSelectRow?.(row, !selectedRows.has(String(row[rowKey])))
  }

  const handlePrevious = () => {
    if (pagination && pagination.offset >= pagination.limit) {
      onPaginationChange?.(pagination.offset - pagination.limit)
    }
  }

  const handleNext = () => {
    if (pagination && pagination.offset + pagination.limit < pagination.total) {
      onPaginationChange?.(pagination.offset + pagination.limit)
    }
  }

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
      {/* Bulk actions bar */}
      {selectedRows.size > 0 && (
        <div className="px-6 py-3 bg-primary-50 border-b border-primary-200 flex items-center justify-between">
          <span className="text-sm font-medium text-primary-900">
            {selectedRows.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectAll?.(false)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    ref={checkboxRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-6 py-3 text-sm font-semibold text-neutral-900',
                    col.width || '',
                    col.sortable && 'cursor-pointer hover:bg-neutral-100',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                  )}
                  onClick={() => col.sortable && onSort?.(String(col.key))}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && sortBy === String(col.key) && (
                      <>
                        {sortOrder === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className="px-6 py-3 text-center text-sm font-semibold text-neutral-900 w-12">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-200">
            {loading ? (
              <tr>
                <td
                  colSpan={(selectable ? 1 : 0) + columns.length + (onEdit || onDelete || onView ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={(selectable ? 1 : 0) + columns.length + (onEdit || onDelete || onView ? 1 : 0)}
                  className="px-6 py-12 text-center text-neutral-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const rowId = String(row[rowKey])
                const isSelected = selectedRows.has(rowId)

                return (
                  <tr
                    key={rowId}
                    className={cn(
                      'hover:bg-neutral-50 transition-colors',
                      isSelected && 'bg-primary-50',
                    )}
                  >
                    {selectable && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(row)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const value = row[col.key as keyof T]
                      const rendered =
                        col.render?.(value, row, rowIndex) ?? value ?? '—'

                      return (
                        <td
                          key={String(col.key)}
                          className={cn(
                            'px-6 py-4 text-sm text-neutral-900',
                            col.align === 'center' && 'text-center',
                            col.align === 'right' && 'text-right',
                          )}
                        >
                          {rendered}
                        </td>
                      )
                    })}
                    {(onEdit || onDelete || onView) && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onView && (
                            <button
                              onClick={() => onView(row)}
                              title="View"
                              className="p-1.5 hover:bg-neutral-200 rounded transition-colors"
                            >
                              <Eye className="w-4 h-4 text-neutral-600" />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              title="Edit"
                              className="p-1.5 hover:bg-neutral-200 rounded transition-colors"
                            >
                              <Edit className="w-4 h-4 text-neutral-600" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              title="Delete"
                              className="p-1.5 hover:bg-red-100 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="text-sm text-neutral-600">
            Showing {pagination.offset + 1} to{' '}
            {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
            {pagination.total}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPaginationChange?.(0)}
              disabled={currentPage === 1}
              className="p-2 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="p-2 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum = i + 1
                if (currentPage > 3 && totalPages > 5) {
                  pageNum = currentPage - 2 + i
                }
                if (pageNum > totalPages) return null

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPaginationChange?.((pageNum - 1) * pagination.limit)}
                    className={cn(
                      'w-8 h-8 rounded text-sm font-medium transition-colors',
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-neutral-200',
                    )}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onPaginationChange?.((totalPages - 1) * pagination.limit)}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
