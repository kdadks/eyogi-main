import { supabaseAdmin } from './supabase'

// Upload result interface
interface UploadResult {
  id: string
  filename: string
  url: string
  size: number
  type: string
}

// Helper function to upload files directly to Supabase storage
async function uploadToSupabaseStorage(
  files: File[],
): Promise<Array<{ url: string; filename: string }>> {
  const results = []

  for (const file of files) {
    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${sanitizedName}`

    // Determine storage path based on file type
    const fileType = file.type.startsWith('image/')
      ? 'images'
      : file.type.startsWith('video/')
        ? 'videos'
        : file.type.startsWith('audio/')
          ? 'audio'
          : 'documents'

    const filePath = `${fileType}/${filename}`

    console.log('Uploading to Supabase storage:', filePath)

    // Upload to Supabase storage bucket
    const { data, error } = await supabaseAdmin.storage.from('media').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      console.error('Supabase storage upload error:', error)
      throw new Error(`Failed to upload ${file.name}: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from('media').getPublicUrl(filePath)

    results.push({
      url: urlData.publicUrl,
      filename: filename,
    })
  }

  return results
}

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

// Delete file from Supabase storage
export async function deleteFromStorage(fileUrl: string): Promise<boolean> {
  try {
    // Extract file path from Supabase URL
    // Format: https://[PROJECT].supabase.co/storage/v1/object/public/media/[path]
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split('/public/media/')
    if (pathParts.length < 2) {
      console.error('Could not extract file path from URL:', fileUrl)
      return false
    }

    const filePath = pathParts[1]
    console.log('Deleting from Supabase storage:', filePath)

    const { error } = await supabaseAdmin.storage.from('media').remove([filePath])

    if (error) {
      console.error('Failed to delete from Supabase storage:', error)
      return false
    }

    console.log('Successfully deleted from Supabase storage:', filePath)
    return true
  } catch (error) {
    console.error('Error deleting from Supabase storage:', error)
    return false
  }
}

export async function uploadFilesToStorage(files: File[]): Promise<UploadResult[]> {
  console.log('uploadFilesToStorage called with', files.length, 'files')
  const results: UploadResult[] = []

  if (!files || files.length === 0) {
    console.warn('No files provided to upload')
    return results
  }

  try {
    // Use direct Supabase storage upload instead of UploadThing to avoid API issues
    console.log('Starting Supabase storage upload...')
    const uploadResults = await uploadToSupabaseStorage(files)

    console.log('Supabase storage upload completed:', uploadResults)

    if (!uploadResults || uploadResults.length === 0) {
      throw new Error('Storage upload returned no results')
    }

    for (let i = 0; i < uploadResults.length; i++) {
      const uploadResult = uploadResults[i]
      const originalFile = files[i]

      if (!uploadResult) {
        console.error(`Upload result ${i} is null/undefined`)
        continue
      }

      // Supabase storage result
      const fileUrl = uploadResult.url

      if (!fileUrl) {
        console.error('No file URL in upload result:', uploadResult)
        continue
      }

      console.log('File uploaded successfully to Supabase storage:', fileUrl)

      // Determine file category
      const getFileCategory = (type: string): string => {
        if (type.startsWith('image/')) return 'image'
        if (type.startsWith('video/')) return 'video'
        if (type.startsWith('audio/')) return 'audio'
        return 'document'
      }

      // Generate filename for database
      const filename = uploadResult.filename || `${Date.now()}-${originalFile.name}`

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
        original_name: originalFile.name,
        file_type: originalFile.type,
        file_category: getFileCategory(originalFile.type),
        mime_type: originalFile.type,
        file_size: originalFile.size,
        file_url: fileUrl,
        title: originalFile.name.split('.')[0],
        alt_text: originalFile.name.split('.')[0],
        ...(uploadedBy && { uploaded_by: uploadedBy }), // Only include if we have a valid ID
        metadata: {
          uploadType: 'supabase-storage',
          storageProvider: 'supabase',
          storageBucket: 'media',
          originalName: originalFile.name,
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
        throw new Error(`Failed to save ${uploadResult.filename} to database: ${dbError.message}`)
      }

      if (!mediaData) {
        throw new Error(`Failed to save ${uploadResult.filename}: No data returned from database`)
      }

      console.log('Database record saved:', mediaData)

      const result: UploadResult = {
        id: mediaData.id,
        filename: originalFile.name,
        url: fileUrl,
        size: originalFile.size,
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

// Backward compatibility aliases
export const uploadFilesToUploadThing = uploadFilesToStorage
export const deleteFromUploadThing = deleteFromStorage

export async function uploadWatermarkedFilesToUploadThing(files: File[]): Promise<UploadResult[]> {
  console.log('uploadWatermarkedFilesToUploadThing called with', files.length, 'files')
  const results = []

  try {
    // Use direct Supabase storage for watermarked files
    console.log('Starting Supabase watermark upload...')
    const uploadResults = await uploadToSupabaseStorage(files)

    console.log('Supabase watermark upload completed:', uploadResults)

    for (let i = 0; i < uploadResults.length; i++) {
      const uploadResult = uploadResults[i]
      const originalFile = files[i]

      // For watermarked files, we just return the upload result without database insertion
      // The database update will be handled by the calling function
      results.push({
        id: `watermark-${Date.now()}-${i}`,
        filename: uploadResult.filename,
        url: uploadResult.url,
        size: originalFile.size,
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
