import { supabaseAdmin } from './supabase'

interface UploadResult {
  id: string
  filename: string
  url: string
  size: number
  type: string
}

export async function uploadFiles(files: File[]): Promise<UploadResult[]> {
  try {
    // For now, we'll use a direct approach to upload to UploadThing
    // This is a placeholder for the actual UploadThing client integration

    const uploadPromises = files.map(async (file): Promise<UploadResult> => {
      // Create form data for UploadThing
      const formData = new FormData()
      formData.append('files', file)

      // Upload to UploadThing mediaUploader endpoint
      const response = await fetch('/api/uploadthing?slug=mediaUploader', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Upload failed for ${file.name}: ${error}`)
      }

      const result = await response.json()

      // Return standardized format
      return {
        id: result.mediaId || `upload-${Date.now()}`,
        filename: file.name,
        url: result.url || result.fileUrl,
        size: file.size,
        type: file.type,
      }
    })

    const results = await Promise.all(uploadPromises)
    return results
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Alternative: Direct Supabase storage upload (if UploadThing is not available)
export async function uploadFilesDirectly(files: File[]): Promise<UploadResult[]> {
  try {
    const results: UploadResult[] = []

    for (const file of files) {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filepath = `media/${filename}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from('media-files')
        .upload(filepath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from('media-files').getPublicUrl(filepath)

      // Determine file category
      const getFileCategory = (type: string): string => {
        if (type.startsWith('image/')) return 'image'
        if (type.startsWith('video/')) return 'video'
        if (type.startsWith('audio/')) return 'audio'
        return 'document'
      }

      // Save to database
      const { data: mediaData, error: dbError } = await supabaseAdmin
        .from('media_files')
        .insert({
          filename: filename,
          original_name: file.name,
          file_type: file.type,
          file_category: getFileCategory(file.type),
          mime_type: file.type,
          file_size: file.size,
          file_url: publicUrl,
          title: file.name.split('.')[0],
          alt_text: file.name.split('.')[0],
          uploaded_by: 'admin', // TODO: Get actual user ID
          metadata: {
            uploadType: 'media_management',
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        })
        .select()
        .single()

      if (dbError) {
        throw new Error(`Failed to save ${file.name} to database: ${dbError.message}`)
      }

      results.push({
        id: mediaData.id,
        filename: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
      })
    }

    return results
  } catch (error) {
    console.error('Direct upload error:', error)
    throw error
  }
}
