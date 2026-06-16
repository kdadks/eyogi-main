/**
 * Supabase Storage utilities
 * Handles file uploads, downloads, and deletions
 */

import { createAdminClient } from './server'

const STORAGE_BUCKETS = {
  MEDIA: 'media',
  COURSES: 'course-materials',
  UPLOADS: 'user-uploads',
}

interface FileUploadOptions {
  bucket?: keyof typeof STORAGE_BUCKETS
  path?: string
  contentType?: string
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File | Buffer,
  fileName: string,
  options: FileUploadOptions = {},
) {
  try {
    const { bucket = 'MEDIA', path, contentType } = options
    const bucketName = STORAGE_BUCKETS[bucket]

    const supabase = createAdminClient()
    const filePath = path ? `${path}/${fileName}` : fileName

    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
      contentType: contentType || 'application/octet-stream',
      upsert: false,
    })

    if (error) return { error: error.message }
    return { data }
  } catch (error) {
    return { error: String(error) }
  }
}

/**
 * Get public URL for file
 */
export function getPublicUrl(
  fileName: string,
  bucket: keyof typeof STORAGE_BUCKETS = 'MEDIA',
): string {
  const supabase = createAdminClient()
  const bucketName = STORAGE_BUCKETS[bucket]

  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName)
  return data?.publicUrl || ''
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(fileName: string, bucket: keyof typeof STORAGE_BUCKETS = 'MEDIA') {
  try {
    const supabase = createAdminClient()
    const bucketName = STORAGE_BUCKETS[bucket]

    const { error } = await supabase.storage.from(bucketName).remove([fileName])

    if (error) return { error: error.message }
    return { success: true }
  } catch (error) {
    return { error: String(error) }
  }
}

/**
 * Download file from Supabase Storage
 */
export async function downloadFile(
  fileName: string,
  bucket: keyof typeof STORAGE_BUCKETS = 'MEDIA',
) {
  try {
    const supabase = createAdminClient()
    const bucketName = STORAGE_BUCKETS[bucket]

    const { data, error } = await supabase.storage.from(bucketName).download(fileName)

    if (error) return { error: error.message }
    return { data }
  } catch (error) {
    return { error: String(error) }
  }
}

/**
 * Generate signed URL for temporary file access
 */
export async function getSignedUrl(
  fileName: string,
  expiresIn: number = 3600,
  bucket: keyof typeof STORAGE_BUCKETS = 'MEDIA',
) {
  try {
    const supabase = createAdminClient()
    const bucketName = STORAGE_BUCKETS[bucket]

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, expiresIn)

    if (error) return { error: error.message }
    return { data }
  } catch (error) {
    return { error: String(error) }
  }
}

/**
 * List files in bucket
 */
export async function listFiles(path: string = '', bucket: keyof typeof STORAGE_BUCKETS = 'MEDIA') {
  try {
    const supabase = createAdminClient()
    const bucketName = STORAGE_BUCKETS[bucket]

    const { data, error } = await supabase.storage.from(bucketName).list(path)

    if (error) return { error: error.message }
    return { data }
  } catch (error) {
    return { error: String(error) }
  }
}
