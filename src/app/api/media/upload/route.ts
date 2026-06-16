/**
 * POST /api/media/upload
 * Upload file to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, getUserIdFromRequest } from '@/lib/api-utils'
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage'

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(errorResponse('No file provided'), { status: 400 })
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(errorResponse('File too large (max 50MB)'), { status: 400 })
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const { error: uploadError } = await uploadFile(file, fileName, {
      bucket: 'MEDIA',
      contentType: file.type,
    })

    if (uploadError) {
      return NextResponse.json(errorResponse(uploadError), { status: 400 })
    }

    // Create media record in database
    const supabase = createAdminClient()
    const { data: mediaData, error: dbError } = await supabase
      .from('media')
      .insert({
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        storage_path: fileName,
        uploaded_by: userId,
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json(errorResponse(dbError.message), { status: 400 })
    }

    // Get public URL
    const publicUrl = getPublicUrl(fileName)

    return NextResponse.json(
      successResponse(
        {
          id: mediaData.id,
          filename: mediaData.filename,
          size: mediaData.size_bytes,
          url: publicUrl,
          storage_path: mediaData.storage_path,
        },
        'File uploaded successfully',
      ),
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
