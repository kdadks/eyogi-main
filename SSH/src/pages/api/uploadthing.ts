import type { NextApiRequest, NextApiResponse } from 'next'
import { createRouteHandler, createUploadthing } from 'uploadthing/server'

// Create UploadThing instance
const f = createUploadthing()

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
    // Vercel will automatically load environment variables
    token: process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET,
  },
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Create a proper Request object for UploadThing
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers.host
  const fullUrl = `${protocol}://${host}${req.url}`

  const request = new Request(fullUrl, {
    method: req.method || 'GET',
    headers: req.headers as HeadersInit,
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
}
