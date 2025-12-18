import { createRouteHandler } from 'uploadthing/next'
import { ourFileRouter } from '@/lib/uploadthing'

// Export routes for Next.js App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
})

// Configure runtime for serverless functions
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
