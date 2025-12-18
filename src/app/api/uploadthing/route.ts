import { createRouteHandler } from 'uploadthing/next'
import { ourFileRouter } from '@/lib/uploadthing'
import { NextResponse } from 'next/server'
import { UTApi } from 'uploadthing/server'

// Export routes for Next.js App Router
const handlers = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
})

// Wrap handlers with CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, x-uploadthing-package, x-uploadthing-version, x-uploadthing-api-key, x-uploadthing-fe-package, x-uploadthing-be-adapter',
  'Access-Control-Max-Age': '86400',
}

// Initialize UTApi for file deletion
const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN })

export async function GET(request: Request) {
  const response = await handlers.GET(request)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export async function POST(request: Request) {
  const response = await handlers.POST(request)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fileKey = searchParams.get('fileKey')

    if (!fileKey) {
      return new NextResponse(JSON.stringify({ error: 'File key is required' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    console.log('Deleting file from UploadThing:', fileKey)

    // Delete the file using UTApi
    await utapi.deleteFiles(fileKey)

    return new NextResponse(JSON.stringify({ success: true, fileKey }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error deleting file from UploadThing:', error)
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
}

// Configure runtime for serverless functions
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
