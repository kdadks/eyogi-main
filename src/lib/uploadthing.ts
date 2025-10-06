import { createUploadthing } from 'uploadthing/next'

// Create a UploadThing router for SSH app compatibility
const f = createUploadthing()

// Router that matches SSH app expectations with multiple file types
export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 10,
    },
    video: {
      maxFileSize: '32MB',
      maxFileCount: 5,
    },
    audio: {
      maxFileSize: '16MB',
      maxFileCount: 5,
    },
    'application/pdf': {
      maxFileSize: '8MB',
      maxFileCount: 5,
    },
    'text/plain': {
      maxFileSize: '2MB',
      maxFileCount: 5,
    },
    blob: {
      maxFileSize: '8MB',
      maxFileCount: 10,
    },
  })
    .middleware(async () => {
      // Basic middleware for SSH app
      return { uploadedBy: 'ssh-app' }
    })
    .onUploadComplete(async ({ file }) => {
      console.log('SSH app upload complete:', file.url)
      return { url: file.url }
    }),

  watermarkUploader: f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 10,
    },
    video: {
      maxFileSize: '32MB',
      maxFileCount: 5,
    },
    audio: {
      maxFileSize: '16MB',
      maxFileCount: 5,
    },
    'application/pdf': {
      maxFileSize: '8MB',
      maxFileCount: 5,
    },
    'text/plain': {
      maxFileSize: '2MB',
      maxFileCount: 5,
    },
    blob: {
      maxFileSize: '8MB',
      maxFileCount: 10,
    },
  })
    .middleware(async () => {
      // Basic middleware for SSH app watermarks
      return { uploadedBy: 'ssh-app-watermark' }
    })
    .onUploadComplete(async ({ file }) => {
      console.log('SSH app watermark upload complete:', file.url)
      return { url: file.url }
    }),
}

export type OurFileRouter = typeof ourFileRouter
