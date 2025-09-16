'use client'

import { cn } from 'src/utilities/cn'
import React, { useEffect, useRef } from 'react'

import type { Props as MediaProps } from '../types'

export const VideoMedia: React.FC<MediaProps> = (props) => {
  const { onClick, resource, videoClassName } = props

  const videoRef = useRef<HTMLVideoElement>(null)
  // const [showFallback] = useState<boolean>()

  useEffect(() => {
    const { current: video } = videoRef
    if (video) {
      video.addEventListener('suspend', () => {
        // setShowFallback(true);
        // console.warn('Video was suspended, rendering fallback image.')
      })
    }
  }, [])

  if (resource && typeof resource === 'object') {
    const { url } = resource

    // Handle different URL formats
    let videoSrc = ''
    if (url) {
      // If URL starts with /api/media (Payload API endpoint), prefix with base URL
      if (url.startsWith('/api/media/')) {
        videoSrc = `https://eyogimain.netlify.app${url}`
      }
      // If URL starts with http (UploadThing URL), use as-is
      else if (url.startsWith('http')) {
        videoSrc = url
      }
      // For any other format, use as-is
      else {
        videoSrc = url
      }
    }

    return (
      <video
        autoPlay
        className={cn(videoClassName)}
        controls={false}
        loop
        muted
        onClick={onClick}
        playsInline
        ref={videoRef}
      >
        <source src={videoSrc} />
      </video>
    )
  }

  return null
}
