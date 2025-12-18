import { createRouteHandler } from 'uploadthing/next'
import { ourFileRouter } from '@/lib/uploadthing'
import { NextResponse } from 'next/server'

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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, x-uploadthing-package, x-uploadthing-version, x-uploadthing-api-key, x-uploadthing-fe-package, x-uploadthing-be-adapter',
  'Access-Control-Max-Age': '86400',
}

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

// Configure runtime for serverless functions
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
