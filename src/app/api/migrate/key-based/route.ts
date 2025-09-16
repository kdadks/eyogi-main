import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { UTApi } from 'uploadthing/server'
import type { Media } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
})

interface ExtendedMedia extends Media {
  _key?: string
  prefix?: string
  [key: string]: unknown
}

interface MigrationResult {
  id: number
  filename: string | null | undefined
  originalUrl: string | null | undefined
  status: string
  newUrl: string | null
  error: string | null
  fileKey?: string | null
  method?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting key-based migration to UploadThing...')

    const config = await configPromise
    const payload = await getPayload({ config })

    // Get request parameters
    const body = await request.json().catch(() => ({}))
    const {
      dryRun = true,
      limit = 5, // Start small for testing
      offset = 0,
    } = body

    console.log('📋 Migration Parameters:', { dryRun, limit, offset })

    // Get database-stored images
    const mediaRecords = await payload.find({
      collection: 'media',
      limit,
      page: Math.floor(offset / limit) + 1,
      where: {
        url: {
          like: '/api/media/',
        },
      },
      depth: 0,
    })

    console.log(`📊 Found ${mediaRecords.docs.length} database-stored images`)

    const migrationResults: MigrationResult[] = []
    let successCount = 0
    let errorCount = 0

    for (const media of mediaRecords.docs) {
      try {
        console.log(`🔄 Processing: ${media.filename}`)

        const extendedMedia = media as ExtendedMedia

        console.log('📋 Media record structure:', {
          id: media.id,
          filename: media.filename,
          url: media.url,
          mimeType: media.mimeType,
          filesize: media.filesize,
          hasKey: !!extendedMedia._key,
          hasPrefix: !!extendedMedia.prefix,
          allFields: Object.keys(media),
        })

        const result: MigrationResult = {
          id: media.id,
          filename: media.filename,
          originalUrl: media.url,
          status: 'pending',
          newUrl: null,
          error: null,
          fileKey: extendedMedia._key || null,
        }

        if (dryRun) {
          result.status = 'dry-run-success'
          result.method = 'key-based-simulation'

          // Check if we have a file key to work with
          if (extendedMedia._key) {
            result.newUrl = `https://utfs.io/f/${extendedMedia._key}`
            console.log(`🔍 DRY RUN: Would migrate using key ${extendedMedia._key}`)
          } else {
            // Generate a potential key based on filename
            const potentialKey = `migrated-${Date.now()}-${media.filename?.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            result.newUrl = `https://utfs.io/f/${potentialKey}`
            result.fileKey = potentialKey
            console.log(`🔍 DRY RUN: Would generate new key ${potentialKey}`)
          }

          migrationResults.push(result)
          successCount++
          continue
        }

        // Real migration - try different approaches based on available data
        let migrationSuccess = false

        // Method 1: Try to use existing file key if available
        if (extendedMedia._key && !migrationSuccess) {
          try {
            console.log(`🔑 Attempting migration using existing key: ${extendedMedia._key}`)

            // For now, just update the URL to use the existing key
            // This assumes the file is already in UploadThing but with wrong URL
            const potentialUrl = `https://utfs.io/f/${extendedMedia._key}`

            // Test if this URL works
            const testResponse = await fetch(potentialUrl, { method: 'HEAD' })
            if (testResponse.ok) {
              // Update the database record
              await payload.update({
                collection: 'media',
                id: media.id,
                data: {
                  url: potentialUrl,
                },
              })

              result.status = 'success'
              result.newUrl = potentialUrl
              result.method = 'existing-key-relink'
              migrationSuccess = true
              successCount++
              console.log(`✅ Successfully relinked using existing key: ${potentialUrl}`)
            }
          } catch (error) {
            console.log(`❌ Existing key method failed: ${error}`)
          }
        }

        // Method 2: Download and re-upload with proper key
        if (!migrationSuccess && media.filename) {
          try {
            console.log(`📥 Downloading ${media.filename} for re-upload...`)

            // Try to download the file from the current URL
            const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://eyogi-main.vercel.app'
            const imageUrl = media.url?.startsWith('http') ? media.url : `${baseUrl}${media.url}`

            console.log(`🔗 Fetching from: ${imageUrl}`)

            const imageResponse = await fetch(imageUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'KeyBased-Migration-Bot',
              },
              signal: AbortSignal.timeout(30000),
            })

            if (!imageResponse.ok) {
              throw new Error(`Failed to fetch image: ${imageResponse.status}`)
            }

            const imageBuffer = await imageResponse.arrayBuffer()
            console.log(`📄 Downloaded ${imageBuffer.byteLength} bytes`)

            // Create File object for upload
            const file = new File([imageBuffer], media.filename, {
              type: media.mimeType || 'application/octet-stream',
            })

            // Upload to UploadThing
            console.log(`📤 Uploading to UploadThing...`)
            const uploadResult = await utapi.uploadFiles(file)

            if (uploadResult.data) {
              console.log(`✅ Upload successful: ${uploadResult.data.url}`)

              // Update the database record
              await payload.update({
                collection: 'media',
                id: media.id,
                data: {
                  url: uploadResult.data.url,
                },
              })

              result.status = 'success'
              result.newUrl = uploadResult.data.url
              result.method = 'download-reupload'
              result.fileKey = uploadResult.data.key
              migrationSuccess = true
              successCount++
            } else {
              throw new Error('UploadThing upload failed - no data returned')
            }
          } catch (error) {
            console.log(`❌ Download/reupload method failed: ${error}`)
            result.error = error instanceof Error ? error.message : 'Unknown error'
          }
        }

        if (!migrationSuccess) {
          result.status = 'error'
          result.error = result.error || 'All migration methods failed'
          errorCount++
        }

        migrationResults.push(result)
      } catch (error) {
        console.error(`❌ Error processing ${media.filename}:`, error)
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
      success: successCount > 0 || dryRun,
      migrationSummary: {
        totalProcessed: mediaRecords.docs.length,
        successCount,
        errorCount,
        hasMore: mediaRecords.hasNextPage,
        totalPages: mediaRecords.totalPages,
        currentPage: mediaRecords.page,
      },
      migrationResults,
      configuration: {
        dryRun,
        limit,
        offset,
      },
      nextAction: dryRun
        ? 'Review results and run with dryRun: false to execute migration'
        : `Migration completed. ${successCount} successful, ${errorCount} errors`,
    }

    console.log('📊 Migration Summary:', response.migrationSummary)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Key-based migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Key-based migration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'Key-based migration endpoint',
    usage: 'POST with { dryRun: boolean, limit: number, offset: number }',
    description:
      'Migrates images using existing file keys when available, or downloads and re-uploads with new keys',
    methods: [
      'existing-key-relink: Use existing _key to construct UploadThing URL',
      'download-reupload: Download from database and upload to UploadThing with new key',
    ],
  })
}
