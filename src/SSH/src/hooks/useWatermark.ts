import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface WatermarkOptions {
  opacity?: number
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
  margin?: number
  maxSize?: number
}

export interface WatermarkResult {
  mediaId: string
  success: boolean
  error?: string
  message?: string
}

interface UseWatermarkReturn {
  watermarkFiles: (mediaIds: string[], options?: WatermarkOptions) => Promise<WatermarkResult[]>
  previewWatermark: (file: File, options?: WatermarkOptions) => Promise<string | null>
  loading: boolean
  error: string | null
}

/**
 * React hook for watermarking functionality
 */
export function useWatermark(): UseWatermarkReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Add watermarks to existing media files
   */
  const watermarkFiles = useCallback(
    async (mediaIds: string[], options: WatermarkOptions = {}): Promise<WatermarkResult[]> => {
      setLoading(true)
      setError(null)

      try {
        // Import the media API function
        const { watermarkMediaFiles } = await import('../lib/api/media')

        const results = await watermarkMediaFiles(mediaIds, options)

        // Show success/error toasts
        const successCount = results.filter((r: WatermarkResult) => r.success).length
        const failureCount = results.length - successCount

        if (successCount > 0) {
          toast.success(`Successfully watermarked ${successCount} file(s)`)
        }

        if (failureCount > 0) {
          toast.error(`Failed to watermark ${failureCount} file(s)`)
        }

        return results
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        toast.error(errorMessage)
        return []
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  /**
   * Generate watermark preview without saving
   */
  const previewWatermark = useCallback(
    async (file: File, options: WatermarkOptions = {}): Promise<string | null> => {
      setLoading(true)
      setError(null)

      try {
        // Convert file to ArrayBuffer and send to server
        const arrayBuffer = await file.arrayBuffer()

        const response = await fetch('http://localhost:3001/api/watermark/preview', {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
            'X-Watermark-Options': JSON.stringify(options),
          },
          body: arrayBuffer,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate preview')
        }

        // Convert response to blob and create object URL
        const blob = await response.blob()
        const imageUrl = URL.createObjectURL(blob)

        return imageUrl
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        toast.error(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return {
    watermarkFiles,
    previewWatermark,
    loading,
    error,
  }
}

/**
 * Utility function to batch watermark media files
 */
export async function batchWatermarkMedia(
  mediaIds: string[],
  options: WatermarkOptions = {},
  onProgress?: (completed: number, total: number) => void,
): Promise<WatermarkResult[]> {
  const batchSize = 5 // Process 5 files at a time
  const results: WatermarkResult[] = []

  for (let i = 0; i < mediaIds.length; i += batchSize) {
    const batch = mediaIds.slice(i, i + batchSize)

    try {
      // Import the media API function
      const { watermarkMediaFiles } = await import('../lib/api/media')
      const batchResults = await watermarkMediaFiles(batch, options)
      results.push(...batchResults)
    } catch (error) {
      // Add failed results for this batch
      batch.forEach((mediaId) => {
        results.push({
          mediaId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      })
    }

    // Report progress
    if (onProgress) {
      onProgress(Math.min(i + batchSize, mediaIds.length), mediaIds.length)
    }
  }

  return results
}

/**
 * Check if a file type supports watermarking
 */
export function canBeWatermarked(mimeType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/bmp',
  ]

  return supportedTypes.includes(mimeType.toLowerCase())
}

/**
 * Default watermark options
 */
export const DEFAULT_WATERMARK_OPTIONS: WatermarkOptions = {
  opacity: 0.3,
  position: 'bottom-right',
  margin: 20,
  maxSize: 15,
}

/**
 * Preset watermark configurations
 */
export const WATERMARK_PRESETS = {
  subtle: {
    opacity: 0.2,
    position: 'bottom-right' as const,
    margin: 15,
    maxSize: 12,
  },
  standard: {
    opacity: 0.3,
    position: 'bottom-right' as const,
    margin: 20,
    maxSize: 15,
  },
  prominent: {
    opacity: 0.5,
    position: 'bottom-right' as const,
    margin: 25,
    maxSize: 20,
  },
  center: {
    opacity: 0.2,
    position: 'center' as const,
    margin: 0,
    maxSize: 25,
  },
}
