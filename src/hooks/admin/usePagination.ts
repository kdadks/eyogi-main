
import React from 'react'

export function usePagination(total: number, pageSize: number = 10) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [offset, setOffset] = React.useState(0)

  const totalPages = Math.ceil(total / pageSize)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setOffset((page - 1) * pageSize)
    }
  }

  const handleNextPage = () => {
    handlePageChange(currentPage + 1)
  }

  const handlePrevPage = () => {
    handlePageChange(currentPage - 1)
  }

  const handleFirstPage = () => {
    handlePageChange(1)
  }

  const handleLastPage = () => {
    handlePageChange(totalPages)
  }

  return {
    currentPage,
    totalPages,
    offset,
    pageSize,
    handlePageChange,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handleLastPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}
