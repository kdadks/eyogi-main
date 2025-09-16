import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔙 Reverting broken UploadThing URLs back to database URLs...')

    const config = await configPromise
    const payload = await getPayload({ config })

    const body = await request.json().catch(() => ({}))
    const { dryRun = true, limit = 50 } = body

    // Find all images with UploadThing URLs
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

    console.log(`🔍 Found ${brokenImages.docs.length} images with broken UploadThing URLs`)

    let revertCount = 0
    const revertResults: Array<{
      id: number
      filename: string | null | undefined
      currentUrl?: string | null | undefined
      wouldRevertTo?: string
      oldUrl?: string | null | undefined
      newUrl?: string
      status: string
      error?: string
    }> = []

    for (const media of brokenImages.docs) {
      try {
        const originalUrl = `/api/media/file/${encodeURIComponent(media.filename || '')}`
        
        if (dryRun) {
          revertResults.push({
            id: media.id,
            filename: media.filename,
            currentUrl: media.url,
            wouldRevertTo: originalUrl,
            status: 'dry-run'
          })
          revertCount++
        } else {
          await payload.update({
            collection: 'media',
            id: media.id,
            data: {
              url: originalUrl,
            },
          })

          revertResults.push({
            id: media.id,
            filename: media.filename,
            oldUrl: media.url,
            newUrl: originalUrl,
            status: 'reverted'
          })
          revertCount++
          console.log(`✅ Reverted: ${media.filename}`)
        }
      } catch (error) {
        console.error(`❌ Failed to revert ${media.filename}:`, error)
        revertResults.push({
          id: media.id,
          filename: media.filename,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun 
        ? `Dry run: Would revert ${revertCount} URLs back to database`
        : `Successfully reverted ${revertCount} URLs back to database`,
      revertSummary: {
        totalProcessed: brokenImages.docs.length,
        revertCount,
        hasMore: brokenImages.hasNextPage,
      },
      revertResults: revertResults.slice(0, 10), // Show first 10
      explanation: {
        problem: 'URLs point to non-existent UploadThing files',
        solution: 'Revert to original /api/media/ URLs so images work again',
        nextStep: 'Use recovery migration to properly upload to UploadThing'
      }
    })

  } catch (error) {
    console.error('❌ Revert error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to revert URLs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'URL revert endpoint',
    purpose: 'Revert broken UploadThing URLs back to working database URLs',
    usage: 'POST with { dryRun: boolean, limit: number }'
  })
}