'use client'

import React from 'react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Image, Video, Music, FileText, Plus, X, Eye } from 'lucide-react'
import MediaSelector from './MediaSelector'
import {
  useMediaSelector,
  formatSelectedMedia,
  getSelectedFilesSize,
  type UseMediaSelectorOptions,
} from '../hooks/useMediaSelector'
import { formatFileSize, getThumbnailUrl } from '../lib/api/media'

interface MediaSelectorButtonProps extends UseMediaSelectorOptions {
  // Appearance
  variant?: 'button' | 'field' | 'compact'
  size?: 'sm' | 'md' | 'lg'

  // Labels
  buttonText?: string
  placeholder?: string

  // Display options
  showPreview?: boolean
  showFileSize?: boolean
  showClearButton?: boolean

  // Styling
  className?: string

  // Field-specific props (when variant='field')
  label?: string
  error?: string
  required?: boolean

  // Value prop for displaying existing URL
  value?: string | null
}

export default function MediaSelectorButton({
  multiple = false,
  maxSelection,
  accept,
  onSelect,

  variant = 'button',
  size = 'md',

  buttonText = 'Select Media',
  placeholder = 'No media selected',

  showPreview = true,
  showFileSize = false,
  showClearButton = true,

  className = '',

  label,
  error,
  required = false,
  value,
}: MediaSelectorButtonProps) {
  const { selectedFiles, isOpen, openSelector, closeSelector, handleSelect, clearSelection } =
    useMediaSelector({ multiple, maxSelection, accept, onSelect })

  // Use selectedFiles if available, otherwise fall back to value prop
  const hasSelection = selectedFiles.length > 0 || (value && value.trim() !== '')
  const displayUrl = selectedFiles.length > 0 ? selectedFiles[0].file_url : value
  const totalSize = getSelectedFilesSize(selectedFiles)

  // Button variant rendering
  if (variant === 'button') {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <Button
          type="button"
          variant={hasSelection ? 'secondary' : 'outline'}
          size={size}
          onClick={openSelector}
        >
          <Plus className="h-4 w-4 mr-2" />
          {hasSelection ? formatSelectedMedia(selectedFiles) : buttonText}
        </Button>

        {hasSelection && showClearButton && (
          <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
            <X className="h-4 w-4" />
          </Button>
        )}

        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <MediaSelector
                multiple={multiple}
                maxSelection={maxSelection}
                accept={accept}
                onSelect={handleSelect}
                onClose={closeSelector}
                initialSelection={selectedFiles}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {hasSelection ? (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
            </Badge>
            {showClearButton && (
              <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={openSelector}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
          >
            {buttonText}
          </Button>
        )}

        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden">
              <MediaSelector
                multiple={multiple}
                maxSelection={maxSelection}
                accept={accept}
                onSelect={handleSelect}
                onClose={closeSelector}
                initialSelection={selectedFiles}
                compact
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Field variant (form field style)
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`border rounded-md overflow-hidden ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      >
        {hasSelection ? (
          <div className="p-3">
            {/* Show preview for selected files or value prop */}
            {showPreview && (selectedFiles.length > 0 || displayUrl) ? (
              selectedFiles.length > 0 ? (
                // Display selected files from MediaSelector
                <div className="space-y-2">
                  {selectedFiles.map((file) => (
                    <div key={file.id} className="flex items-center space-x-3">
                      <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 border border-gray-200">
                        {file.file_category === 'image' ? (
                          <img
                            src={getThumbnailUrl(file)}
                            alt={file.alt_text || file.title || file.original_name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : file.file_category === 'video' ? (
                          <div className="relative w-full h-full">
                            <video
                              src={file.file_url}
                              className="w-full h-full object-cover rounded"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
                              <svg
                                className="w-8 h-8 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <FileIcon type={file.file_category} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {file.title || file.original_name}
                        </div>
                        {showFileSize && (
                          <div className="text-xs text-gray-500">
                            {formatFileSize(file.file_size)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {selectedFiles.length > 1 && showFileSize && (
                    <div className="text-xs text-gray-500 border-t pt-2">
                      Total: {formatFileSize(totalSize)}
                    </div>
                  )}
                </div>
              ) : (
                // Display existing value prop (URL)
                <div className="flex items-center space-x-3">
                  <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 border border-gray-200">
                    {displayUrl &&
                      (displayUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                        <div className="relative w-full h-full">
                          <video src={displayUrl} className="w-full h-full object-cover rounded" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={displayUrl}
                          alt="Selected media"
                          className="w-full h-full object-cover rounded"
                        />
                      ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">Current media</div>
                  </div>
                </div>
              )
            ) : null}

            {/* Action buttons */}
            <div className="flex items-center space-x-2 mt-3">
              <Button type="button" variant="outline" size="sm" onClick={openSelector}>
                <Eye className="h-3 w-3 mr-1" />
                {multiple ? 'Change' : 'Replace'}
              </Button>
              {showClearButton && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearSelection()
                    // Also notify parent that value was cleared
                    if (onSelect) {
                      onSelect([])
                    }
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openSelector}
            className="w-full p-4 text-left border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
          >
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Plus className="h-5 w-5" />
              <span>{placeholder}</span>
            </div>
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <MediaSelector
              multiple={multiple}
              maxSelection={maxSelection}
              accept={accept}
              onSelect={handleSelect}
              onClose={closeSelector}
              initialSelection={selectedFiles}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component for file type icons
function FileIcon({ type }: { type: string }) {
  switch (type) {
    case 'image':
      return <Image className="h-5 w-5 text-blue-500" />
    case 'video':
      return <Video className="h-5 w-5 text-purple-500" />
    case 'audio':
      return <Music className="h-5 w-5 text-green-500" />
    default:
      return <FileText className="h-5 w-5 text-gray-500" />
  }
}
