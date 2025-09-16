import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function GET(request: NextRequest) {
  try {
    const config = await configPromise
    const payload = await getPayload({ config })

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Fetch all posts with coverImage data
    const posts = await payload.find({
      collection: 'posts',
      depth: 3,
      limit,
      page,
      select: {
        title: true,
        slug: true,
        coverImage: true,
        publishedAt: true,
      },
    })

    // Analyze image sources
    const imageAnalysis = posts.docs.map((post, index) => {
      const coverImage = post.coverImage
      let source = 'none'
      let url: string | null = null
      let storageLocation = 'none'
      let provider = 'none'

      if (coverImage && typeof coverImage === 'object') {
        url = coverImage.url || null

        if (url && typeof url === 'string') {
          if (url.startsWith('/api/media/')) {
            source = 'PayloadCMS_API'
            storageLocation = 'Neon_Database'
            provider = 'Neon + PayloadCMS'
          } else if (url.startsWith('http') && url.includes('uploadthing')) {
            source = 'UploadThing'
            storageLocation = 'UploadThing_CDN'
            provider = 'UploadThing'
          } else if (url.startsWith('http')) {
            source = 'External_HTTP'
            storageLocation = 'External_Server'
            provider = 'External'
          } else {
            source = 'Local_Path'
            storageLocation = 'Local_Filesystem'
            provider = 'Local'
          }
        }
      }

      return {
        postIndex: index + 1,
        title: post.title,
        slug: post.slug,
        publishedAt: post.publishedAt,
        hasImage: !!coverImage,
        imageSource: source,
        storageLocation,
        provider,
        imageUrl: url,
        imageId: coverImage && typeof coverImage === 'object' ? coverImage.id : null,
        imageFilename: coverImage && typeof coverImage === 'object' ? coverImage.filename : null,
        imageMimeType: coverImage && typeof coverImage === 'object' ? coverImage.mimeType : null,
        imageFilesize: coverImage && typeof coverImage === 'object' ? coverImage.filesize : null,
      }
    })

    // Count by source
    const sourceCounts = {
      totalPosts: posts.docs.length,
      withImages: imageAnalysis.filter((item) => item.hasImage).length,
      withoutImages: imageAnalysis.filter((item) => !item.hasImage).length,
      bySource: {
        none: imageAnalysis.filter((item) => item.imageSource === 'none').length,
        payloadCMS: imageAnalysis.filter((item) => item.imageSource === 'PayloadCMS_API').length,
        uploadThing: imageAnalysis.filter((item) => item.imageSource === 'UploadThing').length,
        external: imageAnalysis.filter((item) => item.imageSource === 'External_HTTP').length,
        local: imageAnalysis.filter((item) => item.imageSource === 'Local_Path').length,
      },
      byProvider: {
        neonPayloadCMS: imageAnalysis.filter((item) => item.provider === 'Neon + PayloadCMS')
          .length,
        uploadThing: imageAnalysis.filter((item) => item.provider === 'UploadThing').length,
        external: imageAnalysis.filter((item) => item.provider === 'External').length,
        local: imageAnalysis.filter((item) => item.provider === 'Local').length,
        none: imageAnalysis.filter((item) => item.provider === 'none').length,
      },
    }

    // Calculate percentages
    const percentages = {
      withImages: Math.round((sourceCounts.withImages / sourceCounts.totalPosts) * 100),
      payloadCMS: Math.round((sourceCounts.bySource.payloadCMS / sourceCounts.totalPosts) * 100),
      uploadThing: Math.round((sourceCounts.bySource.uploadThing / sourceCounts.totalPosts) * 100),
      external: Math.round((sourceCounts.bySource.external / sourceCounts.totalPosts) * 100),
      local: Math.round((sourceCounts.bySource.local / sourceCounts.totalPosts) * 100),
      none: Math.round((sourceCounts.bySource.none / sourceCounts.totalPosts) * 100),
    }

    const response = {
      summary: {
        totalPosts: sourceCounts.totalPosts,
        postsWithImages: sourceCounts.withImages,
        postsWithoutImages: sourceCounts.withoutImages,
        imageSourceBreakdown: sourceCounts.bySource,
        providerBreakdown: sourceCounts.byProvider,
        percentages,
      },
      pagination: {
        currentPage: posts.page,
        totalPages: posts.totalPages,
        hasNextPage: posts.hasNextPage,
        hasPrevPage: posts.hasPrevPage,
      },
      detailedAnalysis: imageAnalysis,
      recommendations: {
        primaryStorage:
          sourceCounts.bySource.payloadCMS > sourceCounts.bySource.uploadThing
            ? 'Most images stored in Neon Database via PayloadCMS API'
            : 'Most images stored in UploadThing CDN',
        migrationSuggestion:
          sourceCounts.bySource.payloadCMS > 0 && sourceCounts.bySource.uploadThing > 0
            ? 'Consider standardizing on one storage solution for consistency'
            : 'Storage is already standardized',
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error analyzing images:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze images',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Allow posting client-side analytics data
    const body = await request.json()

    console.log('📊 CLIENT-SIDE IMAGE ANALYTICS RECEIVED:', body)

    return NextResponse.json({
      success: true,
      message: 'Analytics data received',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error receiving analytics data:', error)
    return NextResponse.json(
      {
        error: 'Failed to process analytics data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
