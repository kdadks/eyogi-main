import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { UTApi } from 'uploadthing/server'

const utapi = new UTApi()

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 Starting database-direct migration...')

    const config = await configPromise
    const payload = await getPayload({ config })

    // Get all database-stored images
    const databaseImages = await payload.find({
      collection: 'media',
      where: {
        url: {
          like: '/api/media/',
        },
      },
      limit: 5, // Start with just 5 to test
      depth: 0,
    })

    console.log(`📊 Found ${databaseImages.docs.length} database images to migrate`)

    let successCount = 0
    let errorCount = 0
    const results = []

    for (const media of databaseImages.docs) {
      try {
        console.log(`🔄 Processing: ${media.filename}`)

        // Try to access file data directly from the media record
        console.log('📋 Media record structure:', {
          id: media.id,
          filename: media.filename,
          url: media.url,
          mimeType: media.mimeType,
          filesize: media.filesize,
          hasData: !!media.data,
          hasSizes: !!media.sizes,
          additionalFields: Object.keys(media).filter(
            (key) =>
              !['id', 'filename', 'url', 'mimeType', 'filesize', 'createdAt', 'updatedAt'].includes(
                key,
              ),
          ),
        })

        // Check if we can find the actual file data
        if (media.data) {
          console.log('📄 Found data field, attempting UploadThing upload...')

          // Try to upload to UploadThing
          const file = new File([media.data], media.filename, {
            type: media.mimeType,
          })

          const uploadResult = await utapi.uploadFiles(file)

          if (uploadResult.data) {
            console.log(`✅ Uploaded to UploadThing: ${uploadResult.data.url}`)

            // Update the media record with new URL
            await payload.update({
              collection: 'media',
              id: media.id,
              data: {
                url: uploadResult.data.url,
              },
            })

            successCount++
            results.push({
              id: media.id,
              filename: media.filename,
              status: 'success',
              oldUrl: media.url,
              newUrl: uploadResult.data.url,
            })
          } else {
            throw new Error('UploadThing upload failed')
          }
        } else {
          console.log('❌ No data field found in media record')
          errorCount++
          results.push({
            id: media.id,
            filename: media.filename,
            status: 'error',
            error: 'No file data found in database record',
          })
        }
      } catch (error) {
        console.error(`❌ Error migrating ${media.filename}:`, error)
        errorCount++
        results.push({
          id: media.id,
          filename: media.filename,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const response = {
      success: successCount > 0,
      message: `Migration attempt complete: ${successCount} success, ${errorCount} errors`,
      successCount,
      errorCount,
      totalProcessed: databaseImages.docs.length,
      results,
      databaseStructureAnalysis: 'Checked for direct file data access in database records',
    }

    console.log('📊 Final result:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Database migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Database migration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'Database-direct migration endpoint',
    usage: 'POST to this endpoint to attempt direct database file access',
    note: 'This attempts to access file data directly from PayloadCMS database records',
  })
}
