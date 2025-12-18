// Media Management API Functions
import { supabaseAdmin } from '../supabase'
import { deleteFromUploadThing, uploadWatermarkedFilesToUploadThing } from '../uploadthing-client'

export interface MediaFile {
  id: string
  filename: string
  original_name: string
  file_type: string
  file_category: 'image' | 'video' | 'audio' | 'document'
  mime_type: string
  file_size: number
  file_url: string
  thumbnail_url?: string
  watermark_url?: string
  title?: string
  alt_text?: string
  description?: string
  tags?: string[]
  is_public: boolean
  uploaded_by: string
  folder_path: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string
  }
}

export interface MediaFilters {
  page?: number
  limit?: number
  category?: string
  search?: string
  userId?: string
}

export interface MediaResponse {
  media: MediaFile[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Fetch media files with filters
export async function getMediaFiles(filters: MediaFilters = {}): Promise<MediaResponse> {
  try {
    const page = filters.page || 1
    const limit = filters.limit || 20

    let query = supabaseAdmin
      .from('media_files')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      query = query.eq('file_category', filters.category)
    }

    // Apply search filter
    if (filters.search) {
      query = query.or(
        `filename.ilike.%${filters.search}%,original_name.ilike.%${filters.search}%,title.ilike.%${filters.search}%`,
      )
    }

    // Apply user filter
    if (filters.userId) {
      query = query.eq('uploaded_by', filters.userId)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      media: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error fetching media files:', error)
    throw new Error('Failed to fetch media files')
  }
}

// Update media file metadata
export async function updateMediaFile(
  id: string,
  updates: Partial<Pick<MediaFile, 'title' | 'alt_text' | 'description' | 'tags' | 'is_public'>>,
): Promise<MediaFile> {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('media_files')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      throw new Error(`Failed to update media file: ${error.message}`)
    }

    if (!data) {
      throw new Error('Media file not found')
    }

    return data
  } catch (error) {
    console.error('Error updating media file:', error)
    throw new Error('Failed to update media file')
  }
}

// Delete single media file
export async function deleteMediaFile(id: string): Promise<void> {
  try {
    // First, get the media file to get its URL
    const { data: mediaFile, error: fetchError } = await supabaseAdmin
      .from('media_files')
      .select('file_url, original_name')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching media file for deletion:', fetchError)
      throw new Error(`Failed to fetch media file: ${fetchError.message}`)
    }

    if (!mediaFile) {
      throw new Error('Media file not found')
    }

    // Delete from UploadThing first
    console.log('Deleting file from UploadThing:', mediaFile.original_name)
    const uploadThingDeleted = await deleteFromUploadThing(mediaFile.file_url)

    if (!uploadThingDeleted) {
      console.warn('Failed to delete from UploadThing, but continuing with database deletion')
    }

    // Then delete from database
    const { error } = await supabaseAdmin.from('media_files').delete().eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      throw new Error(`Failed to delete media file: ${error.message}`)
    }

    console.log('Successfully deleted media file:', mediaFile.original_name)
  } catch (error) {
    console.error('Error deleting media file:', error)
    throw new Error('Failed to delete media file')
  }
}

// Bulk delete media files
export async function bulkDeleteMediaFiles(ids: string[]): Promise<void> {
  try {
    // First, get all media files to get their URLs
    const { data: mediaFiles, error: fetchError } = await supabaseAdmin
      .from('media_files')
      .select('id, file_url, original_name')
      .in('id', ids)

    if (fetchError) {
      console.error('Error fetching media files for bulk deletion:', fetchError)
      throw new Error(`Failed to fetch media files: ${fetchError.message}`)
    }

    if (!mediaFiles || mediaFiles.length === 0) {
      throw new Error('No media files found for deletion')
    }

    // Delete from UploadThing first (in parallel for better performance)
    console.log(`Deleting ${mediaFiles.length} files from UploadThing`)
    const deletePromises = mediaFiles.map(async (file) => {
      const deleted = await deleteFromUploadThing(file.file_url)
      if (!deleted) {
        console.warn(`Failed to delete ${file.original_name} from UploadThing`)
      }
      return { id: file.id, deleted }
    })

    await Promise.all(deletePromises)

    // Then delete from database
    const { error } = await supabaseAdmin.from('media_files').delete().in('id', ids)

    if (error) {
      console.error('Supabase bulk delete error:', error)
      throw new Error(`Failed to delete media files: ${error.message}`)
    }

    console.log(`Successfully deleted ${mediaFiles.length} media files`)
  } catch (error) {
    console.error('Error bulk deleting media files:', error)
    throw new Error('Failed to delete media files')
  }
}

// Get media statistics
export async function getMediaStats(): Promise<{
  total: number
  by_category: Record<string, number>
  total_size: number
}> {
  try {
    // Get total count
    const { count: total, error: countError } = await supabaseAdmin
      .from('media_files')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw new Error(`Failed to get total count: ${countError.message}`)
    }

    // Get stats by category
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from('media_files')
      .select('file_category')

    if (categoryError) {
      throw new Error(`Failed to get category stats: ${categoryError.message}`)
    }

    // Count by category
    const by_category =
      categoryData?.reduce((acc: Record<string, number>, item) => {
        acc[item.file_category] = (acc[item.file_category] || 0) + 1
        return acc
      }, {}) || {}

    // Get total size
    const { data: sizeData, error: sizeError } = await supabaseAdmin
      .from('media_files')
      .select('file_size')

    if (sizeError) {
      throw new Error(`Failed to get size stats: ${sizeError.message}`)
    }

    const total_size = sizeData?.reduce((sum, item) => sum + (item.file_size || 0), 0) || 0

    return {
      total: total || 0,
      by_category,
      total_size,
    }
  } catch (error) {
    console.error('Error fetching media statistics:', error)
    throw new Error('Failed to fetch media statistics')
  }
}

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileIconName(fileType: string): string {
  // Return icon name for Lucide React components
  if (fileType.startsWith('image/')) return 'Image'
  if (fileType.startsWith('video/')) return 'Video'
  if (fileType.startsWith('audio/')) return 'Music'
  if (fileType.includes('pdf')) return 'FileText'
  if (fileType.includes('word') || fileType.includes('document')) return 'FileText'
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'Sheet'
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'Presentation'
  if (fileType.startsWith('text/')) return 'FileText'
  return 'File'
}

// Legacy function for backward compatibility (emoji icons)
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️'
  if (fileType.startsWith('video/')) return '🎥'
  if (fileType.startsWith('audio/')) return '🎵'
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  if (fileType.includes('sheet') || fileType.includes('excel')) return '📊'
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️'
  if (fileType.startsWith('text/')) return '📄'
  return '📎'
}

export function getThumbnailUrl(media: MediaFile): string {
  // Return thumbnail if available
  if (media.thumbnail_url) {
    return media.thumbnail_url
  }

  // For images, use the original URL
  if (media.file_category === 'image') {
    const fileUrl = media.file_url

    // Fix broken UploadThing URLs that are incomplete
    if (fileUrl === 'https://uploadthing-prod-sea1.s3.us-west-2.amazonaws.com/') {
      console.warn('Broken UploadThing URL detected for file:', media.original_name)
      // For now, return a placeholder or try to reconstruct
      // You might want to re-upload this file or update the database
      return '/placeholder-gallery.png' // Use existing placeholder
    }

    return fileUrl
  }

  // For other file types, we might want to generate or use default thumbnails
  return '/placeholder-gallery.png' // Use existing placeholder
}

export function canPreview(media: MediaFile): boolean {
  return (
    media.file_category === 'image' ||
    media.file_category === 'video' ||
    media.file_category === 'audio' ||
    media.mime_type === 'application/pdf'
  )
}

// Watermark functionality
export interface WatermarkOptions {
  opacity?: number
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
  margin?: number
  maxSize?: number
}

export interface WatermarkResult {
  mediaId: string
  success: boolean
  error?: string
  message?: string
}

/**
 * Add watermarks to existing media files
 */
export async function watermarkMediaFiles(
  mediaIds: string[],
  watermarkOptions: WatermarkOptions = {},
): Promise<WatermarkResult[]> {
  try {
    // Process files in parallel for better performance
    const processFile = async (mediaId: string): Promise<WatermarkResult> => {
      try {
        // Get media file from database
        const { data: mediaFile, error: fetchError } = await supabaseAdmin
          .from('media_files')
          .select('*')
          .eq('id', mediaId)
          .single()

        if (fetchError || !mediaFile) {
          return {
            mediaId,
            success: false,
            error: 'Media file not found',
          }
        }

        // Check if file type supports watermarking
        const supportedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/tiff',
          'image/bmp',
        ]
        if (!supportedTypes.includes(mediaFile.mime_type.toLowerCase())) {
          return {
            mediaId,
            success: false,
            error: 'File type not supported for watermarking',
          }
        }

        // Download the original file
        const response = await fetch(mediaFile.file_url)
        if (!response.ok) {
          return {
            mediaId,
            success: false,
            error: 'Could not download original file',
          }
        }

        const imageBuffer = await response.arrayBuffer()

        // Send to server for watermarking (production only)
        const watermarkUrl = import.meta.env.PROD
          ? (import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://www.eyogigurukul.com') +
            '/api/watermark/preview'
          : '/api/watermark/preview'

        const watermarkResponse = await fetch(watermarkUrl, {
          method: 'POST',
          headers: {
            'Content-Type': mediaFile.mime_type,
            'X-Watermark-Options': JSON.stringify({
              opacity: 0.3,
              position: 'bottom-right',
              margin: 20,
              maxSize: 15,
              ...watermarkOptions,
            }),
          },
          body: imageBuffer,
        })

        if (!watermarkResponse.ok) {
          return {
            mediaId,
            success: false,
            error: 'Failed to generate watermark on server',
          }
        }

        const watermarkedBuffer = await watermarkResponse.arrayBuffer()

        // Delete the original file from UploadThing first
        const { deleteFromUploadThing, uploadWatermarkedFilesToUploadThing } =
          await import('../uploadthing-client')

        console.log(
          'Deleting original file from UploadThing before uploading watermarked version:',
          mediaFile.original_name,
        )
        const deleted = await deleteFromUploadThing(mediaFile.file_url)

        if (!deleted) {
          console.warn(
            'Failed to delete original file from UploadThing, but continuing with watermark upload',
          )
        }

        // Convert buffer to File object for upload (preserve original format)
        const watermarkedBlob = new Blob([watermarkedBuffer], { type: mediaFile.mime_type })
        const watermarkedFile = new File(
          [watermarkedBlob],
          mediaFile.original_name, // Keep original filename
          {
            type: mediaFile.mime_type, // Preserve original MIME type
          },
        )

        const uploadResults = await uploadWatermarkedFilesToUploadThing([watermarkedFile])

        if (uploadResults.length > 0 && uploadResults[0].url) {
          // Update media file - replace the original file_url with watermarked version
          const { error: updateError } = await supabaseAdmin
            .from('media_files')
            .update({
              file_url: uploadResults[0].url, // Replace original URL (already using updated ufsUrl)
              // Keep original file_type and mime_type since we preserved the format
              // file_type: mediaFile.file_type, // Keep original
              // mime_type: mediaFile.mime_type, // Keep original
              metadata: {
                ...mediaFile.metadata,
                watermarked: true,
                watermarked_at: new Date().toISOString(),
                watermark_options: watermarkOptions,
                original_file_url: mediaFile.file_url, // Keep reference to original
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', mediaId)

          if (updateError) {
            return {
              mediaId,
              success: false,
              error: 'Failed to update database',
            }
          } else {
            return {
              mediaId,
              success: true,
              message: 'Watermark added and original file replaced successfully',
            }
          }
        } else {
          return {
            mediaId,
            success: false,
            error: 'Failed to upload watermarked image',
          }
        }
      } catch (error) {
        console.error(`Error processing media ${mediaId}:`, error)
        return {
          mediaId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }

    // Process all files in parallel
    const results = await Promise.all(mediaIds.map(processFile))

    return results
  } catch (error) {
    console.error('Error in watermark function:', error)
    throw new Error('Failed to process watermarks')
  }
}

/**
 * Check if a file type supports watermarking
 */
export function canBeWatermarked(mimeType: string): boolean {
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
