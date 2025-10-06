'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

interface GalleryImage {
  media: Media | string
  caption?: string
  alt?: string
  featured?: boolean
  order?: number
}

export interface GalleryBlockProps {
  title?: string
  description?: string
  layout?: 'grid' | 'masonry' | 'carousel' | 'slideshow'
  columns?: '2' | '3' | '4' | '5'
  aspectRatio?: 'auto' | 'square' | 'landscape' | 'portrait'
  images: GalleryImage[]
  enableLightbox?: boolean
  showCaptions?: boolean
  lazyLoad?: boolean
  spacing?: 'tight' | 'normal' | 'loose'
  rounded?: boolean
  shadow?: boolean
  className?: string
}

export default function GalleryBlock({
  title,
  description,
  layout = 'grid',
  columns = '3',
  aspectRatio = 'auto',
  images = [],
  enableLightbox = true,
  showCaptions = true,
  lazyLoad = true,
  spacing = 'normal',
  rounded = true,
  shadow = false,
  className,
}: GalleryBlockProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Filter and sort images
  const processedImages = images
    .filter((item) => item.media)
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  if (processedImages.length === 0) return null

  // Spacing classes
  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-4',
    loose: 'gap-8',
  }

  // Grid column classes
  const gridClasses = {
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    '5': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  }

  // Aspect ratio classes
  const aspectClasses = {
    auto: '',
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
  }

  // Render single image
  const renderImage = (item: GalleryImage, index: number) => {
    const mediaObj = typeof item.media === 'object' ? item.media : null
    if (!mediaObj) return null

    const imageAlt = item.alt || mediaObj.alt || mediaObj.filename || 'Gallery image'
    const imageUrl = mediaObj.url || ''

    return (
      <div
        key={`${mediaObj.id}-${index}`}
        className={cn(
          'relative overflow-hidden cursor-pointer group',
          aspectRatio !== 'auto' && aspectClasses[aspectRatio],
          rounded && 'rounded-lg',
          shadow && 'shadow-lg hover:shadow-xl transition-shadow',
        )}
        onClick={() => enableLightbox && setLightboxIndex(index)}
      >
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill={aspectRatio !== 'auto'}
          width={aspectRatio === 'auto' ? mediaObj.width || 800 : undefined}
          height={aspectRatio === 'auto' ? mediaObj.height || 600 : undefined}
          className={cn(
            'transition-transform duration-300',
            aspectRatio !== 'auto' ? 'object-cover w-full h-full' : 'w-full h-auto',
            enableLightbox && 'group-hover:scale-105',
          )}
          loading={lazyLoad ? 'lazy' : 'eager'}
        />

        {/* Featured badge */}
        {item.featured && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
            Featured
          </div>
        )}

        {/* Caption overlay */}
        {showCaptions && item.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white text-sm">{item.caption}</p>
          </div>
        )}
      </div>
    )
  }

  // Grid layout
  const renderGrid = () => (
    <div className={cn('grid', gridClasses[columns], spacingClasses[spacing])}>
      {processedImages.map((item, index) => renderImage(item, index))}
    </div>
  )

  // Masonry layout (simplified)
  const renderMasonry = () => (
    <div
      className={cn('columns-1 md:columns-2 lg:columns-3 xl:columns-4', spacingClasses[spacing])}
    >
      {processedImages.map((item, index) => (
        <div key={index} className="break-inside-avoid mb-4">
          {renderImage(item, index)}
        </div>
      ))}
    </div>
  )

  // Carousel layout
  const renderCarousel = () => (
    <div className="relative">
      <div className="overflow-x-auto">
        <div className={cn('flex', spacingClasses[spacing])}>
          {processedImages.map((item, index) => (
            <div key={index} className="flex-none w-64 md:w-80">
              {renderImage(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Slideshow layout
  const renderSlideshow = () => (
    <div className="relative">
      <div className="relative overflow-hidden rounded-lg">
        {processedImages.map((item, index) => (
          <div
            key={index}
            className={cn(
              'transition-transform duration-500 ease-in-out',
              index === currentSlide
                ? 'translate-x-0'
                : 'translate-x-full absolute top-0 left-0 w-full',
            )}
          >
            {renderImage(item, index)}
          </div>
        ))}
      </div>

      {/* Navigation */}
      {processedImages.length > 1 && (
        <>
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev === 0 ? processedImages.length - 1 : prev - 1))
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev === processedImages.length - 1 ? 0 : prev + 1))
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {processedImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentSlide ? 'bg-white' : 'bg-white/50',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )

  // Render layout
  const renderLayout = () => {
    switch (layout) {
      case 'masonry':
        return renderMasonry()
      case 'carousel':
        return renderCarousel()
      case 'slideshow':
        return renderSlideshow()
      default:
        return renderGrid()
    }
  }

  return (
    <>
      <div className={cn('gallery-block', className)}>
        {/* Header */}
        {(title || description) && (
          <div className="mb-6 text-center">
            {title && <h3 className="text-2xl font-bold mb-2">{title}</h3>}
            {description && <p className="text-gray-600">{description}</p>}
          </div>
        )}

        {/* Gallery */}
        {renderLayout()}

        {/* Image count */}
        <div className="mt-4 text-sm text-gray-500 text-center">
          {processedImages.length} image{processedImages.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Lightbox */}
      {enableLightbox && lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-full max-h-full">
            {/* Close button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation */}
            {processedImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((prev) =>
                      prev === null ? 0 : prev === 0 ? processedImages.length - 1 : prev - 1,
                    )
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-2xl hover:text-gray-300 transition-colors z-10"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((prev) =>
                      prev === null ? 0 : prev === processedImages.length - 1 ? 0 : prev + 1,
                    )
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-2xl hover:text-gray-300 transition-colors z-10"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Image */}
            {(() => {
              const item = processedImages[lightboxIndex]
              const mediaObj = typeof item?.media === 'object' ? item.media : null
              if (!mediaObj) return null

              return (
                <div className="text-center">
                  <Image
                    src={mediaObj.url || ''}
                    alt={item.alt || mediaObj.alt || mediaObj.filename || 'Gallery image'}
                    width={mediaObj.width || 1200}
                    height={mediaObj.height || 900}
                    className="max-w-full max-h-full object-contain"
                  />
                  {/* Caption */}
                  {showCaptions && item.caption && (
                    <p className="text-white text-center mt-4 px-4">{item.caption}</p>
                  )}
                  {/* Counter */}
                  <p className="text-white/70 text-sm mt-2">
                    {lightboxIndex + 1} of {processedImages.length}
                  </p>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
}
