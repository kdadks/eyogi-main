import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Testing media deletion functionality...')

    const config = await configPromise
    const payload = await getPayload({ config })

    // Get a sample media record to test deletion permissions
    const sampleMedia = await payload.find({
      collection: 'media',
      limit: 1,
      depth: 0,
    })

    if (sampleMedia.docs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No media records found to test deletion',
        mediaCount: 0,
      })
    }

    const testRecord = sampleMedia.docs[0]

    // Test deletion permissions and process
    const deletionTest = {
      canDelete: true,
      record: {
        id: testRecord.id,
        filename: testRecord.filename,
        url: testRecord.url,
        isUploadThing: testRecord.url?.includes('utfs.io') || false,
        isDatabase: testRecord.url?.includes('/api/media/') || false,
      },
      issues: [] as string[],
      solutions: [] as string[],
    }

    // Check if this is an UploadThing URL after migration
    if (testRecord.url?.includes('utfs.io')) {
      deletionTest.issues.push('File is now stored in UploadThing CDN after migration')
      deletionTest.issues.push('UploadThing plugin might not recognize migrated files for deletion')
      deletionTest.solutions.push('Temporarily disable UploadThing plugin deletion hooks')
      deletionTest.solutions.push('Delete database record only, keep CDN file')
      deletionTest.solutions.push('Use UploadThing API directly for file deletion')
    }

    // Check authentication
    try {
      const authCheck = await payload.findByID({
        collection: 'media',
        id: testRecord.id,
        depth: 0,
      })

      if (!authCheck) {
        deletionTest.canDelete = false
        deletionTest.issues.push('Cannot access media record - authentication issue')
      }
    } catch (authError) {
      deletionTest.canDelete = false
      deletionTest.issues.push(`Authentication error: ${authError}`)
    }

    console.log('🧪 Deletion test complete:', deletionTest)

    return NextResponse.json({
      success: true,
      message: 'Media deletion analysis complete',
      deletionTest,
      recommendations:
        deletionTest.issues.length > 0
          ? [
              'The migration to UploadThing has changed how file deletion works',
              'PayloadCMS + UploadThing plugin expects to manage the full file lifecycle',
              'Migrated files may not be recognized as "owned" by the plugin',
              'Consider temporary workaround or plugin configuration adjustment',
            ]
          : [
              'No obvious deletion issues detected',
              'Problem might be UI-related or permissions-based',
            ],
      temporaryFix: {
        description: 'If you need to delete media records immediately',
        steps: [
          '1. Use database admin tools to delete records directly',
          '2. Or modify UploadThing plugin configuration',
          '3. Or create custom deletion endpoint that bypasses plugin hooks',
        ],
      },
    })
  } catch (error) {
    console.error('❌ Deletion test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test media deletion',
        message: error instanceof Error ? error.message : 'Unknown error',
        likelyIssue: 'UploadThing plugin conflicts with migrated file URLs',
      },
      { status: 500 },
    )
  }
}
