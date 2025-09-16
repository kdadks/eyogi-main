import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { UTApi } from 'uploadthing/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
})

interface RecoveryResult {
  id: number
  filename: string | null | undefined
  currentUrl: string | null | undefined
  status: string
  newUrl: string | null
  error: string | null
  method: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚑 Starting recovery migration - actually upload files to UploadThing...')

    const config = await configPromise
    const payload = await getPayload({ config })

    const body = await request.json().catch(() => ({}))
    const { dryRun = true, limit = 3 } = body

    // Find images that have UploadThing URLs but files don't exist in UploadThing
    const brokenImages = await payload.find({
      collection: 'media',
      limit,
      where: {
        url: {
          like: 'https://utfs.io/',
        },
      },
      depth: 0,
    })

    console.log(`🔍 Found ${brokenImages.docs.length} images with UploadThing URLs`)

    const recoveryResults: RecoveryResult[] = []
    let successCount = 0
    let errorCount = 0

    for (const media of brokenImages.docs) {
      try {
        console.log(`🔄 Recovering: ${media.filename}`)

        const result: RecoveryResult = {
          id: media.id,
          filename: media.filename,
          currentUrl: media.url,
          status: 'pending',
          newUrl: null,
          error: null,
          method: 'recovery',
        }

        if (dryRun) {
          result.status = 'dry-run-recovery'
          result.method = 'would-revert-and-upload'
          result.newUrl = 'Would revert to /api/media/ then upload to UploadThing'
          recoveryResults.push(result)
          successCount++
          continue
        }

        // Recovery strategy: revert to original database URL then properly upload
        console.log(`🔙 Reverting ${media.filename} to database URL...`)

        // Try to construct original database URL
        const originalUrl = `/api/media/file/${encodeURIComponent(media.filename || '')}`

        // Update to original URL first
        await payload.update({
          collection: 'media',
          id: media.id,
          data: {
            url: originalUrl,
          },
        })

        console.log(`📥 Now downloading ${media.filename} from database...`)

        // Try to download from the database URL
        const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://eyogi-main.vercel.app'
        const downloadUrl = `${baseUrl}${originalUrl}`

        console.log(`🔗 Fetching from: ${downloadUrl}`)

        const imageResponse = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Recovery-Migration-Bot',
            'Cache-Control': 'no-cache',
          },
          signal: AbortSignal.timeout(30000),
        })

        if (!imageResponse.ok) {
          throw new Error(`Failed to download: ${imageResponse.status} ${imageResponse.statusText}`)
        }

        const imageBuffer = await imageResponse.arrayBuffer()
        console.log(`📄 Downloaded ${imageBuffer.byteLength} bytes`)

        // Now upload to UploadThing properly
        const file = new File([imageBuffer], media.filename || 'unknown.jpg', {
          type: media.mimeType || 'image/jpeg',
        })

        console.log(`📤 Uploading ${media.filename} to UploadThing...`)
        const uploadResult = await utapi.uploadFiles(file)

        if (uploadResult.data) {
          console.log(`✅ Successfully uploaded: ${uploadResult.data.url}`)

          // Update with the real UploadThing URL
          await payload.update({
            collection: 'media',
            id: media.id,
            data: {
              url: uploadResult.data.url,
            },
          })

          result.status = 'success'
          result.newUrl = uploadResult.data.url
          result.method = 'revert-download-upload'
          successCount++
        } else {
          throw new Error('UploadThing upload failed - no data returned')
        }

        recoveryResults.push(result)
      } catch (error) {
        console.error(`❌ Recovery failed for ${media.filename}:`, error)

        // Try to revert to original URL if upload failed
        try {
          const originalUrl = `/api/media/file/${encodeURIComponent(media.filename || '')}`
          await payload.update({
            collection: 'media',
            id: media.id,
            data: {
              url: originalUrl,
            },
          })
          console.log(`🔙 Reverted ${media.filename} to database URL`)
        } catch (revertError) {
          console.error(`❌ Failed to revert ${media.filename}:`, revertError)
        }

        recoveryResults.push({
          id: media.id,
          filename: media.filename,
          currentUrl: media.url,
          status: 'error',
          newUrl: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          method: 'recovery-failed',
        })
        errorCount++
      }
    }

    const response = {
      success: successCount > 0 || dryRun,
      message: dryRun
        ? `Dry run: Would recover ${brokenImages.docs.length} broken images`
        : `Recovery complete: ${successCount} successful, ${errorCount} failed`,
      recoverySummary: {
        totalProcessed: brokenImages.docs.length,
        successCount,
        errorCount,
        totalBrokenImages: brokenImages.totalDocs,
        hasMore: brokenImages.hasNextPage,
      },
      recoveryResults,
      explanation: {
        problem: 'Previous migration only changed URLs but did not upload files to UploadThing',
        solution: 'Revert to database URLs, download files, then properly upload to UploadThing',
        note: 'This will create actual files in UploadThing storage',
      },
      nextSteps: dryRun
        ? ['Review results', 'Run with dryRun: false to execute recovery']
        : ['Check UploadThing portal for uploaded files', 'Test image loading on website'],
    }

    console.log('🚑 Recovery Summary:', response.recoverySummary)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Recovery migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Recovery migration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Check database connectivity and UploadThing configuration',
      },
      { status: 500 },
    )
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'Recovery migration endpoint',
    purpose: 'Fix broken UploadThing URLs by actually uploading files',
    usage: 'POST with { dryRun: boolean, limit: number }',
    description:
      'Reverts broken UploadThing URLs back to database, downloads files, then properly uploads to UploadThing',
  })
}
