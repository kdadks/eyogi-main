import { cn } from '@/utilities/cn'
import React from 'react'

import type { Props as MediaProps } from '../types'


export const ImageMedia: React.FC<MediaProps> = (props) => {
  const {
    alt: altFromProps,
    fill: _fill,
    imgClassName,
    priority: _priority,
    resource,
    size: _sizeFromProps,
    src: srcFromProps,
    loading: loadingFromProps,
  } = props

  let _width: number | undefined
  let _height: number | undefined
  let alt = altFromProps
  let src: string = srcFromProps || ''

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
            : import.meta.env.VITE_APP_URL || 'http://localhost:3000'
        src = `${baseUrl}${url}`
      }
      // If URL starts with http (UploadThing URL), use as-is
      else if (url.startsWith('http')) {
        if (url.includes('uploadthing') || url.includes('ufs.sh')) {
          imageSource = 'UploadThing_CDN'
        } else {
          imageSource = 'External_HTTP_URL'
        }
        src = url
      }
      // For any other format, use as-is
      else {
        imageSource = 'Local_or_Relative_Path'
        src = url
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
        } catch (_e) {
          // Ignore storage errors
        }
      }
    }
  }

  const loading = loadingFromProps || (!_priority ? 'lazy' : undefined)

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
    <img
      alt={alt || ''}
      className={cn(imgClassName)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      loading={loading}
      src={src}
      onError={() => {
        // Handle image loading errors gracefully
      }}
    />
  )
}
