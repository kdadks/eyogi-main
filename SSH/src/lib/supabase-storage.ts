/**
 * Supabase Storage Management Utility
 * Centralized management for the three storage buckets:
 * - media: for audio, video, and other media files
 * - certificates: for issued certificates (PDFs)
 * - certificate-templates: for certificate template resources
 */

import { supabaseAdmin } from './supabase'

export type StorageBucket = 'media' | 'certificates' | 'certificate-templates'

interface StorageFile {
  path: string
  bucket: StorageBucket
}

/**
 * Extract bucket name and path from a public URL
 * Supports URLs like:
 * - https://[PROJECT].supabase.co/storage/v1/object/public/media/...
 * - https://[PROJECT].supabase.co/storage/v1/object/public/certificates/...
 * - https://[PROJECT].supabase.co/storage/v1/object/public/certificate-templates/...
 */
export function extractStorageInfo(fileUrl: string): StorageFile | null {
  try {
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split('/public/')

    if (pathParts.length < 2) {
      console.error('Could not extract storage info from URL:', fileUrl)
      return null
    }

    const remaining = pathParts[1]
    const bucketMatch = remaining.match(/^(media|certificates|certificate-templates)\/(.+)/)

    if (!bucketMatch) {
      console.error('Could not match bucket from URL:', fileUrl)
      return null
    }

    const [, bucket, path] = bucketMatch
    return {
      path: path, // Just the path without bucket prefix
      bucket: bucket as StorageBucket,
    }
  } catch (error) {
    console.error('Error extracting storage info:', error)
    return null
  }
}

/**
 * Delete a file from the appropriate Supabase storage bucket
 * @param fileUrl - The public URL of the file to delete
 * @returns true if deletion was successful, false otherwise
 */
export async function deleteFromSupabaseStorage(fileUrl: string): Promise<boolean> {
  try {
    const storageInfo = extractStorageInfo(fileUrl)

    if (!storageInfo) {
      console.error('Could not determine storage bucket from URL:', fileUrl)
      return false
    }

    console.log(`Deleting from ${storageInfo.bucket} bucket:`, storageInfo.path)

    const { error } = await supabaseAdmin.storage
      .from(storageInfo.bucket)
      .remove([storageInfo.path])

    if (error) {
      console.error(`Failed to delete from ${storageInfo.bucket}:`, error)
      return false
    }

    console.log(`Successfully deleted from ${storageInfo.bucket}:`, storageInfo.path)
    return true
  } catch (error) {
    console.error('Error deleting from Supabase storage:', error)
    return false
  }
}

/**
 * Delete multiple files from storage
 * @param fileUrls - Array of public URLs to delete
 * @returns object with success count and failed URLs
 */
export async function bulkDeleteFromSupabaseStorage(fileUrls: string[]): Promise<{
  deleted: number
  failed: string[]
}> {
  const result = {
    deleted: 0,
    failed: [] as string[],
  }

  for (const fileUrl of fileUrls) {
    const success = await deleteFromSupabaseStorage(fileUrl)
    if (success) {
      result.deleted++
    } else {
      result.failed.push(fileUrl)
    }
  }

  return result
}

/**
 * Upload a file to the media bucket
 * @param file - File to upload
 * @param customPath - Optional custom path within the bucket
 * @returns public URL of the uploaded file
 */
export async function uploadToMediaBucket(file: File, customPath?: string): Promise<string> {
  try {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Determine subdirectory based on file type
    let subDir = 'documents'
    if (file.type.startsWith('image/')) {
      subDir = 'images'
    } else if (file.type.startsWith('video/')) {
      subDir = 'videos'
    } else if (file.type.startsWith('audio/')) {
      subDir = 'audio'
    }

    const filePath = customPath || `${subDir}/${fileName}`

    console.log('Uploading to media bucket:', filePath)

    const { error } = await supabaseAdmin.storage.from('media').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('media').getPublicUrl(filePath)

    console.log('File uploaded to media bucket:', publicUrlData.publicUrl)
    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error uploading to media bucket:', error)
    throw error
  }
}

/**
 * Upload a file to the certificates bucket
 * @param file - File to upload
 * @param customPath - Optional custom path within the bucket
 * @returns public URL of the uploaded file
 */
export async function uploadToCertificatesBucket(file: File, customPath?: string): Promise<string> {
  try {
    const fileName = customPath || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = fileName

    console.log('Uploading to certificates bucket:', filePath)

    const { error } = await supabaseAdmin.storage.from('certificates').upload(filePath, file, {
      cacheControl: '0', // No caching for certificates
      upsert: true, // Allow overwriting
    })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('certificates')
      .getPublicUrl(filePath)

    console.log('File uploaded to certificates bucket:', publicUrlData.publicUrl)
    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error uploading to certificates bucket:', error)
    throw error
  }
}

/**
 * Upload a file to the certificate-templates bucket
 * @param file - File to upload
 * @param customPath - Optional custom path within the bucket
 * @returns public URL of the uploaded file
 */
export async function uploadToCertificateTemplatesBucket(
  file: File,
  customPath?: string,
): Promise<string> {
  try {
    const fileName = customPath || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = fileName

    console.log('Uploading to certificate-templates bucket:', filePath)

    const { error } = await supabaseAdmin.storage
      .from('certificate-templates')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('certificate-templates')
      .getPublicUrl(filePath)

    console.log('File uploaded to certificate-templates bucket:', publicUrlData.publicUrl)
    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error uploading to certificate-templates bucket:', error)
    throw error
  }
}

/**
 * Validate that a URL belongs to a specific bucket
 */
export function isFromBucket(fileUrl: string, bucket: StorageBucket): boolean {
  const storageInfo = extractStorageInfo(fileUrl)
  return storageInfo?.bucket === bucket
}

/**
 * Get all files in a specific bucket (for cleanup operations)
 */
export async function listFilesInBucket(bucket: StorageBucket, path?: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(path || '', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

    if (error) {
      console.error(`Error listing files in ${bucket}:`, error)
      return []
    }

    return data.map((file) => file.name)
  } catch (error) {
    console.error('Error listing files in bucket:', error)
    return []
  }
}
