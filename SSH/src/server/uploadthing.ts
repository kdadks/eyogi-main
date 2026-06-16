import { createUploadthing, type FileRouter } from 'uploadthing/server'

const f = createUploadthing()

export const uploadRouter = {
  // Define file upload route for all media types
  mediaUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 10,
    },
    video: {
      maxFileSize: '16MB',
      maxFileCount: 5,
    },
    audio: {
      maxFileSize: '8MB',
      maxFileCount: 5,
    },
    'application/pdf': {
      maxFileSize: '4MB',
      maxFileCount: 5,
    },
    'text/plain': {
      maxFileSize: '1MB',
      maxFileCount: 5,
    },
    // Add more file types as needed
    blob: {
      maxFileSize: '4MB',
      maxFileCount: 10,
    },
  }).onUploadComplete((data) => {
    console.log('Upload completed:', data)
    return { uploadedBy: 'system' }
  }),
} satisfies FileRouter

export type OurFileRouter = typeof uploadRouter
