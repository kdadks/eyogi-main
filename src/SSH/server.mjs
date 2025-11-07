import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { createRouteHandler, createUploadthing } from 'uploadthing/server'
import { UTApi } from 'uploadthing/server'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from current directory
config({ path: './.env' })
config({ path: './.env.local' })

// Log available UploadThing environment variables
console.log('Environment variables check:')
console.log('UPLOADTHING_SECRET:', process.env.UPLOADTHING_SECRET ? 'Available' : 'Not found')
console.log('UPLOADTHING_TOKEN:', process.env.UPLOADTHING_TOKEN ? 'Available' : 'Not found')
console.log('UPLOADTHING_APP_ID:', process.env.UPLOADTHING_APP_ID ? 'Available' : 'Not found')

const app = express()
const PORT = 3001

// Enable CORS
app.use(
  cors({
    origin: ['http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
    credentials: true,
  }),
)

// Enable raw body parsing for UploadThing
app.use(express.raw({ type: '*/*', limit: '50mb' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create UploadThing instance
const f = createUploadthing()

// Define the upload router
const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: '8MB', maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      console.log('UploadThing middleware - processing request')
      return { uploadedBy: 'system' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.uploadedBy)
      console.log('File URL:', file.url)
      return { uploadedBy: metadata.uploadedBy }
    }),

  avatarUploader: f({ image: { maxFileSize: '2MB' } })
    .middleware(async ({ req }) => {
      console.log('Avatar upload middleware - processing request')
      return { uploadType: 'avatar' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Avatar upload complete')
      console.log('File URL:', file.url)
      return { uploadType: metadata.uploadType, avatarUrl: file.url }
    }),

  watermarkUploader: f({ image: { maxFileSize: '16MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      console.log('UploadThing watermark middleware - processing request')
      return { uploadedBy: 'watermark-system' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Watermark upload complete for userId:', metadata.uploadedBy)
      console.log('File URL:', file.url)
      return { uploadedBy: metadata.uploadedBy }
    }),
}

// Create UploadThing API instance for file operations
const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET,
})

// Watermark function
async function addWatermark(imageBuffer, options = {}) {
  const { opacity = 0.3, position = 'bottom-right', margin = 20, maxSize = 15 } = options

  try {
    // Load the main image
    const image = sharp(imageBuffer)
    const { width, height, format } = await image.metadata()

    if (!width || !height) {
      throw new Error('Could not get image dimensions')
    }

    // Load the watermark logo
    const watermarkPath = path.join(__dirname, 'public', 'eyogiTextLess.png')
    let watermark = sharp(watermarkPath)

    // Calculate watermark size (max percentage of image width)
    const maxWatermarkWidth = Math.floor(width * (maxSize / 100))
    const watermarkMeta = await watermark.metadata()

    const watermarkWidth = maxWatermarkWidth
    let watermarkHeight = maxWatermarkWidth

    if (watermarkMeta.width && watermarkMeta.height) {
      // Maintain aspect ratio
      const aspectRatio = watermarkMeta.height / watermarkMeta.width
      watermarkHeight = Math.floor(watermarkWidth * aspectRatio)
    }

    // Optimize watermark for smaller file size impact
    // Resize watermark and adjust opacity with better blending
    watermark = watermark
      .resize(watermarkWidth, watermarkHeight)
      .ensureAlpha() // Ensure alpha channel for proper transparency
      .modulate({
        brightness: 1,
        saturation: 0.8, // Slightly desaturate to reduce file size impact
      })
      .composite([
        {
          input: Buffer.from(
            `<svg width="${watermarkWidth}" height="${watermarkHeight}">
              <defs>
                <filter id="opacity">
                  <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${opacity} 0"/>
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="white" filter="url(#opacity)"/>
            </svg>`,
          ),
          blend: 'multiply',
        },
      ])

    // Calculate position
    let left = 0,
      top = 0
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
    }

    // Apply watermark
    const watermarkedImage = image.composite([
      {
        input: await watermark.png().toBuffer(),
        left: Math.max(0, left),
        top: Math.max(0, top),
        blend: 'over',
      },
    ])

    // Output in original format with optimized compression
    const originalSize = imageBuffer.length
    console.log(`Original image: ${format} format, ${(originalSize / 1024).toFixed(1)}KB`)

    // Function to optimize size while maintaining quality
    const optimizeWithQuality = async (outputFn, qualities = [95, 92, 88, 85]) => {
      // Start with highest quality and work down
      for (const quality of qualities) {
        const buffer = await outputFn(quality)
        const sizeRatio = buffer.length / originalSize

        console.log(
          `Quality ${quality}: ${(buffer.length / 1024).toFixed(1)}KB (${(sizeRatio * 100).toFixed(0)}% of original)`,
        )

        // Accept if within reasonable size increase (50% max) or if it's smaller
        if (sizeRatio <= 1.5) {
          console.log(`✓ Using quality ${quality} - good size/quality balance`)
          return buffer
        }
      }

      // If all qualities result in large files, use the highest quality anyway to preserve image quality
      console.log(
        '⚠️ All options result in large files, using highest quality to preserve image fidelity',
      )
      return await outputFn(qualities[0])
    }

    let outputBuffer

    switch (format?.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        outputBuffer = await optimizeWithQuality(async (quality) => {
          return await watermarkedImage
            .jpeg({
              quality,
              progressive: true,
              mozjpeg: true, // Use mozjpeg for better compression without quality loss
            })
            .toBuffer()
        })
        break

      case 'webp':
        outputBuffer = await optimizeWithQuality(async (quality) => {
          return await watermarkedImage
            .webp({
              quality,
              effort: 6, // Higher compression effort for better quality/size ratio
              nearLossless: quality >= 90, // Use near-lossless for high quality settings
            })
            .toBuffer()
        })
        break

      case 'png':
        // For PNG, maintain quality but optimize compression
        try {
          outputBuffer = await watermarkedImage
            .png({
              compressionLevel: 9, // Maximum compression without quality loss
              progressive: true,
              palette: false, // Don't force palette to maintain color quality
              quality: 100, // PNG quality is lossless, so use max
            })
            .toBuffer()

          console.log(`PNG optimized: ${(outputBuffer.length / 1024).toFixed(1)}KB`)
        } catch (error) {
          // Fallback if palette optimization fails
          console.log('PNG palette optimization failed, using standard compression')
          outputBuffer = await watermarkedImage
            .png({
              compressionLevel: 8,
              progressive: true,
            })
            .toBuffer()
        }
        break

      case 'tiff':
        outputBuffer = await optimizeWithQuality(async (quality) => {
          return await watermarkedImage
            .tiff({
              quality,
              compression: quality >= 90 ? 'lzw' : 'jpeg', // Use lossless LZW for high quality
            })
            .toBuffer()
        })
        break

      default:
        // Fallback to high-quality JPEG for unknown formats
        console.log(`Unknown format ${format}, converting to high-quality JPEG`)
        outputBuffer = await optimizeWithQuality(
          async (quality) => {
            return await watermarkedImage
              .jpeg({
                quality,
                progressive: true,
                mozjpeg: true,
              })
              .toBuffer()
          },
          [95, 90, 85, 80],
        ) // Higher quality range for conversions
        break
    }

    const newSize = outputBuffer.length
    const sizeChange = (((newSize - originalSize) / originalSize) * 100).toFixed(1)
    console.log(
      `Final watermarked image: ${(newSize / 1024).toFixed(1)}KB (${sizeChange > 0 ? '+' : ''}${sizeChange}% size change)`,
    )

    // If file size increased dramatically (>100%), try one more optimization with smaller watermark
    if (newSize > originalSize * 2 && maxSize > 8) {
      console.log('⚠️ File size increased significantly, trying smaller watermark...')

      try {
        // Recursively call with smaller watermark
        const smallerOptions = {
          ...options,
          maxSize: Math.max(8, maxSize * 0.7), // Reduce watermark size by 30%
          opacity: Math.max(0.15, opacity * 0.9), // Slightly reduce opacity
        }

        const optimizedBuffer = await addWatermark(imageBuffer, smallerOptions)

        if (optimizedBuffer.length < newSize) {
          console.log(
            `✓ Smaller watermark reduced size to ${(optimizedBuffer.length / 1024).toFixed(1)}KB`,
          )
          return optimizedBuffer
        }
      } catch (error) {
        console.log('Smaller watermark optimization failed, using original result')
      }
    }

    return outputBuffer
  } catch (error) {
    console.error('Watermark error:', error)
    throw error
  }
}

// Check if file type supports watermarking
function shouldWatermark(mimeType) {
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

// Watermark preview endpoint
app.post(
  '/api/watermark/preview',
  express.raw({ type: '*/*', limit: '50mb' }),
  async (req, res) => {
    try {
      console.log('Watermark preview request received')

      const contentType = req.get('content-type') || ''
      const options = JSON.parse(req.get('x-watermark-options') || '{}')

      if (!contentType.startsWith('image/')) {
        return res.status(400).json({ error: 'File must be an image' })
      }

      if (!shouldWatermark(contentType)) {
        return res.status(400).json({ error: 'File type not supported for watermarking' })
      }

      const watermarkedBuffer = await addWatermark(req.body, {
        opacity: 0.3,
        position: 'bottom-right',
        margin: 20,
        maxSize: 15,
        ...options,
      })

      res.set('Content-Type', 'image/png')
      res.send(watermarkedBuffer)
    } catch (error) {
      console.error('Preview watermark error:', error)
      res.status(500).json({ error: 'Failed to generate preview', details: error.message })
    }
  },
)

// Watermark multiple files endpoint
app.post('/api/watermark/batch', async (req, res) => {
  try {
    console.log('Batch watermark request received')
    const { mediaIds, watermarkOptions = {} } = req.body

    if (!mediaIds || !Array.isArray(mediaIds)) {
      return res.status(400).json({ error: 'Media IDs array is required' })
    }

    const results = []

    for (const mediaId of mediaIds) {
      try {
        // This would need integration with your database to fetch media file info
        // For now, return success status
        results.push({
          mediaId,
          success: true,
          message: 'Watermark processing initiated',
        })
      } catch (error) {
        results.push({
          mediaId,
          success: false,
          error: error.message,
        })
      }
    }

    res.json({
      success: true,
      results,
      message: `Processed ${results.length} files`,
    })
  } catch (error) {
    console.error('Batch watermark error:', error)
    res.status(500).json({ error: 'Failed to process batch watermarks', details: error.message })
  }
})

// Create route handlers
const handlers = createRouteHandler({
  router: uploadRouter,
  config: {
    // Use the base64 encoded token from environment variables
    token: process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET,
  },
}) // Handle UploadThing file deletion
app.delete('/api/uploadthing', async (req, res) => {
  console.log('Handling DELETE request for UploadThing')
  const { fileKey } = req.query

  if (!fileKey) {
    return res.status(400).json({ error: 'File key is required' })
  }

  try {
    console.log('Deleting file from UploadThing:', fileKey)
    const result = await utapi.deleteFiles([fileKey])

    console.log('UploadThing delete result:', result)

    if (result.success) {
      res.json({ success: true, message: 'File deleted successfully' })
    } else {
      res.status(500).json({ error: 'Failed to delete file from UploadThing' })
    }
  } catch (error) {
    console.error('UploadThing delete error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
})

// Handle all other UploadThing requests
app.all('/api/uploadthing', async (req, res) => {
  console.log(`Handling ${req.method} request to /api/uploadthing`)
  console.log('Headers:', Object.keys(req.headers))
  console.log('Query:', req.query)
  console.log('Body type:', typeof req.body)
  console.log('Content-Type:', req.get('content-type'))

  try {
    // Create a proper Request object for UploadThing
    const protocol = req.secure ? 'https' : 'http'
    const host = req.get('host')
    const fullUrl = `${protocol}://${host}${req.originalUrl}`

    console.log('Full URL:', fullUrl)

    // Prepare headers for UploadThing request
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        headers.set(key, value[0])
      } else if (value) {
        headers.set(key, value)
      }
    }

    // Create the request with proper body handling
    const requestOptions = {
      method: req.method,
      headers: headers,
    }

    // Only add body for POST requests
    if (req.method === 'POST' && req.body) {
      requestOptions.body = req.body
    }

    console.log('Request options:', {
      method: requestOptions.method,
      headers: Object.fromEntries(requestOptions.headers.entries()),
      bodyType: typeof requestOptions.body,
    })

    const response = await handlers(new Request(fullUrl, requestOptions))

    console.log('UploadThing response status:', response.status)

    // Copy response headers
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value)
    }

    // Set status and send response
    res.status(response.status)
    const responseText = await response.text()
    console.log('UploadThing response:', responseText)
    res.send(responseText)
  } catch (error) {
    console.error('UploadThing handler error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`UploadThing backend server running on http://localhost:${PORT}`)
})
