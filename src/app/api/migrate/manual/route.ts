import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 Starting manual re-upload migration...')

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
      limit: 50,
      depth: 0,
    })

    console.log(`📊 Found ${databaseImages.docs.length} database images to migrate`)

    const migrationInstructions = databaseImages.docs.map((media, index) => {
      return {
        step: index + 1,
        id: media.id,
        filename: media.filename,
        currentUrl: media.url,
        mimeType: media.mimeType,
        filesize: media.filesize,
        instructions: [
          '1. Download this image manually (if possible)',
          '2. Go to PayloadCMS Admin: https://eyogi-main.vercel.app/admin/collections/media',
          `3. Find and edit media record: ${media.filename}`,
          '4. Upload the same image file again',
          '5. Save - it will automatically get UploadThing URL',
        ],
        alternativeAction: 'Replace with similar stock image from internet',
      }
    })

    const response = {
      success: true,
      message: 'Manual migration guide generated',
      totalImagesToMigrate: databaseImages.docs.length,
      migrationMethod: 'MANUAL_REUPLOAD',
      reason: 'Database images cannot be automatically fetched on Vercel serverless',
      adminUrl: 'https://eyogi-main.vercel.app/admin/collections/media',
      instructions: migrationInstructions.slice(0, 10), // Show first 10
      summary: {
        nextSteps: [
          '1. Go to PayloadCMS admin panel',
          '2. Edit each media record and re-upload the file',
          '3. The new upload will automatically use UploadThing',
          '4. Delete the old database-stored version',
        ],
        estimatedTime: `${Math.ceil(databaseImages.docs.length / 10)} hours (10 images per hour)`,
        priority: 'Replace most important/visible images first',
      },
    }

    console.log('📋 Manual migration guide created')
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Manual migration guide error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate migration guide',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'Manual migration endpoint',
    usage: 'POST to this endpoint to get manual migration instructions',
    note: 'Automatic migration failed due to Vercel serverless limitations',
  })
}
