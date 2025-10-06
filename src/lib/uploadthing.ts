import { createUploadthing } from 'uploadthing/next'

// Create a simple UploadThing router for SSH app compatibility
const f = createUploadthing()

// Simple router that allows image uploads
export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: '8MB', maxFileCount: 10 } })
    .middleware(async () => {
      // Basic middleware for SSH app
      return { uploadedBy: 'ssh-app' }
    })
    .onUploadComplete(async ({ file }) => {
      console.log('SSH app upload complete:', file.url)
      return { url: file.url }
    }),
}

export type OurFileRouter = typeof ourFileRouter
