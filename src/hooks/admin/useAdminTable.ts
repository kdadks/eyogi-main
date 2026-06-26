
import React from 'react'

export interface UseTableOptions<T> {
  data: T[]
  rowKey?: keyof T
  pageSize?: number
}

export function useAdminTable<T extends Record<string, any>>({
  data,
  rowKey = 'id' as keyof T,
  pageSize = 10,
}: UseTableOptions<T>) {
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = React.useState(0)
  const [sortBy, setSortBy] = React.useState<string | null>(null)
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
    setCurrentPage(0) // Reset to first page
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(data.map((row) => String(row[rowKey])))
      setSelectedRows(allIds)
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (row: T, selected: boolean) => {
    const id = String(row[rowKey])
    const newSelected = new Set(selectedRows)
    if (selected) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)
  }

  const startIndex = currentPage * pageSize
  const paginatedData = data.slice(startIndex, startIndex + pageSize)

  return {
    selectedRows,
    handleSelectAll,
    handleSelectRow,
    currentPage,
    setCurrentPage,
    sortBy,
    sortOrder,
    handleSort,
    searchQuery,
    setSearchQuery,
    paginatedData,
    pageSize,
    totalItems: data.length,
  }
}
