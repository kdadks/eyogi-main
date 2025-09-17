import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'

const f = createUploadthing()

// Authentication function - integrate with Supabase auth
const auth = async (req: Request) => {
  // Extract token from Authorization header
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    throw new UploadThingError('Unauthorized')
  }

  // Verify token with Supabase (implement your auth logic here)
  // Return user ID if valid, throw error if not
  return { id: 'user-id' } // Replace with actual auth logic
}

export const ourFileRouter = {
  // Profile avatar uploader
  avatarUploader: f({ image: { maxFileSize: '4MB' } })
    .middleware(async ({ req }) => {
      const user = await auth(req)
      return { userId: user.id, uploadType: 'avatar' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Avatar upload complete for userId:', metadata.userId)
      console.log('File URL:', file.url)

      // Save to Supabase media table
      // Update user profile with avatar_url

      return { uploadedBy: metadata.userId }
    }),

  // Course content uploader (images, videos, documents)
  courseContentUploader: f({
    image: { maxFileSize: '8MB' },
    video: { maxFileSize: '100MB' },
    pdf: { maxFileSize: '10MB' },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req)
      // Verify user has permission to upload course content
      return { userId: user.id, uploadType: 'course_content' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Course content upload complete for userId:', metadata.userId)

      // Save to Supabase media table with course association

      return { uploadedBy: metadata.userId }
    }),

  // Certificate uploader (system generated)
  certificateUploader: f({ pdf: { maxFileSize: '5MB' } })
    .middleware(async ({ req }) => {
      const user = await auth(req)
      // Verify user has permission to generate certificates
      return { userId: user.id, uploadType: 'certificate' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Certificate upload complete for userId:', metadata.userId)

      // Update certificate record in Supabase

      return { uploadedBy: metadata.userId }
    }),

  // Assignment submission uploader
  assignmentUploader: f({
    image: { maxFileSize: '4MB' },
    pdf: { maxFileSize: '10MB' },
    video: { maxFileSize: '50MB' },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req)
      return { userId: user.id, uploadType: 'assignment' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Assignment upload complete for userId:', metadata.userId)

      // Save to assignment submissions table

      return { uploadedBy: metadata.userId }
    }),

  // General media library uploader
  mediaLibraryUploader: f({
    image: { maxFileSize: '8MB' },
    video: { maxFileSize: '100MB' },
    pdf: { maxFileSize: '10MB' },
    audio: { maxFileSize: '25MB' },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req)
      // Verify user has admin/teacher permissions
      return { userId: user.id, uploadType: 'media_library' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Media library upload complete for userId:', metadata.userId)

      // Save to Supabase media table

      return { uploadedBy: metadata.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
