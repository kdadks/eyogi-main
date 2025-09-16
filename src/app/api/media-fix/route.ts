import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const filename = url.searchParams.get('file')

    if (!filename) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 })
    }

    // For now, return a placeholder or redirect
    // This is a temporary solution until we migrate to UploadThing

    const response = {
      error: 'Media files stored in database cannot be served on Vercel serverless',
      filename,
      solution: 'Images need to be migrated to UploadThing CDN',
      temporaryFix: 'Use placeholder images or migrate images',
      timestamp: new Date().toISOString(),
    }

    console.log('📁 Media serving attempt:', response)

    return NextResponse.json(response, { status: 404 })
  } catch (error) {
    console.error('❌ Media serving error:', error)
    return NextResponse.json(
      {
        error: 'Failed to serve media',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
