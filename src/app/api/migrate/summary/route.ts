import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    console.log('📊 Generating migration summary report...')

    const config = await configPromise
    const payload = await getPayload({ config })

    // Check total media count
    const allMedia = await payload.find({
      collection: 'media',
      limit: 1000,
      depth: 0,
    })

    // Count by URL pattern
    const urlCounts = {
      uploadthing: 0,
      database: 0,
      other: 0
    }

    const urlSamples = {
      uploadthing: [] as string[],
      database: [] as string[],
      other: [] as string[]
    }

    for (const media of allMedia.docs) {
      if (media.url) {
        if (media.url.includes('utfs.io')) {
          urlCounts.uploadthing++
          if (urlSamples.uploadthing.length < 3) {
            urlSamples.uploadthing.push(media.url)
          }
        } else if (media.url.includes('/api/media/')) {
          urlCounts.database++
          if (urlSamples.database.length < 3) {
            urlSamples.database.push(media.url)
          }
        } else {
          urlCounts.other++
          if (urlSamples.other.length < 3) {
            urlSamples.other.push(media.url)
          }
        }
      }
    }

    const migrationStatus = {
      isComplete: urlCounts.database === 0,
      completionPercentage: urlCounts.uploadthing / (urlCounts.uploadthing + urlCounts.database + urlCounts.other) * 100,
      totalImages: allMedia.docs.length,
      imageSources: urlCounts,
      urlSamples,
      summary: urlCounts.database === 0 
        ? '✅ Migration Complete! All images now use UploadThing CDN'
        : `⚠️ Migration In Progress: ${urlCounts.database} images still need migration`,
      benefits: [
        '🚀 Faster image loading via CDN',
        '🔒 Reliable file serving on Vercel',
        '📱 Better mobile performance',
        '🌍 Global edge distribution',
        '💾 Reduced database load'
      ],
      nextSteps: urlCounts.database === 0 
        ? [
            'All images successfully migrated to UploadThing',
            'Website images now load from CDN for better performance',
            'No further action needed - migration complete!'
          ]
        : [
            `Run migration for remaining ${urlCounts.database} images`,
            'Test website functionality across all pages',
            'Monitor image loading performance'
          ]
    }

    console.log('📋 Migration Summary:', {
      total: migrationStatus.totalImages,
      uploadthing: urlCounts.uploadthing,
      database: urlCounts.database,
      complete: migrationStatus.isComplete
    })

    return NextResponse.json({
      success: true,
      message: 'Migration summary generated',
      migrationStatus,
      timestamp: new Date().toISOString(),
      adminPanel: 'https://eyogi-main.vercel.app/admin/collections/media'
    })

  } catch (error) {
    console.error('❌ Migration summary error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate migration summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}