import { supabaseAdmin } from './supabase'
import { genUploader } from 'uploadthing/client'

// Upload result interface
interface UploadResult {
  id: string
  filename: string
  url: string
  size: number
  type: string
}

// Create UploadThing client with environment-based URL
const getUploadThingUrl = () => {
  if (import.meta.env.PROD) {
    // In production, use the current domain's API to avoid CORS issues
    const currentOrigin =
      typeof window !== 'undefined' ? window.location.origin : 'https://www.eyogigurukul.com'
    const apiUrl = import.meta.env.VITE_API_URL || `${currentOrigin}/api`
    const uploadUrl = `${apiUrl}/uploadthing`
    console.log('UploadThing URL (production):', uploadUrl)
    return uploadUrl
  }
  // In development, use the local Next.js server
  const devUrl = 'http://localhost:3000/api/uploadthing'
  console.log('UploadThing URL (development):', devUrl)
  return devUrl
}

const uploadThingUrl = getUploadThingUrl()
console.log('Initializing UploadThing client with URL:', uploadThingUrl)

const { uploadFiles } = genUploader({
  url: uploadThingUrl,
})

// Extract UploadThing file key from URL
export function extractUploadThingKey(url: string): string | null {
  try {
    // UploadThing URLs format: https://utfs.io/f/{fileKey}
    const match = url.match(/\/f\/([^/?]+)/)
    return match ? match[1] : null
  } catch (error) {
    console.error('Error extracting UploadThing key:', error)
    return null
  }
}

// Delete file from UploadThing
export async function deleteFromUploadThing(fileUrl: string): Promise<boolean> {
  try {
    const fileKey = extractUploadThingKey(fileUrl)
    if (!fileKey) {
      console.error('Could not extract file key from URL:', fileUrl)
      return false
    }

    console.log('Deleting from UploadThing:', fileKey)

    // Call our backend to delete from UploadThing
    const response = await fetch(`${getUploadThingUrl()}?actionType=delete&fileKey=${fileKey}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      console.log('Successfully deleted from UploadThing:', fileKey)
      return true
    } else {
      console.error('Failed to delete from UploadThing:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.error('Error deleting from UploadThing:', error)
    return false
  }
}

export async function uploadFilesToUploadThing(files: File[]): Promise<UploadResult[]> {
  console.log('uploadFilesToUploadThing called with', files.length, 'files')
  const results: UploadResult[] = []

  if (!files || files.length === 0) {
    console.warn('No files provided to upload')
    return results
  }

  try {
    // Use UploadThing client SDK to upload files
    console.log('Starting UploadThing upload...')
    const uploadResults = await uploadFiles('imageUploader', { files })

    console.log('UploadThing upload completed:', uploadResults)

    if (!uploadResults || uploadResults.length === 0) {
      throw new Error('UploadThing returned no results')
    }

    for (let i = 0; i < uploadResults.length; i++) {
      const uploadResult = uploadResults[i]
      const originalFile = files[i]

      if (!uploadResult) {
        console.error(`Upload result ${i} is null/undefined`)
        continue
      }

      // UploadResult is now directly the file data
      const fileUrl = uploadResult.ufsUrl || uploadResult.url // Use ufsUrl (new) or fallback to url

      if (!fileUrl) {
        console.error('No file URL in upload result:', uploadResult)
        continue
      }

      console.log('File uploaded successfully to UploadThing:', fileUrl)

      // Determine file category
      const getFileCategory = (type: string): string => {
        if (type.startsWith('image/')) return 'image'
        if (type.startsWith('video/')) return 'video'
        if (type.startsWith('audio/')) return 'audio'
        return 'document'
      }

      // Generate filename for database
      const filename = `${Date.now()}-${uploadResult.name}`

      // Get a valid user ID from profiles table
      console.log('Finding valid user ID from profiles table...')
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .limit(1)

      let uploadedBy = null
      if (profileError) {
        console.warn('Could not fetch profiles:', profileError)
        // Try to create a default admin profile or use null
      } else if (profiles && profiles.length > 0) {
        uploadedBy = profiles[0].id
        console.log('Using user ID:', uploadedBy)
      } else {
        console.log('No profiles found in database')
      }

      // Save to database
      console.log('Saving file metadata to database...')
      const mediaRecord = {
        filename: filename,
        original_name: uploadResult.name,
        file_type: originalFile.type,
        file_category: getFileCategory(originalFile.type),
        mime_type: originalFile.type,
        file_size: uploadResult.size,
        file_url: fileUrl,
        title: uploadResult.name.split('.')[0],
        alt_text: uploadResult.name.split('.')[0],
        ...(uploadedBy && { uploaded_by: uploadedBy }), // Only include if we have a valid ID
        metadata: {
          uploadType: 'uploadthing',
          originalName: uploadResult.name,
          uploadedAt: new Date().toISOString(),
        },
      }
      console.log('Database record to insert:', mediaRecord)

      const { data: mediaData, error: dbError } = await supabaseAdmin
        .from('media_files')
        .insert(mediaRecord)
        .select()
        .single()

      if (dbError) {
        console.error('Database insertion error:', dbError)
        throw new Error(`Failed to save ${uploadResult.name} to database: ${dbError.message}`)
      }

      if (!mediaData) {
        throw new Error(`Failed to save ${uploadResult.name}: No data returned from database`)
      }

      console.log('Database record saved:', mediaData)

      const result: UploadResult = {
        id: mediaData.id,
        filename: uploadResult.name,
        url: fileUrl,
        size: uploadResult.size,
        type: originalFile.type,
      }

      console.log('File upload result:', result)
      results.push(result)
    }
  } catch (error) {
    console.error(`Error during upload process:`, error)
    throw error
  }

  console.log('All files processed successfully:', results)
  return results
}

export async function uploadWatermarkedFilesToUploadThing(files: File[]): Promise<UploadResult[]> {
  console.log('uploadWatermarkedFilesToUploadThing called with', files.length, 'files')
  const results = []

  try {
    // Use UploadThing client SDK to upload watermarked files
    console.log('Starting UploadThing watermark upload...')
    const uploadResults = await uploadFiles('watermarkUploader', { files })

    console.log('UploadThing watermark upload completed:', uploadResults)

    for (let i = 0; i < uploadResults.length; i++) {
      const uploadResult = uploadResults[i]
      const originalFile = files[i]

      // For watermarked files, we just return the upload result without database insertion
      // The database update will be handled by the calling function
      results.push({
        id: uploadResult.key || `watermark-${Date.now()}-${i}`,
        filename: uploadResult.name,
        url: uploadResult.ufsUrl || uploadResult.url, // Use ufsUrl (new) or fallback to url
        size: uploadResult.size,
        type: originalFile.type, // Preserve original file type
      })
    }
  } catch (error) {
    console.error(`Error during watermark upload process:`, error)
    throw error
  }

  console.log('All watermarked files processed successfully:', results)
  return results
}

// Configuration for direct UploadThing usage (if we still want to use UploadThing service)
export const uploadthingConfig = {
  // This would need to be configured to point to your UploadThing app
  // For now, we'll use direct Supabase upload instead
}
