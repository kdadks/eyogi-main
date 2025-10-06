import sharp from 'sharp'
import path from 'path'

interface WatermarkOptions {
  opacity?: number // 0-1, default 0.3
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
  margin?: number // pixels from edge, default 20
  maxSize?: number // max watermark size as percentage of image width, default 15
}

/**
 * Add eYogi Gurukul watermark to an image
 * @param imageBuffer - The input image buffer
 * @param options - Watermarking options
 * @returns Promise<Buffer> - The watermarked image buffer
 */
export async function addWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {},
): Promise<Buffer> {
  const { opacity = 0.3, position = 'bottom-right', margin = 20, maxSize = 15 } = options

  try {
    // Load the main image
    const image = sharp(imageBuffer)
    const { width, height } = await image.metadata()

    if (!width || !height) {
      throw new Error('Could not get image dimensions')
    }

    // Load the watermark logo
    const watermarkPath = path.join(process.cwd(), 'public', 'eyogiTextLess.png')
    let watermark = sharp(watermarkPath)

    // Calculate watermark size (max 15% of image width)
    const maxWatermarkWidth = Math.floor(width * (maxSize / 100))
    const watermarkMeta = await watermark.metadata()

    const watermarkWidth = maxWatermarkWidth
    let watermarkHeight = maxWatermarkWidth

    if (watermarkMeta.width && watermarkMeta.height) {
      // Maintain aspect ratio
      const aspectRatio = watermarkMeta.height / watermarkMeta.width
      watermarkHeight = Math.floor(watermarkWidth * aspectRatio)
    }

    // Resize watermark
    watermark = watermark.resize(watermarkWidth, watermarkHeight)

    // Calculate position
    let left: number, top: number

    switch (position) {
      case 'bottom-right':
        left = width - watermarkWidth - margin
        top = height - watermarkHeight - margin
        break
      case 'bottom-left':
        left = margin
        top = height - watermarkHeight - margin
        break
      case 'top-right':
        left = width - watermarkWidth - margin
        top = margin
        break
      case 'top-left':
        left = margin
        top = margin
        break
      case 'center':
        left = Math.floor((width - watermarkWidth) / 2)
        top = Math.floor((height - watermarkHeight) / 2)
        break
      default:
        left = width - watermarkWidth - margin
        top = height - watermarkHeight - margin
    }

    // Create watermark with opacity
    const watermarkBuffer = await watermark
      .ensureAlpha()
      .modulate({ brightness: 1, saturation: 1 })
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.floor(255 * opacity)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: 'dest-in',
        },
      ])
      .png()
      .toBuffer()

    // Apply watermark to the main image
    const result = await image
      .composite([
        {
          input: watermarkBuffer,
          left,
          top,
          blend: 'over',
        },
      ])
      .toBuffer()

    return result
  } catch (error) {
    console.error('Error adding watermark:', error)
    throw new Error(
      `Failed to add watermark: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Check if a file should be watermarked based on its MIME type
 * @param mimeType - The MIME type of the file
 * @returns boolean - Whether the file should be watermarked
 */
export function shouldWatermark(mimeType: string): boolean {
  const watermarkableMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/bmp',
  ]

  return watermarkableMimeTypes.includes(mimeType.toLowerCase())
}

/**
 * Process uploaded image with watermarking
 * @param imageBuffer - The uploaded image buffer
 * @param mimeType - The MIME type of the image
 * @param watermarkOptions - Optional watermarking configuration
 * @returns Promise<Buffer> - The processed image buffer
 */
export async function processUploadedImage(
  imageBuffer: Buffer,
  mimeType: string,
  watermarkOptions?: WatermarkOptions,
): Promise<Buffer> {
  try {
    // Only watermark supported image types
    if (!shouldWatermark(mimeType)) {
      return imageBuffer
    }

    // Add watermark
    const watermarkedBuffer = await addWatermark(imageBuffer, watermarkOptions)

    return watermarkedBuffer
  } catch (error) {
    console.error('Error processing uploaded image:', error)
    // Return original image if watermarking fails
    return imageBuffer
  }
}

/**
 * Create thumbnail with watermark
 * @param imageBuffer - The input image buffer
 * @param size - Thumbnail size (width and height)
 * @param addWatermarkToThumbnail - Whether to add watermark to thumbnail
 * @returns Promise<Buffer> - The thumbnail buffer
 */
export async function createThumbnail(
  imageBuffer: Buffer,
  size: number = 150,
  addWatermarkToThumbnail: boolean = false,
): Promise<Buffer> {
  try {
    const thumbnail = sharp(imageBuffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })

    let thumbnailBuffer = await thumbnail.toBuffer()

    // Optionally add watermark to thumbnail
    if (addWatermarkToThumbnail) {
      try {
        thumbnailBuffer = await addWatermark(thumbnailBuffer, {
          opacity: 0.4,
          maxSize: 25, // Larger watermark for smaller image
          margin: 5,
        })
      } catch (error) {
        console.error('Error adding watermark to thumbnail:', error)
        // Continue without watermark if it fails
      }
    }

    return thumbnailBuffer
  } catch (error) {
    console.error('Error creating thumbnail:', error)
    throw new Error(
      `Failed to create thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Batch watermark multiple images
 * @param images - Array of image data with buffer and metadata
 * @param options - Watermarking options
 * @returns Promise<Array> - Array of processed image results
 */
export async function batchWatermark(
  images: Array<{
    buffer: Buffer
    mimeType: string
    filename: string
  }>,
  options: WatermarkOptions = {},
): Promise<
  Array<{
    buffer: Buffer
    filename: string
    success: boolean
    error?: string
  }>
> {
  const results = await Promise.allSettled(
    images.map(async (image) => {
      try {
        const processedBuffer = await processUploadedImage(image.buffer, image.mimeType, options)

        return {
          buffer: processedBuffer,
          filename: image.filename,
          success: true,
        }
      } catch (error) {
        return {
          buffer: image.buffer, // Return original on error
          filename: image.filename,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }),
  )

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      // This shouldn't happen since we catch errors above, but just in case
      return {
        buffer: Buffer.alloc(0),
        filename: 'unknown',
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      }
    }
  })
}
