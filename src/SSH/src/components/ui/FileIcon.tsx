import React from 'react'

interface FileIconProps {
  fileType: string
  className?: string
  size?: number
}

export const FileIcon: React.FC<FileIconProps> = ({ fileType, className = '', size = 48 }) => {
  const getFileInfo = (mimeType: string) => {
    // Images
    if (mimeType.startsWith('image/')) {
      return { extension: 'IMG', color: 'bg-green-500', textColor: 'text-white' }
    }

    // Videos
    if (mimeType.startsWith('video/')) {
      return { extension: 'MP4', color: 'bg-red-500', textColor: 'text-white' }
    }

    // Audio
    if (mimeType.startsWith('audio/')) {
      return { extension: 'MP3', color: 'bg-purple-500', textColor: 'text-white' }
    }

    // PDFs
    if (mimeType.includes('pdf')) {
      return { extension: 'PDF', color: 'bg-red-600', textColor: 'text-white' }
    }

    // Microsoft Word documents
    if (
      mimeType.includes('word') ||
      mimeType.includes('document') ||
      mimeType.includes('msword') ||
      mimeType.includes('wordprocessingml')
    ) {
      return { extension: 'DOC', color: 'bg-blue-600', textColor: 'text-white' }
    }

    // Excel spreadsheets
    if (
      mimeType.includes('sheet') ||
      mimeType.includes('excel') ||
      mimeType.includes('spreadsheetml') ||
      mimeType.includes('ms-excel')
    ) {
      return { extension: 'XLS', color: 'bg-green-600', textColor: 'text-white' }
    }

    // PowerPoint presentations
    if (
      mimeType.includes('presentation') ||
      mimeType.includes('powerpoint') ||
      mimeType.includes('presentationml') ||
      mimeType.includes('ms-powerpoint')
    ) {
      return { extension: 'PPT', color: 'bg-orange-600', textColor: 'text-white' }
    }

    // Text files
    if (mimeType.startsWith('text/')) {
      return { extension: 'TXT', color: 'bg-gray-500', textColor: 'text-white' }
    }

    // ZIP/Archive files
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) {
      return { extension: 'ZIP', color: 'bg-yellow-600', textColor: 'text-white' }
    }

    // Default for unknown types
    return { extension: 'FILE', color: 'bg-gray-400', textColor: 'text-white' }
  }

  const { extension, color, textColor } = getFileInfo(fileType)

  // Calculate responsive sizing
  const iconSize = size || 48
  const fontSize = Math.max(8, Math.min(12, iconSize * 0.25))
  const cornerRadius = Math.max(2, iconSize * 0.08)

  return (
    <div
      className={`relative flex flex-col items-center justify-center ${color} ${textColor} font-bold shadow-lg ${className}`}
      style={{
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        borderRadius: `${cornerRadius}px`,
        fontSize: `${fontSize}px`,
      }}
      aria-label={`${getFileTypeLabel(fileType)} file`}
    >
      {/* File icon shape with folded corner */}
      <div
        className="absolute top-0 right-0 bg-white opacity-20"
        style={{
          width: `${iconSize * 0.2}px`,
          height: `${iconSize * 0.2}px`,
          clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
        }}
      />

      {/* File extension text */}
      <span className="font-bold leading-none tracking-tight">{extension}</span>
    </div>
  )
}

function getFileTypeLabel(fileType: string): string {
  if (fileType.startsWith('image/')) return 'Image'
  if (fileType.startsWith('video/')) return 'Video'
  if (fileType.startsWith('audio/')) return 'Audio'
  if (fileType.includes('pdf')) return 'PDF'
  if (fileType.includes('word') || fileType.includes('document')) return 'Word Document'
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'Excel Spreadsheet'
  if (fileType.includes('presentation') || fileType.includes('powerpoint'))
    return 'PowerPoint Presentation'
  if (fileType.startsWith('text/')) return 'Text'
  return 'File'
}

// Export for direct use in other components
export default FileIcon
