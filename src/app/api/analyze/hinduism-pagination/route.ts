import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting hinduism pagination analysis...')
    
    const config = await configPromise
    const payload = await getPayload({ config })

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    // Get hinduism category posts with pagination
    const hinduismCategory = await payload.find({
      collection: 'categories',
      where: {
        title: {
          equals: 'Hinduism'
        }
      },
      limit: 1
    })

    if (hinduismCategory.docs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Hinduism category not found'
      })
    }

    const categoryId = hinduismCategory.docs[0].id

    // Get posts for this page
    const posts = await payload.find({
      collection: 'posts',
      where: {
        categories: {
          in: [categoryId]
        }
      },
      limit,
      page,
      depth: 2, // Include cover image details
      sort: '-publishedAt'
    })

    console.log(`📄 Page ${page}: Found ${posts.docs.length} posts`)

    // Analyze each post's cover image
    const imageAnalysis = posts.docs.map((post, index) => {
      const coverImage = post.coverImage
      
      let imageInfo = {
        postId: post.id,
        postTitle: post.title,
        postIndex: index + 1,
        hasImage: !!coverImage,
        imageSource: 'none',
        imageUrl: null as string | null,
        imageId: null as number | null,
        filename: null as string | null,
        mimeType: null as string | null,
        imageAnalysis: 'No cover image'
      }

      if (coverImage && typeof coverImage === 'object') {
        const image = coverImage as { url?: string, id?: number, filename?: string, mimeType?: string }
        imageInfo = {
          ...imageInfo,
          hasImage: true,
          imageUrl: image.url || null,
          imageId: image.id || null,
          filename: image.filename || null,
          mimeType: image.mimeType || null,
          imageSource: image.url?.startsWith('/api/media/') ? 'PayloadCMS Database' :
                      image.url?.includes('9fj0u1y9ex.ufs.sh') ? 'UploadThing CDN' :
                      image.url?.startsWith('http') ? 'External URL' : 'Unknown',
          imageAnalysis: `${image.url?.startsWith('/api/media/') ? '🗄️ Database' :
                          image.url?.includes('9fj0u1y9ex.ufs.sh') ? '☁️ UploadThing' :
                          '🌐 External'} - ${image.filename || 'No filename'}`
        }
      }

      return imageInfo
    })

    // Create summary statistics for this page
    const pageSummary = {
      pageNumber: page,
      totalPosts: posts.docs.length,
      totalPages: posts.totalPages,
      hasNextPage: posts.hasNextPage,
      hasPrevPage: posts.hasPrevPage,
      imagesWithSources: {
        payloadCMS: imageAnalysis.filter(img => img.imageSource === 'PayloadCMS Database').length,
        uploadThing: imageAnalysis.filter(img => img.imageSource === 'UploadThing CDN').length,
        external: imageAnalysis.filter(img => img.imageSource === 'External URL').length,
        noImage: imageAnalysis.filter(img => img.imageSource === 'none').length
      }
    }

    // If this is page 1, also get a comparison with other pages
    let multiPageComparison: {
      page1Sources: string[]
      page2Sources: string[]
      page3Sources: string[]
      summary: {
        page1: { database: number, uploadthing: number, other: number, none: number }
        page2: { database: number, uploadthing: number, other: number, none: number }
        page3: { database: number, uploadthing: number, other: number, none: number }
      }
    } | null = null
    
    if (page === 1) {
      console.log('📊 Getting multi-page comparison...')
      
      const page2Posts = await payload.find({
        collection: 'posts',
        where: { categories: { in: [categoryId] } },
        limit,
        page: 2,
        depth: 2,
        sort: '-publishedAt'
      })

      const page3Posts = await payload.find({
        collection: 'posts',
        where: { categories: { in: [categoryId] } },
        limit,
        page: 3,
        depth: 2,
        sort: '-publishedAt'
      })

      const analyzePage = (pagePosts: Array<{ coverImage?: unknown }>) => {
        return pagePosts.map(post => {
          const coverImage = post.coverImage
          if (!coverImage || typeof coverImage !== 'object') return 'none'
          
          const image = coverImage as { url?: string }
          return image.url?.startsWith('/api/media/') ? 'database' :
                 image.url?.includes('9fj0u1y9ex.ufs.sh') ? 'uploadthing' :
                 'other'
        })
      }

      const comparison = {
        page1Sources: analyzePage(posts.docs),
        page2Sources: analyzePage(page2Posts.docs),
        page3Sources: analyzePage(page3Posts.docs),
        summary: {
          page1: { database: 0, uploadthing: 0, other: 0, none: 0 },
          page2: { database: 0, uploadthing: 0, other: 0, none: 0 },
          page3: { database: 0, uploadthing: 0, other: 0, none: 0 }
        }
      }

      // Count sources for each page
      ;[
        { sources: comparison.page1Sources, summary: comparison.summary.page1 },
        { sources: comparison.page2Sources, summary: comparison.summary.page2 },
        { sources: comparison.page3Sources, summary: comparison.summary.page3 }
      ].forEach(({ sources, summary }) => {
        sources.forEach(source => {
          if (source === 'database') summary.database++
          else if (source === 'uploadthing') summary.uploadthing++
          else if (source === 'none') summary.none++
          else summary.other++
        })
      })
      
      multiPageComparison = comparison
    }

    const response = {
      success: true,
      message: `Hinduism page ${page} analysis complete`,
      pageSummary,
      imageAnalysis,
      multiPageComparison,
      pagination: {
        currentPage: page,
        totalPages: posts.totalPages,
        hasNextPage: posts.hasNextPage,
        hasPrevPage: posts.hasPrevPage,
        totalPosts: posts.totalDocs
      },
      note: 'This analyzes image sources across hinduism pagination pages'
    }

    console.log('✅ Hinduism pagination analysis completed')
    console.log('📊 Page summary:', JSON.stringify(pageSummary, null, 2))

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Hinduism pagination analysis error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Hinduism pagination analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}