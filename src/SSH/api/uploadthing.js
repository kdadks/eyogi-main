// Production UploadThing API Handler for Vercel
// This file should be deployed as a Vercel serverless function

import { createRouteHandler, createUploadthing, UTApi } from 'uploadthing/server'

// Create UploadThing instance
const f = createUploadthing()

// Create UploadThing API instance for file operations
const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET,
})

// Define the upload router
const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
    .middleware(async () => {
      console.log('UploadThing middleware - processing request')
      return { uploadedBy: 'system' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.uploadedBy)
      console.log('File URL:', file.url)
      return { uploadedBy: metadata.uploadedBy }
    }),
}

// Create route handlers
const handlers = createRouteHandler({
  router: uploadRouter,
  config: {
    // Vercel automatically loads environment variables
    token: process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET,
  },
})

// Vercel serverless function handler
export default async function handler(req, res) {
  // Set CORS headers for production
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Handle DELETE requests for file deletion
  if (req.method === 'DELETE') {
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
        return res.json({ success: true, message: 'File deleted successfully' })
      } else {
        return res.status(500).json({ error: 'Failed to delete file from UploadThing' })
      }
    } catch (error) {
      console.error('UploadThing delete error:', error)
      return res.status(500).json({ error: 'Internal server error', details: error.message })
    }
  }

  try {
    // Create a proper Request object for UploadThing
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const host = req.headers.host
    const fullUrl = `${protocol}://${host}${req.url}`

    const request = new Request(fullUrl, {
      method: req.method || 'GET',
      headers: req.headers,
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    })

    const response = await handlers(request)

    // Copy response headers
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value)
    }

    res.status(response.status)
    const responseText = await response.text()
    res.send(responseText)
  } catch (error) {
    console.error('UploadThing handler error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
