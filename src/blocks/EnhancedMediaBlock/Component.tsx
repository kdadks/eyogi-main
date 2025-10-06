'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

export interface EnhancedMediaBlockProps {
  media: Media | string
  size?: 'small' | 'medium' | 'large' | 'fullWidth'
  alignment?: 'left' | 'center' | 'right'
  caption?: string
  enableLightbox?: boolean
  alt?: string
  link?: {
    type: 'none' | 'internal' | 'external'
    internalLink?: { slug?: string; collection?: string }
    externalUrl?: string
    newTab?: boolean
  }
  lazy?: boolean
  className?: string
}

export default function EnhancedMediaBlock({
  media,
  size = 'medium',
  alignment = 'center',
  caption,
  enableLightbox = true,
  alt,
  link,
  lazy = true,
  className,
}: EnhancedMediaBlockProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Handle media object or string ID
  const mediaObj = typeof media === 'object' ? media : null
  if (!mediaObj) return null

  const mediaUrl = mediaObj.url || ''
  const mediaAlt = alt || mediaObj.alt || mediaObj.filename || 'Media'
  const isImage = mediaObj.mimeType?.startsWith('image/') || false
  const isVideo = mediaObj.mimeType?.startsWith('video/') || false
  const isAudio = mediaObj.mimeType?.startsWith('audio/') || false

  // Size classes
  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    fullWidth: 'w-full',
  }

  // Alignment classes
  const alignmentClasses = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  }

  // Container classes
  const containerClasses = cn(
    'media-block',
    sizeClasses[size],
    alignmentClasses[alignment],
    className,
  )

  // Media element
  const renderMedia = () => {
    if (isImage) {
      return (
        <div className="relative overflow-hidden rounded-lg">
          <Image
            src={mediaUrl}
            alt={mediaAlt}
            width={mediaObj.width || 800}
            height={mediaObj.height || 600}
            className={cn(
              'w-full h-auto object-cover transition-transform duration-300',
              enableLightbox && 'cursor-pointer hover:scale-105',
            )}
            loading={lazy ? 'lazy' : 'eager'}
            onClick={enableLightbox ? () => setLightboxOpen(true) : undefined}
          />
        </div>
      )
    }

    if (isVideo) {
      return (
        <div className="relative overflow-hidden rounded-lg">
          <video
            src={mediaUrl}
            controls
            className="w-full h-auto"
            preload={lazy ? 'metadata' : 'auto'}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (isAudio) {
      return (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">🎵</div>
          <audio src={mediaUrl} controls className="mx-auto" preload={lazy ? 'metadata' : 'auto'}>
            Your browser does not support the audio tag.
          </audio>
          {mediaObj.filename && <p className="text-sm text-gray-600 mt-2">{mediaObj.filename}</p>}
        </div>
      )
    }

    // Fallback for other file types
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">📎</div>
        <p className="font-medium">{mediaObj.filename}</p>
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Download
        </a>
      </div>
    )
  }

  // Wrap with link if specified
  const wrapWithLink = (content: React.ReactNode) => {
    if (!link || link.type === 'none') return content

    if (link.type === 'external' && link.externalUrl) {
      return (
        <a
          href={link.externalUrl}
          target={link.newTab ? '_blank' : '_self'}
          rel={link.newTab ? 'noopener noreferrer' : undefined}
          className="block"
        >
          {content}
        </a>
      )
    }

    if (link.type === 'internal' && link.internalLink) {
      const href = link.internalLink.slug
        ? `/${link.internalLink.collection || 'posts'}/${link.internalLink.slug}`
        : '#'

      return (
        <Link href={href} target={link.newTab ? '_blank' : '_self'} className="block">
          {content}
        </Link>
      )
    }

    return content
  }

  return (
    <>
      <figure className={containerClasses}>
        {wrapWithLink(renderMedia())}

        {caption && (
          <figcaption className="mt-3 text-sm text-gray-600 text-center italic">
            {caption}
          </figcaption>
        )}
      </figure>

      {/* Lightbox */}
      {lightboxOpen && isImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors z-10"
            >
              ✕
            </button>
            <Image
              src={mediaUrl}
              alt={mediaAlt}
              width={mediaObj.width || 1200}
              height={mediaObj.height || 900}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}
