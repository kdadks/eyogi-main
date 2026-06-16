import { supabaseAdmin } from './supabase'

interface UploadResult {
  id: string
  filename: string
  url: string
  size: number
  type: string
}

// Direct Supabase storage upload - Primary upload method
export async function uploadFiles(files: File[]): Promise<UploadResult[]> {
  try {
    const results: UploadResult[] = []

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

      const filepath = `${fileType}/${filename}`

      console.log('Uploading to Supabase storage:', filepath)

      // Upload to Supabase Storage bucket 'media'
      const { error: uploadError } = await supabaseAdmin.storage
        .from('media')
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
      } = supabaseAdmin.storage.from('media').getPublicUrl(filepath)

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
            uploadType: 'supabase-storage',
            storageProvider: 'supabase',
            storageBucket: 'media',
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
