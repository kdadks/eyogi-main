const express = require('express')
const cors = require('cors')
const { createRouteHandler } = require('uploadthing/server')
const { createUploadthing } = require('uploadthing/server')

const app = express()
const PORT = 3001

// Enable CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)

app.use(express.json())

// Create UploadThing instance
const f = createUploadthing()

// Define the upload router
const uploadRouter = {
  mediaUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 10 },
    video: { maxFileSize: '16MB', maxFileCount: 5 },
    audio: { maxFileSize: '8MB', maxFileCount: 5 },
    'application/pdf': { maxFileSize: '4MB', maxFileCount: 5 },
    blob: { maxFileSize: '4MB', maxFileCount: 10 },
  }).onUploadComplete((data) => {
    console.log('Upload completed:', data)
    return { uploadedBy: 'system' }
  }),
}

// Create route handlers
const handlers = createRouteHandler({
  router: uploadRouter,
  config: {
    token: process.env.VITE_UPLOADTHING_SECRET,
  },
})

// Handle UploadThing requests
app.all('/api/uploadthing', async (req, res) => {
  try {
    const response = await handlers(req)
    res.status(response.status)

    const contentType = response.headers.get('content-type')
    if (contentType) {
      res.set('content-type', contentType)
    }

    const body = await response.text()
    res.send(body)
  } catch (error) {
    console.error('UploadThing API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`UploadThing backend server running on http://localhost:${PORT}`)
})
