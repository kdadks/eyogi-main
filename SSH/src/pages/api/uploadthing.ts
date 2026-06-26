import { createRouteHandler, createUploadthing } from 'uploadthing/server'

const f = createUploadthing()

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

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {
    token: import.meta.env.VITE_UPLOADTHING_TOKEN || import.meta.env.VITE_UPLOADTHING_SECRET,
  },
})
