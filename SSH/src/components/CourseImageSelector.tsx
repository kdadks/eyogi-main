'use client'

import React from 'react'
import MediaSelectorButton from './MediaSelectorButton'
import { MediaFile } from '../lib/api/media'

interface CourseImageSelectorProps {
  coverImageUrl?: string | null
  videoPreviewUrl?: string | null
  onCoverImageSelect: (files: MediaFile[]) => void
  onVideoPreviewSelect: (files: MediaFile[]) => void
  showVideoPreview?: boolean
}

export default function CourseImageSelector({
  coverImageUrl,
  videoPreviewUrl,
  onCoverImageSelect,
  onVideoPreviewSelect,
  showVideoPreview = true,
}: CourseImageSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cover Image */}
        <MediaSelectorButton
          label="Cover Image"
          accept={['image/*']}
          variant="field"
          value={coverImageUrl || null}
          onSelect={(files) => {
            onCoverImageSelect(files)
          }}
          placeholder="Select course cover image"
          showPreview
          size="sm"
          required
        />

        {/* Video Preview */}
        {showVideoPreview && (
          <MediaSelectorButton
            label="Video Preview (Optional)"
            accept={['video/*']}
            variant="field"
            value={videoPreviewUrl || null}
            onSelect={(files) => {
              onVideoPreviewSelect(files)
            }}
            placeholder="Select preview video"
            showPreview
            size="sm"
          />
        )}
      </div>
    </div>
  )
}
