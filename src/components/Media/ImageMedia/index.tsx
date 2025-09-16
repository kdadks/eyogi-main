'use client'

import type { StaticImageData } from 'next/image'

import { cn } from 'src/utilities/cn'
import NextImage from 'next/image'
import React from 'react'

import type { Props as MediaProps } from '../types'

import { cssVariables } from '@/cssVariables'

const { breakpoints } = cssVariables

// A base64 encoded image to use as a placeholder while the image is loading
const placeholderBlur =
  'data:image/png;base64,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'

export const ImageMedia: React.FC<MediaProps> = (props) => {
  const {
    alt: altFromProps,
    fill: _fill,
    imgClassName,
    priority,
    resource,
    size: sizeFromProps,
    src: srcFromProps,
    loading: loadingFromProps,
  } = props

  let _width: number | undefined
  let _height: number | undefined
  let alt = altFromProps
  let src: StaticImageData | string = srcFromProps || ''

  if (!src && resource && typeof resource === 'object') {
    const {
      alt: altFromResource,
      filename: _fullFilename,
      height: fullHeight,
      url,
      width: fullWidth,
    } = resource

    _width = fullWidth!
    _height = fullHeight!
    alt = altFromResource || ''

    // 📊 IMAGE SOURCE DETECTION
    let imageSource = 'unknown'

    // Handle different URL formats
    if (url) {
      // If URL starts with /api/media (Payload API endpoint), prefix with base URL
      if (url.startsWith('/api/media/')) {
        imageSource = 'PayloadCMS_API_Endpoint'
        const baseUrl =
          typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SERVER_URL ||
              (process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000')
        src = `${baseUrl}${url}`

        console.log('🔗 PayloadCMS API Image:', {
          originalUrl: url,
          finalSrc: src,
          baseUrl,
          source: imageSource,
        })
      }
      // If URL starts with http (UploadThing URL), use as-is
      else if (url.startsWith('http')) {
        if (url.includes('uploadthing')) {
          imageSource = 'UploadThing_CDN'
        } else {
          imageSource = 'External_HTTP_URL'
        }
        src = url

        console.log('🌐 External Image:', {
          url: src,
          source: imageSource,
          isUploadThing: url.includes('uploadthing'),
        })
      }
      // For any other format, use as-is
      else {
        imageSource = 'Local_or_Relative_Path'
        src = url

        console.log('📁 Local Image:', {
          url: src,
          source: imageSource,
        })
      }

      // Track image source globally using sessionStorage
      if (typeof window !== 'undefined') {
        try {
          const statsKey = 'imageSourceStats'
          const currentStats = JSON.parse(sessionStorage.getItem(statsKey) || '{}')

          const stats = {
            payloadCMS: currentStats.payloadCMS || 0,
            uploadThing: currentStats.uploadThing || 0,
            external: currentStats.external || 0,
            local: currentStats.local || 0,
            unknown: currentStats.unknown || 0,
          }

          switch (imageSource) {
            case 'PayloadCMS_API_Endpoint':
              stats.payloadCMS++
              break
            case 'UploadThing_CDN':
              stats.uploadThing++
              break
            case 'External_HTTP_URL':
              stats.external++
              break
            case 'Local_or_Relative_Path':
              stats.local++
              break
            default:
              stats.unknown++
          }

          sessionStorage.setItem(statsKey, JSON.stringify(stats))
          console.log('📊 RUNNING IMAGE STATS:', stats)
        } catch (_e) {
          // Ignore storage errors
        }
      }
    }
  }

  const loading = loadingFromProps || (!priority ? 'lazy' : undefined)

  // If we don't have a valid src, show placeholder
  if (!src || src === '') {
    return (
      <div
        className={cn(
          'bg-gray-200 flex items-center justify-center relative overflow-hidden',
          imgClassName,
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300"></div>
        <div className="relative z-10 text-center p-4">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-gray-500 text-sm">Image Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <NextImage
      alt={alt || ''}
      className={cn(imgClassName)}
      fill
      placeholder="blur"
      blurDataURL={placeholderBlur}
      priority={priority}
      quality={100}
      loading={loading}
      sizes={
        sizeFromProps ||
        Object.entries(breakpoints)
          .map(([, value]) => `(max-width: ${value}px) ${value * 2}w`)
          .join(', ')
      }
      src={src}
      onError={() => {
        // Handle image loading errors gracefully
        console.warn('Failed to load image:', src)
      }}
    />
  )
}
