import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import MediaSelector from '../MediaSelector'
import type { MediaFile } from '../../lib/api/media'

interface BackgroundStylingProps {
  bgType: 'color' | 'image'
  bgColor: string
  bgImageUrl: string | null | undefined
  onBgTypeChange: (type: 'color' | 'image') => void
  onBgColorChange: (color: string) => void
  onBgImageChange: (url: string | undefined) => void
  label?: string
  previewClassName?: string
}

export default function BackgroundStylingField({
  bgType,
  bgColor,
  bgImageUrl,
  onBgTypeChange,
  onBgColorChange,
  onBgImageChange,
  label = 'Background',
  previewClassName,
}: BackgroundStylingProps) {
  const [showMediaSelector, setShowMediaSelector] = useState(false)

  const handleImageSelect = (url: string) => {
    onBgImageChange(url)
    setShowMediaSelector(false)
  }

  React.useEffect(() => {
    // Component mounted or bgImageUrl changed
  }, [bgImageUrl])

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Background Type Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Background Type
            </label>
            <select
              value={bgType}
              onChange={(e) => onBgTypeChange(e.target.value as 'color' | 'image')}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="color">Color</option>
              <option value="image">Image</option>
            </select>
          </div>

          {/* Color Picker */}
          {bgType === 'color' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => onBgColorChange(e.target.value)}
                  className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-xs text-gray-600 flex-1">{bgColor}</span>
              </div>
            </div>
          )}

          {/* Image Selector */}
          {bgType === 'image' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Background Image
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowMediaSelector(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1"
                >
                  {bgImageUrl && String(bgImageUrl).trim() ? 'Change' : 'Select'}
                </Button>
                {bgImageUrl && String(bgImageUrl).trim() && (
                  <Button
                    onClick={() => onBgImageChange(undefined)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-1"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Image Preview - Full Width Below Grid */}
        {bgType === 'image' && bgImageUrl && String(bgImageUrl).trim() && (
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <div className="relative bg-gray-100" style={{ maxHeight: '200px' }}>
              <img
                src={String(bgImageUrl)}
                alt="Background preview"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        )}

        {/* Visual Preview of Actual Section Background */}
        {previewClassName && (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div
              className={`h-32 flex items-center justify-center text-white text-sm font-medium ${previewClassName}`}
            >
              Section Preview
            </div>
          </div>
        )}
      </div>

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Select Background Image</h3>
              <button
                onClick={() => setShowMediaSelector(false)}
                className="text-gray-500 hover:text-gray-700 font-bold text-xl"
              >
                ×
              </button>
            </div>
            <div className="px-4 py-3 overflow-y-auto flex-1">
              <MediaSelector
                accept={['image/*']}
                compact={true}
                showUpload={false}
                onSelect={(media: MediaFile[]) => {
                  if (media.length > 0) {
                    const imageUrl = media[0].file_url || media[0].watermark_url || ''
                    handleImageSelect(imageUrl)
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
