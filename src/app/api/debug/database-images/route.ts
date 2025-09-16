import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const config = await configPromise
    const payload = await getPayload({ config })

    // Get media records that are still using database URLs
    const databaseImages = await payload.find({
      collection: 'media',
      where: {
        url: {
          like: '/api/media/',
        },
      },
      limit: 20,
      depth: 0,
    })

    console.log(`🔍 Found ${databaseImages.docs.length} database-stored images`)

    const analysis = databaseImages.docs.map((media) => {
      const baseUrl = 'https://eyogi-main.vercel.app'
      const fullUrl = `${baseUrl}${media.url}`

      return {
        id: media.id,
        filename: media.filename,
        originalUrl: media.url,
        fullUrl: fullUrl,
        mimeType: media.mimeType,
        filesize: media.filesize,
        status: 'needs_migration',
      }
    })

    const response = {
      success: true,
      message: 'Database images analysis',
      totalDatabaseImages: databaseImages.docs.length,
      sampleImages: analysis,
      issue:
        'These images are stored in database but cannot be served by Vercel serverless functions',
      solution: 'Images need to be manually re-uploaded through admin panel to use UploadThing',
      adminUrl: 'https://eyogi-main.vercel.app/admin/collections/media',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Database image analysis error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze database images',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
