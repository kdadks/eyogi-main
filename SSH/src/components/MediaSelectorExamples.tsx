'use client'

import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader } from './ui/Card'
import MediaSelectorButton from './MediaSelectorButton'
import type { MediaFile } from '../lib/api/media'

/**
 * Example component showing different ways to use MediaSelector
 */
export default function MediaSelectorExamples() {
  const [selectedImage, setSelectedImage] = useState<MediaFile[]>([])
  const [selectedImages, setSelectedImages] = useState<MediaFile[]>([])
  const [selectedVideo, setSelectedVideo] = useState<MediaFile[]>([])
  const [selectedDocument, setSelectedDocument] = useState<MediaFile[]>([])
  const [featuredMedia, setFeaturedMedia] = useState<MediaFile[]>([])
  const [galleryImages, setGalleryImages] = useState<MediaFile[]>([])

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">MediaSelector Examples</h1>
        <p className="text-gray-600 mb-6">
          Different ways to integrate media selection in your forms and content management.
        </p>
      </div>

      {/* Basic Examples */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Basic Usage</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Single Image Selection */}
          <div>
            <h3 className="font-medium mb-3">Single Image Selection</h3>
            <MediaSelectorButton
              accept={['image/*']}
              multiple={false}
              onSelect={setSelectedImage}
              buttonText="Select Featured Image"
              variant="field"
              label="Featured Image"
              placeholder="Click to select an image"
              showPreview
            />
            {selectedImage.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {selectedImage[0].title || selectedImage[0].original_name}
              </div>
            )}
          </div>

          {/* Multiple Images */}
          <div>
            <h3 className="font-medium mb-3">Multiple Images (Max 5)</h3>
            <MediaSelectorButton
              accept={['image/*']}
              multiple
              maxSelection={5}
              onSelect={setSelectedImages}
              buttonText="Select Images"
              variant="field"
              label="Gallery Images"
              placeholder="Select up to 5 images for the gallery"
              showPreview
              showFileSize
            />
            {selectedImages.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Selected {selectedImages.length} image(s)
              </div>
            )}
          </div>

          {/* Video Selection */}
          <div>
            <h3 className="font-medium mb-3">Video Selection</h3>
            <MediaSelectorButton
              accept={['video/*']}
              multiple={false}
              onSelect={setSelectedVideo}
              buttonText="Select Video"
              variant="button"
            />
            {selectedVideo.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {selectedVideo[0].title || selectedVideo[0].original_name}
              </div>
            )}
          </div>

          {/* Document Selection */}
          <div>
            <h3 className="font-medium mb-3">Document Selection</h3>
            <MediaSelectorButton
              accept={['document']}
              multiple={false}
              onSelect={setSelectedDocument}
              buttonText="Select Document"
              variant="compact"
            />
            {selectedDocument.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {selectedDocument[0].title || selectedDocument[0].original_name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Integration Examples */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Form Integration</h2>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Article Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter article title"
              />
            </div>

            <MediaSelectorButton
              accept={['image/*']}
              multiple={false}
              onSelect={setFeaturedMedia}
              variant="field"
              label="Featured Image"
              placeholder="Select a featured image for this article"
              required
              showPreview
            />
            {featuredMedia.length > 0 && (
              <div className="text-sm text-gray-600">
                Featured image: {featuredMedia[0].title || featuredMedia[0].original_name}
              </div>
            )}

            <MediaSelectorButton
              accept={['image/*']}
              multiple
              maxSelection={10}
              onSelect={setGalleryImages}
              variant="field"
              label="Gallery Images"
              placeholder="Add images to the article gallery"
              showPreview
              showFileSize
            />
            {galleryImages.length > 0 && (
              <div className="text-sm text-gray-600">
                Gallery: {galleryImages.length} image(s) selected
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Content
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Write your article content here..."
              />
            </div>

            <div className="flex space-x-4">
              <Button type="button" variant="primary">
                Save Article
              </Button>
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Integration Patterns */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Integration Patterns</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Pattern 1: Inline Button */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Inline Button</h4>
              <p className="text-sm text-gray-600 mb-3">Simple button for basic media selection</p>
              <MediaSelectorButton
                accept={['image/*']}
                buttonText="Choose Image"
                variant="button"
                size="sm"
                onSelect={() => {}}
              />
            </div>

            {/* Pattern 2: Field Style */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Form Field</h4>
              <p className="text-sm text-gray-600 mb-3">Integrated form field with preview</p>
              <MediaSelectorButton
                accept={['image/*']}
                variant="field"
                label="Background Image"
                showPreview
                onSelect={() => {}}
              />
            </div>

            {/* Pattern 3: Compact Style */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Compact Style</h4>
              <p className="text-sm text-gray-600 mb-3">Minimal space usage with badge display</p>
              <div className="flex items-center space-x-2">
                <span className="text-sm">Attachments:</span>
                <MediaSelectorButton
                  multiple
                  maxSelection={3}
                  variant="compact"
                  onSelect={() => {}}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Code Examples */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Code Examples</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Single Image Selection</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`<MediaSelectorButton
  accept={['image/*']}
  multiple={false}
  onSelect={setSelectedImage}
  variant="field"
  label="Featured Image"
  showPreview
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Multiple Files with Restrictions</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`<MediaSelectorButton
  accept={['image/*', 'video/*']}
  multiple
  maxSelection={5}
  onSelect={setSelectedFiles}
  variant="field"
  label="Media Gallery"
  showFileSize
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Using the Hook Directly</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`import { useMediaSelector } from '../hooks/useMediaSelector'

const { selectedFiles, isOpen, openSelector, handleSelect } = useMediaSelector({
  multiple: true,
  maxSelection: 10,
  accept: ['image/*'],
  onSelect: (files) => console.log('Selected:', files)
})

return (
  <>
    <Button onClick={openSelector}>Select Media</Button>
    {isOpen && (
      <MediaSelector
        multiple
        maxSelection={10}
        accept={['image/*']}
        onSelect={handleSelect}
        onClose={() => setIsOpen(false)}
      />
    )}
  </>
)`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
