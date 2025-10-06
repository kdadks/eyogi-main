import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { supabaseAdmin } from './supabase'

const f = createUploadthing()

// Authentication function - integrate with Supabase auth
const auth = async (req: Request) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UploadThingError('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      throw new UploadThingError('Invalid token')
    }

    // Get user profile to check permissions
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      throw new UploadThingError('User profile not found')
    }

    return { id: user.id, role: profile.role, name: profile.full_name }
  } catch (error) {
    console.error('Auth error in UploadThing:', error)
    throw new UploadThingError('Authentication failed')
  }
}

// Helper function to determine file category
const getFileCategory = (type: string): string => {
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  return 'document'
}

// Types for the function parameters
interface UploadedFile {
  name: string
  size: number
  type: string
  url: string
}

interface UploadMetadata {
  userId: string
  uploadType: string
  userRole?: string
  userName?: string
}

// Helper function to save media to database
const saveMediaToDatabase = async (file: UploadedFile, metadata: UploadMetadata) => {
  try {
    const category = getFileCategory(file.type)

    const mediaData = {
      filename: file.name,
      original_name: file.name,
      file_type: file.type,
      file_category: category,
      mime_type: file.type,
      file_size: file.size,
      file_url: file.url,
      title: file.name.split('.')[0], // Default title without extension
      alt_text: file.name.split('.')[0], // Default alt text
      uploaded_by: metadata.userId,
      metadata: {
        uploadType: metadata.uploadType,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    }

    const { data, error } = await supabaseAdmin
      .from('media_files')
      .insert(mediaData)
      .select()
      .single()

    if (error) {
      console.error('Database save error:', error)
      throw new Error('Failed to save media to database')
    }

    return data
  } catch (error) {
    console.error('Error saving media to database:', error)
    throw error
  }
}
export const ourFileRouter = {
  // Media Management - Comprehensive file uploader for admin
  mediaUploader: f({
    // Images
    image: {
      maxFileSize: '16MB',
      maxFileCount: 10, // Allow bulk upload
    },
    // Videos
    video: {
      maxFileSize: '256MB',
      maxFileCount: 5,
    },
    // Audio files
    audio: {
      maxFileSize: '32MB',
      maxFileCount: 10,
    },
    // PDF documents
    pdf: {
      maxFileSize: '16MB',
      maxFileCount: 10,
    },
    // Excel files
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      maxFileSize: '8MB',
      maxFileCount: 10,
    },
    // Word documents
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      maxFileSize: '8MB',
      maxFileCount: 10,
    },
    // PowerPoint presentations
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
      maxFileSize: '16MB',
      maxFileCount: 10,
    },
    // Text files
    text: {
      maxFileSize: '2MB',
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req, files }) => {
      const user = await auth(req)

      // Check if user has admin permissions for media management
      if (!['admin', 'teacher'].includes(user.role)) {
        throw new UploadThingError('Insufficient permissions')
      }

      console.log(`User ${user.name} (${user.role}) uploading ${files.length} files`)

      return {
        userId: user.id,
        uploadType: 'media_management',
        userRole: user.role,
        userName: user.name,
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log('Upload complete for:', file.name)

        // Save each file to database
        const savedMedia = await saveMediaToDatabase(file, metadata)

        console.log('Saved to database:', savedMedia.id)

        return {
          uploadedBy: metadata.userId,
          mediaId: savedMedia.id,
          success: true,
        }
      } catch (error) {
        console.error('Error in onUploadComplete:', error)
        throw error
      }
    }),

  // Profile avatar uploader (simplified)
  avatarUploader: f({ image: { maxFileSize: '4MB' } })
    .middleware(async ({ req }) => {
      const user = await auth(req)
      return { userId: user.id, uploadType: 'avatar' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        // Save to media database
        const savedMedia = await saveMediaToDatabase(file, metadata)

        // Update user profile with avatar_url
        await supabaseAdmin
          .from('profiles')
          .update({ avatar_url: file.url })
          .eq('id', metadata.userId)

        return { uploadedBy: metadata.userId, avatarUrl: file.url, mediaId: savedMedia.id }
      } catch (error) {
        console.error('Avatar upload error:', error)
        throw error
      }
    }),

  // Course content uploader
  courseContentUploader: f({
    image: { maxFileSize: '8MB' },
    video: { maxFileSize: '64MB' },
    pdf: { maxFileSize: '8MB' },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req)
      return { userId: user.id, uploadType: 'course_content' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        const savedMedia = await saveMediaToDatabase(file, metadata)
        return { uploadedBy: metadata.userId, mediaId: savedMedia.id }
      } catch (error) {
        console.error('Course content upload error:', error)
        throw error
      }
    }),
} satisfies FileRouter
export type OurFileRouter = typeof ourFileRouter
