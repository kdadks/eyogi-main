import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import React from 'react'
import BlogsFilters from '@/components/Blogs/BlogsFilters'
import { Pagination } from '@/components/Pagination'

// Force this page to be dynamic to support search params
export const dynamic = 'force-dynamic'

type Args = {
  searchParams: Promise<{
    page?: string
    search?: string
    category?: string
  }>
}

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  try {
    const sp = await searchParamsPromise
    const page = Math.max(1, Number(sp?.page) || 1)
    const limit = 12
    const search = (sp?.search ?? '') as string
    const category = (sp?.category ?? '') as string
    const config = await configPromise
    const payload = await getPayload({ config })

    const categoriesRes = await payload.find({
      collection: 'categories',
      limit: 999,
      select: {
        title: true,
      },
    })

    // Build where conditions only when filters are provided to avoid invalid empty objects
    const orConditions: Where[] = []
    if (search) {
      orConditions.push(
        { title: { like: search } },
        { description: { like: search } },
        { slug: { like: search } },
      )
    }

    const andConditions: Where[] = []
    if (category) {
      andConditions.push({ 'categories.title': { equals: category } })
    }

    let where: Where | undefined
    if (orConditions.length || andConditions.length) {
      if (andConditions.length && orConditions.length) {
        where = { and: [{ or: orConditions }, ...andConditions] }
      } else if (andConditions.length) {
        where = { and: andConditions }
      } else {
        where = { or: orConditions }
      }
    }

    const posts = await payload.find({
      collection: 'posts',
      depth: 3,
      limit,
      page,
      select: {
        title: true,
        slug: true,
        description: true,
        publishedAt: true,
        coverImage: true,
        categories: true,
      },
      ...(where ? { where } : {}),
    })

    // 📊 IMAGE SOURCE ANALYTICS
    console.log('🔍 IMAGE SOURCE ANALYSIS - Page', page)
    console.log('📋 Total posts fetched:', posts.docs.length)

    // Check image coverage
    const postsWithImages = posts.docs.filter((post) => !!post.coverImage)
    console.log(`📊 Posts with coverImages: ${postsWithImages.length}/${posts.docs.length}`)

    if (postsWithImages.length > 0) {
      console.log('📸 Sample post with coverImage:', {
        title: postsWithImages[0].title,
        coverImageUrl:
          postsWithImages[0].coverImage && typeof postsWithImages[0].coverImage === 'object'
            ? postsWithImages[0].coverImage.url
            : null,
      })
    }

    // Force debugging in production
    if (typeof window === 'undefined') {
      console.log('='.repeat(50))
      console.log('🚀 PRODUCTION DEBUG - SERVER SIDE')
      console.log('='.repeat(50))
    }

    const imageAnalysis = posts.docs.map((post, index) => {
      const coverImage = post.coverImage
      let source = 'none'
      let url: string | null = null
      let storageLocation = 'none'

      if (coverImage && typeof coverImage === 'object') {
        url = coverImage.url || null

        if (url && typeof url === 'string') {
          if (url.startsWith('/api/media/')) {
            source = 'PayloadCMS_API'
            storageLocation = 'Neon_Database'
          } else if (
            url.startsWith('http') &&
            (url.includes('uploadthing') || url.includes('ufs.sh'))
          ) {
            source = 'UploadThing'
            storageLocation = 'UploadThing_CDN'
          } else if (url.startsWith('http')) {
            source = 'External_HTTP'
            storageLocation = 'External_Server'
          } else {
            source = 'Local_Path'
            storageLocation = 'Local_Filesystem'
          }
        }
      }

      return {
        postIndex: index + 1,
        title: post.title,
        slug: post.slug,
        hasImage: !!coverImage,
        imageSource: source,
        storageLocation,
        imageUrl: url,
        imageId: coverImage && typeof coverImage === 'object' ? coverImage.id : null,
        imageFilename: coverImage && typeof coverImage === 'object' ? coverImage.filename : null,
      }
    })

    // Count by source
    const sourceCounts = {
      none: imageAnalysis.filter((item) => item.imageSource === 'none').length,
      payloadCMS: imageAnalysis.filter((item) => item.imageSource === 'PayloadCMS_API').length,
      uploadThing: imageAnalysis.filter((item) => item.imageSource === 'UploadThing').length,
      external: imageAnalysis.filter((item) => item.imageSource === 'External_HTTP').length,
      local: imageAnalysis.filter((item) => item.imageSource === 'Local_Path').length,
    }

    console.log('📊 IMAGE SOURCE SUMMARY:')
    console.log('├── No Images:', sourceCounts.none)
    console.log('├── PayloadCMS API (Neon DB):', sourceCounts.payloadCMS)
    console.log('├── UploadThing CDN:', sourceCounts.uploadThing)
    console.log('├── External HTTP:', sourceCounts.external)
    console.log('└── Local Files:', sourceCounts.local)
    console.log('')
    console.log('🗂️ DETAILED BREAKDOWN:', imageAnalysis)
    console.log('=====================================')

    return (
      <div className="flex flex-grow h-full">
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 pt-4 pb-4 gap-5 container h-full">
          <div className="lg:col-span-2 xl:col-span-3 flex flex-col items-center py-8">
            <h1 className="text-2xl lg:text-4xl text-white text-center">eYogi Knowledge Center</h1>
            <p className="text-base lg:text-2xl text-white text-center">
              Elevate your practice with wisdom from the eYogi community
            </p>
          </div>

          <BlogsFilters
            data={categoriesRes.docs}
            defaultSearch={search}
            defaultCategory={category as string}
          />

          <CollectionArchive posts={posts.docs} />

          <div className="lg:col-span-2 xl:col-span-3">
            {posts.totalPages > 1 && posts.page && (
              <Pagination page={posts.page} totalPages={posts.totalPages} />
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading Hinduism page:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })

    // Send error to logging endpoint for persistent storage
    try {
      await fetch('/api/debug/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: '/hinduism',
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          details: {
            name: error instanceof Error ? error.name : undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
          },
        }),
      }).catch(() => {}) // Ignore logging failures
    } catch {
      // Ignore logging failures
    }

    // Return a fallback UI when there's an error with debug info
    return (
      <div className="flex flex-grow h-full">
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 pt-4 pb-4 gap-5 container h-full">
          <div className="lg:col-span-2 xl:col-span-3 flex flex-col items-center py-8">
            <h1 className="text-2xl lg:text-4xl text-white text-center">eYogi Knowledge Center</h1>
            <p className="text-base lg:text-lg text-white text-center">
              Sorry, there was an issue loading the content. Please try again later.
            </p>
            {/* Debug info for production */}
            <details className="mt-4 text-white text-sm max-w-2xl">
              <summary className="cursor-pointer">Debug Information</summary>
              <pre className="mt-2 p-4 bg-gray-800 rounded overflow-auto">
                {JSON.stringify(
                  {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    env: {
                      NODE_ENV: process.env.NODE_ENV,
                      DATABASE_URI: process.env.DATABASE_URI ? 'present' : 'missing',
                      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? 'present' : 'missing',
                      NETLIFY: process.env.NETLIFY || 'false',
                      URL: process.env.URL || 'missing',
                    },
                  },
                  null,
                  2,
                )}
              </pre>
            </details>
          </div>
        </div>
      </div>
    )
  }
}

export function generateMetadata(): Metadata {
  return {
    title: `Hinduism`,
  }
}
