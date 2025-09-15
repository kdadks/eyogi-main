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
      depth: 1,
      limit,
      page,
      select: {
        title: true,
        slug: true,
        categories: true,
        coverImage: true,
        publishedAt: true,
        description: true,
      },
      ...(where ? { where } : {}),
    })

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

    // Return a fallback UI when there's an error
    return (
      <div className="flex flex-grow h-full">
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 pt-4 pb-4 gap-5 container h-full">
          <div className="lg:col-span-2 xl:col-span-3 flex flex-col items-center py-8">
            <h1 className="text-2xl lg:text-4xl text-white text-center">eYogi Knowledge Center</h1>
            <p className="text-base lg:text-lg text-white text-center">
              Sorry, there was an issue loading the content. Please try again later.
            </p>
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
