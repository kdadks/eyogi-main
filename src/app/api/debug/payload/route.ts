import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = await configPromise
    const payload = await getPayload({ config })

    // Test basic connectivity
    const categoriesTest = await payload.find({
      collection: 'categories',
      limit: 1,
    })

    const postsTest = await payload.find({
      collection: 'posts',
      limit: 1,
    })

    return NextResponse.json({
      ok: true,
      payload: 'initialized',
      categories: categoriesTest.totalDocs,
      posts: postsTest.totalDocs,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URI: process.env.DATABASE_URI ? 'present' : 'missing',
        PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? 'present' : 'missing',
        NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'missing',
        NETLIFY: process.env.NETLIFY || 'false',
        URL: process.env.URL || 'missing',
      },
    })
  } catch (err) {
    console.error('Debug endpoint error:', err)
    return NextResponse.json(
      {
        ok: false,
        error: (err as Error).message,
        stack: (err as Error).stack,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URI: process.env.DATABASE_URI ? 'present' : 'missing',
          PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? 'present' : 'missing',
          NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'missing',
          NETLIFY: process.env.NETLIFY || 'false',
          URL: process.env.URL || 'missing',
        },
      },
      { status: 500 },
    )
  }
}
