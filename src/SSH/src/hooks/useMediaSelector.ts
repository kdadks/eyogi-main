import { useState, useCallback } from 'react'
import type { MediaFile } from '../lib/api/media'

export interface UseMediaSelectorOptions {
  multiple?: boolean
  maxSelection?: number
  accept?: string[]
  onSelect?: (files: MediaFile[]) => void
}

export interface UseMediaSelectorReturn {
  selectedFiles: MediaFile[]
  isOpen: boolean
  openSelector: () => void
  closeSelector: () => void
  handleSelect: (files: MediaFile[]) => void
  clearSelection: () => void
}

/**
 * Hook for managing MediaSelector state and interactions
 */
export function useMediaSelector(options: UseMediaSelectorOptions = {}): UseMediaSelectorReturn {
  const { onSelect } = options
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const openSelector = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeSelector = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleSelect = useCallback(
    (files: MediaFile[]) => {
      setSelectedFiles(files)
      setIsOpen(false)
      onSelect?.(files)
    },
    [onSelect],
  )

  const clearSelection = useCallback(() => {
    setSelectedFiles([])
  }, [])

  return {
    selectedFiles,
    isOpen,
    openSelector,
    closeSelector,
    handleSelect,
    clearSelection,
  }
}

/**
 * Utility function to format selected media files for display
 */
export function formatSelectedMedia(files: MediaFile[]): string {
  if (files.length === 0) return 'No files selected'
  if (files.length === 1) return files[0].title || files[0].original_name
  return `${files.length} files selected`
}

/**
 * Utility function to get total size of selected files
 */
export function getSelectedFilesSize(files: MediaFile[]): number {
  return files.reduce((total, file) => total + file.file_size, 0)
}

/**
 * Utility function to check if selected files meet criteria
 */
export function validateSelection(
  files: MediaFile[],
  options: {
    maxSelection?: number
    maxTotalSize?: number // in bytes
    allowedTypes?: string[]
  },
): { valid: boolean; error?: string } {
  const { maxSelection, maxTotalSize, allowedTypes } = options

  if (maxSelection && files.length > maxSelection) {
    return {
      valid: false,
      error: `Maximum ${maxSelection} files allowed`,
    }
  }

  if (maxTotalSize) {
    const totalSize = getSelectedFilesSize(files)
    if (totalSize > maxTotalSize) {
      return {
        valid: false,
        error: `Total file size exceeds limit`,
      }
    }
  }

  if (allowedTypes && allowedTypes.length > 0) {
    const invalidFiles = files.filter(
      (file) =>
        !allowedTypes.some((type) => {
          if (type.endsWith('/*')) {
            return file.mime_type.startsWith(type.replace('/*', '/'))
          }
          return file.mime_type === type || file.file_category === type
        }),
    )

    if (invalidFiles.length > 0) {
      return {
        valid: false,
        error: `Some files are not allowed: ${invalidFiles.map((f) => f.original_name).join(', ')}`,
      }
    }
  }

  return { valid: true }
}
