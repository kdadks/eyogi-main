import { createRouteHandler } from 'uploadthing/server'
import { uploadRouter } from './uploadthing'

const handlers = createRouteHandler({
  router: uploadRouter,
  config: {
    token: import.meta.env.VITE_UPLOADTHING_SECRET,
  },
})

// Handle both GET and POST requests
export async function handleUploadThingRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)

  if (url.pathname.includes('/api/uploadthing')) {
    if (request.method === 'GET' || request.method === 'POST') {
      return await handlers(request)
    }

    return new Response('Method not allowed', { status: 405 })
  }

  return new Response('Not found', { status: 404 })
}
