import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Performing safe bulk deletion...')

    const config = await configPromise
    const payload = await getPayload({ config })

    const body = await request.json().catch(() => ({}))
    const { deleteAll = false, mediaIds = [], batchSize = 5, dryRun = true } = body

    let targetIds = mediaIds

    // If deleteAll is true, get all media IDs
    if (deleteAll && mediaIds.length === 0) {
      console.log('📋 Getting all media for bulk deletion...')
      const allMedia = await payload.find({
        collection: 'media',
        limit: 1000, // Reasonable limit
        depth: 0,
      })
      targetIds = allMedia.docs.map((media) => media.id)
      console.log(`📊 Found ${targetIds.length} media files for deletion`)
    }

    if (targetIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No media IDs provided',
        usage: 'POST with { "mediaIds": [1,2,3] } or { "deleteAll": true }',
      })
    }

    const result = {
      totalRequested: targetIds.length,
      batchSize,
      batches: Math.ceil(targetIds.length / batchSize),
      processed: 0,
      successful: 0,
      errors: 0,
      details: [] as Array<{
        batch: number
        ids: number[]
        status: string
        error?: string
        deletedCount?: number
      }>,
    }

    if (dryRun) {
      result.details.push({
        batch: 0,
        ids: targetIds.slice(0, 5), // Show first 5 as example
        status: 'dry-run-preview',
        deletedCount: 0,
      })

      return NextResponse.json({
        success: true,
        message: `DRY RUN: Would delete ${targetIds.length} media files in ${result.batches} batches`,
        result,
        nextStep: 'Set dryRun: false to execute actual deletion',
        warning: 'This will permanently delete media files!',
      })
    }

    // Process in batches to avoid timeouts
    for (let i = 0; i < targetIds.length; i += batchSize) {
      const batchIds = targetIds.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1

      console.log(`🔄 Processing batch ${batchNumber}/${result.batches}: ${batchIds.length} items`)

      try {
        // Method 1: Try individual deletions in batch (most reliable)
        let batchSuccessful = 0
        const batchErrors: Array<{ id: number; error: string }> = []

        for (const mediaId of batchIds) {
          try {
            await payload.delete({
              collection: 'media',
              id: mediaId,
            })
            batchSuccessful++
            result.successful++
          } catch (deleteError) {
            result.errors++
            batchErrors.push({
              id: mediaId,
              error: deleteError instanceof Error ? deleteError.message : 'Unknown error',
            })
          }
        }

        result.details.push({
          batch: batchNumber,
          ids: batchIds,
          status: batchErrors.length === 0 ? 'success' : 'partial-success',
          deletedCount: batchSuccessful,
          ...(batchErrors.length > 0 && { error: `${batchErrors.length} failures in batch` }),
        })

        result.processed += batchIds.length

        // Small delay between batches to avoid overwhelming the system
        if (i + batchSize < targetIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      } catch (batchError) {
        console.error(`❌ Batch ${batchNumber} failed:`, batchError)
        result.errors += batchIds.length
        result.details.push({
          batch: batchNumber,
          ids: batchIds,
          status: 'batch-failed',
          error: batchError instanceof Error ? batchError.message : 'Unknown batch error',
        })
      }
    }

    const finalMessage = `Bulk deletion completed: ${result.successful} successful, ${result.errors} errors`
    console.log('📊 ' + finalMessage)

    return NextResponse.json({
      success: result.successful > 0,
      message: finalMessage,
      result,
      summary: {
        totalProcessed: result.processed,
        successRate:
          result.processed > 0 ? Math.round((result.successful / result.processed) * 100) : 0,
        completedBatches: result.details.filter((d) => d.status === 'success').length,
        failedBatches: result.details.filter((d) => d.status.includes('failed')).length,
      },
    })
  } catch (error) {
    console.error('❌ Safe bulk deletion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Bulk deletion failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Try smaller batch sizes or individual deletions',
      },
      { status: 500 },
    )
  }
}

export async function GET(_request: NextRequest) {
  try {
    const config = await configPromise
    const payload = await getPayload({ config })

    const mediaCount = await payload.find({
      collection: 'media',
      limit: 1,
      depth: 0,
    })

    return NextResponse.json({
      success: true,
      message: 'Safe bulk deletion endpoint',
      currentMediaCount: mediaCount.totalDocs,
      usage: {
        dryRun: 'POST with { "deleteAll": true, "dryRun": true }',
        deleteSpecific: 'POST with { "mediaIds": [1,2,3], "dryRun": false }',
        deleteAll: 'POST with { "deleteAll": true, "dryRun": false }',
        batchSize: 'Optional: { "batchSize": 10 } (default: 5)',
      },
      benefits: [
        'Processes deletions in small batches',
        'Handles timeouts gracefully',
        'Provides detailed progress reporting',
        'Safer than admin UI bulk operations',
      ],
      warning: 'Always test with dryRun: true first!',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get media info',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
