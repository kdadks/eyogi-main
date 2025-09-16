import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Checking media references and constraints...')

    const config = await configPromise
    const payload = await getPayload({ config })

    // Get sample media
    const mediaList = await payload.find({
      collection: 'media',
      limit: 5,
      depth: 0,
    })

    if (mediaList.docs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No media found to check',
        mediaCount: 0,
      })
    }

    const referenceCheck = {
      totalMedia: mediaList.totalDocs,
      sampleChecked: mediaList.docs.length,
      references: [] as Array<{
        mediaId: number
        filename: string | null | undefined
        referencedBy: {
          posts: number
          pages: number
          // other collections that might reference media
        }
        canDeleteSafely: boolean
      }>,
      bulkDeletionIssues: [] as string[],
      recommendations: [] as string[],
    }

    // Check each media for references
    for (const media of mediaList.docs) {
      const mediaRef = {
        mediaId: media.id,
        filename: media.filename,
        referencedBy: {
          posts: 0,
          pages: 0,
        },
        canDeleteSafely: true,
      }

      try {
        // Check posts that reference this media
        const postsWithMedia = await payload.find({
          collection: 'posts',
          where: {
            coverImage: {
              equals: media.id,
            },
          },
          limit: 1, // Just count, don't need all
          depth: 0,
        })
        mediaRef.referencedBy.posts = postsWithMedia.totalDocs

        // Check pages that might reference this media
        // Note: This is a simplified check - you might need to check content blocks too
        const pagesWithMedia = await payload.find({
          collection: 'pages',
          limit: 1000, // Get all pages to check content
          depth: 1,
        })

        // Check if media is referenced in page content (this is approximate)
        let pageReferences = 0
        for (const page of pagesWithMedia.docs) {
          const pageContent = JSON.stringify(page)
          if (pageContent.includes(`"id":${media.id}`) || pageContent.includes(`"${media.id}"`)) {
            pageReferences++
          }
        }
        mediaRef.referencedBy.pages = pageReferences

        // Determine if safe to delete
        mediaRef.canDeleteSafely =
          mediaRef.referencedBy.posts === 0 && mediaRef.referencedBy.pages === 0
      } catch (error) {
        console.error(`Error checking references for media ${media.id}:`, error)
        mediaRef.canDeleteSafely = false
      }

      referenceCheck.references.push(mediaRef)
    }

    // Analyze bulk deletion issues
    const referencedMedia = referenceCheck.references.filter((ref) => !ref.canDeleteSafely)
    if (referencedMedia.length > 0) {
      referenceCheck.bulkDeletionIssues.push(
        `${referencedMedia.length} media files are referenced by other content`,
      )
      referenceCheck.bulkDeletionIssues.push('Foreign key constraints will prevent bulk deletion')
      referenceCheck.recommendations.push(
        'Remove media references from posts/pages before bulk deletion',
      )
      referenceCheck.recommendations.push('Or delete only unreferenced media files')
    }

    // Check for other potential issues
    if (mediaList.totalDocs > 50) {
      referenceCheck.bulkDeletionIssues.push('Large number of media files might cause timeout')
      referenceCheck.recommendations.push('Use smaller batch sizes for bulk operations')
    }

    referenceCheck.recommendations.push('Always backup database before bulk operations')
    referenceCheck.recommendations.push('Test bulk deletion with small batches first')

    console.log('📊 Reference check complete:', {
      total: referenceCheck.totalMedia,
      safe: referenceCheck.references.filter((ref) => ref.canDeleteSafely).length,
      referenced: referencedMedia.length,
    })

    return NextResponse.json({
      success: true,
      message: 'Media reference check completed',
      referenceCheck,
      bulkDeletionAdvice: {
        safeToDelete: referenceCheck.references
          .filter((ref) => ref.canDeleteSafely)
          .map((ref) => ({
            id: ref.mediaId,
            filename: ref.filename,
          })),
        requiresCleanup: referencedMedia.map((ref) => ({
          id: ref.mediaId,
          filename: ref.filename,
          referencedBy: ref.referencedBy,
        })),
        explanation:
          referencedMedia.length > 0
            ? 'Some media files are referenced by content and cannot be bulk deleted'
            : 'All checked media files appear safe for bulk deletion',
      },
    })
  } catch (error) {
    console.error('❌ Reference check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check media references',
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Database connectivity or permission issues',
      },
      { status: 500 },
    )
  }
}
