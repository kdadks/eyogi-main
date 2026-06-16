import React, { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import toast from 'react-hot-toast'

interface TemplateImageUploadProps {
  onImageSelect: (imageData: { file: File; preview: string; width: number; height: number }) => void
  currentImage?: string
  disabled?: boolean
}

export default function TemplateImageUpload({
  onImageSelect,
  currentImage,
  disabled,
}: TemplateImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [imageDimensions, setImageDimensions] = useState<{
    width: number
    height: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB')
      return
    }

    setUploading(true)

    try {
      // Read file as data URL for preview
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setPreview(result)

        // Get image dimensions
        const img = new Image()
        img.onload = () => {
          setImageDimensions({
            width: img.width,
            height: img.height,
          })
          onImageSelect({
            file,
            preview: result,
            width: img.width,
            height: img.height,
          })
          toast.success('Image selected successfully')
        }
        img.onerror = () => {
          toast.error('Failed to load image')
        }
        img.src = result
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing image:', error)
      toast.error('Failed to process image')
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setPreview(null)
    setImageDimensions(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />

      {preview ? (
        <div className="space-y-3">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
            <img
              src={preview}
              alt="Template preview"
              className="w-full h-auto max-h-96 object-contain"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
              title="Remove image"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {imageDimensions && (
            <div className="text-sm text-gray-600">
              <p>
                <strong>Dimensions:</strong> {imageDimensions.width}px × {imageDimensions.height}px
              </p>
              <p className="mt-1">
                <strong>Aspect Ratio:</strong>{' '}
                {(imageDimensions.width / imageDimensions.height).toFixed(2)}:1
              </p>
              <p className="text-xs mt-2 text-gray-500">
                Recommended: 2480×1748px (A4 Landscape at 300 DPI) or 1920×1440px (HD)
              </p>
            </div>
          )}

          <Button
            onClick={handleClear}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={uploading}
          >
            Change Image
          </Button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center justify-center">
            <PhotoIcon className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">
              {uploading ? 'Processing image...' : 'Click to upload certificate template'}
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG, GIF up to 10MB</p>
            <p className="text-xs text-gray-500 mt-2">Recommended: 2480×1748px (A4 Landscape)</p>
          </div>
        </button>
      )}
    </div>
  )
}
