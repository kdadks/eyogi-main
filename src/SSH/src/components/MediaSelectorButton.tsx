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
}: MediaSelectorButtonProps) {
  const { selectedFiles, isOpen, openSelector, closeSelector, handleSelect, clearSelection } =
    useMediaSelector({ multiple, maxSelection, accept, onSelect })

  const hasSelection = selectedFiles.length > 0
  const totalSize = getSelectedFilesSize(selectedFiles)

  // Button variant rendering
  if (variant === 'button') {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <Button variant={hasSelection ? 'secondary' : 'outline'} size={size} onClick={openSelector}>
          <Plus className="h-4 w-4 mr-2" />
          {hasSelection ? formatSelectedMedia(selectedFiles) : buttonText}
        </Button>

        {hasSelection && showClearButton && (
          <Button variant="ghost" size="sm" onClick={clearSelection}>
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
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={openSelector}>
            <Plus className="h-3 w-3 mr-1" />
            Add
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
            {/* Selected files preview */}
            {showPreview && selectedFiles.length <= 3 ? (
              <div className="space-y-2">
                {selectedFiles.map((file) => (
                  <div key={file.id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      {file.file_category === 'image' ? (
                        <img
                          src={getThumbnailUrl(file)}
                          alt={file.alt_text || file.title || file.original_name}
                          className="w-full h-full object-cover rounded"
                        />
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatSelectedMedia(selectedFiles)}
                  </div>
                  {showFileSize && (
                    <div className="text-xs text-gray-500">{formatFileSize(totalSize)}</div>
                  )}
                </div>

                {showPreview && selectedFiles.length === 1 && (
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                    {selectedFiles[0].file_category === 'image' ? (
                      <img
                        src={getThumbnailUrl(selectedFiles[0])}
                        alt={
                          selectedFiles[0].alt_text ||
                          selectedFiles[0].title ||
                          selectedFiles[0].original_name
                        }
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <FileIcon type={selectedFiles[0].file_category} />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-2 mt-3">
              <Button variant="outline" size="sm" onClick={openSelector}>
                <Eye className="h-3 w-3 mr-1" />
                {multiple ? 'Change' : 'Replace'}
              </Button>
              {showClearButton && (
                <Button variant="ghost" size="sm" onClick={clearSelection}>
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
