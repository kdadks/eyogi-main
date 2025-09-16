import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing bulk media deletion...')

    const config = await configPromise
    const payload = await getPayload({ config })

    const body = await request.json().catch(() => ({}))
    const { mediaIds = [], testOnly = true } = body

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'mediaIds array required',
          usage: 'POST with { "mediaIds": [123, 124, 125], "testOnly": false }',
        },
        { status: 400 },
      )
    }

    console.log(`📋 Testing bulk deletion of ${mediaIds.length} items:`, mediaIds)

    const results = {
      bulkDeletion: {
        attempted: false,
        success: false,
        error: null as string | null,
        details: null as string | object | null,
      },
      individualTests: [] as Array<{
        id: number
        filename: string | null | undefined
        canAccess: boolean
        error?: string
      }>,
      recommendations: [] as string[],
    }

    // First, test individual access to each media record
    for (const mediaId of mediaIds) {
      try {
        const mediaRecord = await payload.findByID({
          collection: 'media',
          id: mediaId,
          depth: 0,
        })

        results.individualTests.push({
          id: mediaId,
          filename: mediaRecord.filename,
          canAccess: true,
        })
      } catch (error) {
        results.individualTests.push({
          id: mediaId,
          filename: 'Unknown',
          canAccess: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    if (testOnly) {
      results.bulkDeletion = {
        attempted: false,
        success: false,
        error: null,
        details: `Test mode - would attempt to delete ${mediaIds.length} records`,
      }

      // Check for potential issues
      const inaccessibleRecords = results.individualTests.filter(test => !test.canAccess)
      if (inaccessibleRecords.length > 0) {
        results.recommendations.push(`${inaccessibleRecords.length} records cannot be accessed - these might cause bulk deletion to fail`)
      }

      if (mediaIds.length > 10) {
        results.recommendations.push('Large bulk operations might timeout - consider smaller batches')
      }

      results.recommendations.push('Bulk deletion might fail due to database constraints or foreign key references')
      results.recommendations.push('Some media might be referenced by posts, pages, or other content')

    } else {
      // Attempt actual bulk deletion
      try {
        console.log(`🗑️ Attempting bulk deletion of ${mediaIds.length} records...`)
        results.bulkDeletion.attempted = true

        // Try PayloadCMS bulk delete method
        const deleteResult = await payload.delete({
          collection: 'media',
          where: {
            id: {
              in: mediaIds,
            },
          },
        })

        results.bulkDeletion.success = true
        results.bulkDeletion.details = {
          method: 'bulk-where-clause',
          deletedCount: deleteResult.docs?.length || 'unknown',
          result: deleteResult,
        }
        console.log(`✅ Bulk deletion successful`)

      } catch (bulkError) {
        console.error('❌ Bulk deletion failed:', bulkError)
        results.bulkDeletion.success = false
        results.bulkDeletion.error = bulkError instanceof Error ? bulkError.message : 'Unknown bulk deletion error'
        results.bulkDeletion.details = {
          errorName: bulkError instanceof Error ? bulkError.name : 'Unknown',
          errorStack: bulkError instanceof Error ? bulkError.stack : null,
          errorCause: bulkError instanceof Error ? (bulkError as Error & { cause?: unknown }).cause : null,
          suggestion: 'Try deleting records one by one instead of bulk operation',
        }

        // Try alternative: delete one by one
        try {
          console.log('🔄 Attempting individual deletions as fallback...')
          let successCount = 0
          const individualErrors: Array<{ id: number; error: string }> = []

          for (const mediaId of mediaIds) {
            try {
              await payload.delete({
                collection: 'media',
                id: mediaId,
              })
              successCount++
            } catch (individualError) {
              individualErrors.push({
                id: mediaId,
                error: individualError instanceof Error ? individualError.message : 'Unknown error',
              })
            }
          }

          results.bulkDeletion.details = {
            ...results.bulkDeletion.details,
            fallbackMethod: 'individual-deletions',
            successCount,
            individualErrors,
            note: 'Bulk deletion failed but individual deletions were attempted',
          }

        } catch (fallbackError) {
          console.error('❌ Fallback individual deletions also failed:', fallbackError)
        }
      }
    }

    // Analyze potential causes
    if (!results.bulkDeletion.success && results.bulkDeletion.attempted) {
      if (results.bulkDeletion.error?.includes('foreign key') || results.bulkDeletion.error?.includes('constraint')) {
        results.recommendations.push('Foreign key constraint violation - media files are referenced by other content')
        results.recommendations.push('Check if these media are used in posts, pages, or other collections')
      }

      if (results.bulkDeletion.error?.includes('timeout') || results.bulkDeletion.error?.includes('time')) {
        results.recommendations.push('Operation timed out - try smaller batches')
      }

      if (results.bulkDeletion.error?.includes('permission') || results.bulkDeletion.error?.includes('access')) {
        results.recommendations.push('Permission issue - check user authentication and access rights')
      }
    }

    return NextResponse.json({
      success: true,
      message: testOnly ? 'Bulk deletion test completed' : 'Bulk deletion attempt completed',
      totalRequested: mediaIds.length,
      accessibleRecords: results.individualTests.filter(test => test.canAccess).length,
      results,
      quickFix: results.bulkDeletion.error ? [
        'Try deleting records one by one instead of bulk selection',
        'Check if media files are referenced by posts/pages',
        'Use smaller batch sizes for bulk operations',
      ] : [],
    })

  } catch (error) {
    console.error('❌ Bulk deletion test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test bulk deletion',
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'The bulk deletion system itself has issues - try individual deletions',
      },
      { status: 500 },
    )
  }
}

export async function GET(_request: NextRequest) {
  try {
    const config = await configPromise
    const payload = await getPayload({ config })

    // Get list of media for testing
    const mediaList = await payload.find({
      collection: 'media',
      limit: 10,
      depth: 0,
    })

    return NextResponse.json({
      success: true,
      message: 'Bulk deletion test endpoint',
      availableMedia: mediaList.docs.map(media => ({
        id: media.id,
        filename: media.filename,
        url: media.url,
        isUploadThing: media.url?.includes('utfs.io') || false,
        isDatabase: media.url?.includes('/api/media/') || false,
      })),
      usage: {
        testBulkDeletion: 'POST with { "mediaIds": [123, 124], "testOnly": true }',
        actualBulkDeletion: 'POST with { "mediaIds": [123, 124], "testOnly": false }',
        warning: 'testOnly: false will actually delete the media records!',
      },
      commonIssues: [
        'Foreign key constraints if media is referenced by posts/pages',
        'Timeout issues with large bulk operations',
        'Database transaction limits',
        'PayloadCMS bulk operation limitations',
      ],
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get media list',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}