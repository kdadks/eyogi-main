import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing actual media deletion...')

    const config = await configPromise
    const payload = await getPayload({ config })

    const body = await request.json().catch(() => ({}))
    const { mediaId, testOnly = true } = body

    if (!mediaId) {
      return NextResponse.json({
        success: false,
        error: 'mediaId required',
        usage: 'POST with { "mediaId": 123, "testOnly": false }'
      }, { status: 400 })
    }

    // Get the media record first
    const mediaRecord = await payload.findByID({
      collection: 'media',
      id: mediaId,
      depth: 0,
    })

    console.log('📋 Media record to delete:', {
      id: mediaRecord.id,
      filename: mediaRecord.filename,
      url: mediaRecord.url,
      mimeType: mediaRecord.mimeType
    })

    const result = {
      mediaRecord: {
        id: mediaRecord.id,
        filename: mediaRecord.filename,
        url: mediaRecord.url,
        isUploadThing: mediaRecord.url?.includes('utfs.io') || false,
        isDatabase: mediaRecord.url?.includes('/api/media/') || false
      },
      deletionAttempt: {
        attempted: false,
        success: false,
        error: null as string | null,
        details: null as string | object | null
      }
    }

    if (testOnly) {
      result.deletionAttempt = {
        attempted: false,
        success: false,
        error: null,
        details: 'Test mode - no actual deletion attempted'
      }
    } else {
      try {
        console.log(`🗑️ Attempting to delete media ID: ${mediaId}`)
        
        result.deletionAttempt.attempted = true
        
        // Attempt the deletion
        await payload.delete({
          collection: 'media',
          id: mediaId,
        })

        result.deletionAttempt.success = true
        result.deletionAttempt.details = 'Deletion completed successfully'
        console.log(`✅ Successfully deleted media ID: ${mediaId}`)

      } catch (deleteError) {
        result.deletionAttempt.success = false
        result.deletionAttempt.error = deleteError instanceof Error ? deleteError.message : 'Unknown deletion error'
        result.deletionAttempt.details = {
          errorName: deleteError instanceof Error ? deleteError.name : 'Unknown',
          errorStack: deleteError instanceof Error ? deleteError.stack : null,
          errorCause: deleteError instanceof Error ? (deleteError as Error & { cause?: unknown }).cause : null
        }
        console.error(`❌ Deletion failed for media ID ${mediaId}:`, deleteError)
      }
    }

    return NextResponse.json({
      success: true,
      message: testOnly ? 'Deletion test completed' : 'Deletion attempt completed',
      result,
      recommendations: result.deletionAttempt.error ? [
        'Check UploadThing plugin configuration',
        'Verify media file permissions',
        'Check for database constraints',
        'Look for payload hooks interfering with deletion'
      ] : [
        'Deletion process working normally'
      ]
    })

  } catch (error) {
    console.error('❌ Deletion test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test deletion',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? {
          name: error.name,
          stack: error.stack,
          cause: (error as Error & { cause?: unknown }).cause
        } : null
      },
      { status: 500 }
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
      limit: 5,
      depth: 0,
    })

    return NextResponse.json({
      success: true,
      message: 'Media deletion test endpoint',
      availableMedia: mediaList.docs.map(media => ({
        id: media.id,
        filename: media.filename,
        url: media.url,
        isUploadThing: media.url?.includes('utfs.io') || false,
        isDatabase: media.url?.includes('/api/media/') || false
      })),
      usage: {
        testDeletion: 'POST with { "mediaId": 123, "testOnly": true }',
        actualDeletion: 'POST with { "mediaId": 123, "testOnly": false }',
        warning: 'testOnly: false will actually delete the media record!'
      }
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get media list',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}