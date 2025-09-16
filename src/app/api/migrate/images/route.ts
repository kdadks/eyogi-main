import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { UTApi } from 'uploadthing/server'

export const dynamic = 'force-dynamic'

// Set a longer timeout for this intensive operation
export const maxDuration = 300 // 5 minutes

// Initialize UploadThing API
const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting bulk image migration to UploadThing...')

    const config = await configPromise
    const payload = await getPayload({ config })

    // Get request parameters
    const body = await request.json().catch(() => ({}))
    const {
      dryRun = true, // Default to dry run for safety
      limit = 10, // Process in batches
      offset = 0, // For pagination
    } = body

    console.log('📋 Migration Parameters:', { dryRun, limit, offset })

    // Check UploadThing configuration
    const uploadthingToken = process.env.UPLOADTHING_TOKEN
    if (!uploadthingToken) {
      throw new Error('UPLOADTHING_TOKEN not configured')
    }

    // Fetch media records that are stored in database (not UploadThing)
    const mediaRecords = await payload.find({
      collection: 'media',
      limit,
      page: Math.floor(offset / limit) + 1,
      where: {
        url: {
          like: '/api/media/',
        },
      },
    })

    console.log(`📊 Found ${mediaRecords.docs.length} database-stored images to migrate`)

    const migrationResults: Array<{
      id: number
      filename: string | null | undefined
      originalUrl: string | null | undefined
      status: string
      newUrl: string | null
      error: string | null
    }> = []
    let successCount = 0
    let errorCount = 0

    for (const media of mediaRecords.docs) {
      try {
        console.log(`🔄 Processing: ${media.filename}`)

        const result = {
          id: media.id,
          filename: media.filename,
          originalUrl: media.url,
          status: 'pending',
          newUrl: null as string | null,
          error: null as string | null,
        }

        if (dryRun) {
          result.status = 'dry-run-only'
          result.newUrl = `https://utfs.io/f/would-be-uploaded-${media.filename}`
          console.log(`🔍 DRY RUN: Would migrate ${media.filename}`)
        } else {
          // Real migration: Download from database and upload to UploadThing
          try {
            console.log(`📥 Downloading ${media.filename} from database...`)

            // Properly construct the image URL with encoding
            const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://eyogi-main.vercel.app'
            const imageUrl = media.url?.startsWith('http') ? media.url : `${baseUrl}${media.url}`

            console.log(`🔗 Fetching from: ${imageUrl}`)

            // Fetch the image data from PayloadCMS with proper headers
            const imageResponse = await fetch(imageUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'Migration Bot',
              },
              // Add timeout to prevent hanging
              signal: AbortSignal.timeout(30000), // 30 second timeout
            })

            if (!imageResponse.ok) {
              console.error(
                `❌ Fetch failed for ${media.filename}: ${imageResponse.status} ${imageResponse.statusText}`,
              )
              throw new Error(
                `Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`,
              )
            }

            const contentType =
              imageResponse.headers.get('content-type') || media.mimeType || 'image/jpeg'
            console.log(
              `📄 Content-Type: ${contentType}, Size: ${imageResponse.headers.get('content-length')} bytes`,
            )

            const imageBuffer = await imageResponse.arrayBuffer()

            if (imageBuffer.byteLength === 0) {
              throw new Error('Downloaded image is empty')
            }

            const imageFile = new File([imageBuffer], media.filename || 'unknown.jpg', {
              type: contentType,
            })

            console.log(
              `📤 Uploading ${media.filename} (${imageBuffer.byteLength} bytes) to UploadThing...`,
            )

            // Upload to UploadThing
            const uploadResult = await utapi.uploadFiles([imageFile])

            if (uploadResult[0]?.data?.url) {
              const newUrl = uploadResult[0].data.url

              console.log(`✅ Uploaded successfully: ${newUrl}`)

              // Update the media record in the database
              await payload.update({
                collection: 'media',
                id: media.id,
                data: {
                  url: newUrl,
                },
              })

              result.status = 'success'
              result.newUrl = newUrl
              console.log(`🔄 Updated database record for ${media.filename}`)
            } else {
              throw new Error('UploadThing upload failed - no URL returned')
            }
          } catch (uploadError) {
            console.error(`❌ Migration failed for ${media.filename}:`, uploadError)
            result.status = 'error'
            result.error = uploadError instanceof Error ? uploadError.message : 'Upload failed'
          }
        }

        migrationResults.push(result)
        successCount++
      } catch (error) {
        console.error(`❌ Failed to process ${media.filename}:`, error)

        migrationResults.push({
          id: media.id,
          filename: media.filename,
          originalUrl: media.url,
          status: 'error',
          newUrl: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        errorCount++
      }
    }

    const response = {
      success: true,
      migrationSummary: {
        dryRun,
        totalProcessed: migrationResults.length,
        successCount,
        errorCount,
        remainingImages: mediaRecords.totalDocs - (offset + limit),
        hasMore: mediaRecords.hasNextPage,
      },
      migrationResults,
      nextSteps: dryRun
        ? [
            'Review the migration plan above',
            'Run with {"dryRun": false} to execute real migration',
            'Process in batches with offset parameter',
          ]
        : [
            'Migration attempted (but needs UploadThing SDK implementation)',
            'Check individual results for errors',
            'Continue with next batch if needed',
          ],
      usage: {
        dryRunExample: 'POST with {"dryRun": true, "limit": 5}',
        realMigrationExample: 'POST with {"dryRun": false, "limit": 10, "offset": 0}',
        batchProcessing: 'Use offset to process in chunks: 0, 10, 20, etc.',
      },
    }

    console.log('✅ Migration batch completed:', response.migrationSummary)
    return NextResponse.json(response)
  } catch (error) {
    console.error('💥 Migration failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET(_request: NextRequest) {
  // Get migration status and instructions
  try {
    const config = await configPromise
    const payload = await getPayload({ config })

    // Count database-stored vs UploadThing images
    const totalMedia = await payload.count({ collection: 'media' })

    const databaseImages = await payload.count({
      collection: 'media',
      where: {
        url: {
          like: '/api/media/',
        },
      },
    })

    const uploadthingImages = await payload.count({
      collection: 'media',
      where: {
        url: {
          like: 'https://utfs.io/',
        },
      },
    })

    const response = {
      migrationStatus: {
        totalImages: totalMedia.totalDocs,
        databaseStored: databaseImages.totalDocs,
        uploadthingStored: uploadthingImages.totalDocs,
        needsMigration: databaseImages.totalDocs > 0,
      },
      instructions: {
        description: 'Bulk migrate database-stored images to UploadThing CDN',
        dryRun: 'POST with {"dryRun": true} to see migration plan',
        execute: 'POST with {"dryRun": false} to run real migration',
        batchSize: 'Use "limit" parameter to control batch size (default: 10)',
        offset: 'Use "offset" parameter for pagination (0, 10, 20, etc.)',
      },
      environment: {
        hasUploadThingToken: !!process.env.UPLOADTHING_TOKEN,
        nodeEnv: process.env.NODE_ENV,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to get migration status:', error)
    return NextResponse.json(
      {
        error: 'Failed to get migration status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
