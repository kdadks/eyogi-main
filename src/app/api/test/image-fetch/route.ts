import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const testUrl = url.searchParams.get('url') || '/api/media/file/test.jpg'

    console.log(`🧪 Testing database image fetch: ${testUrl}`)

    const baseUrl = 'https://eyogi-main.vercel.app'
    const fullUrl = testUrl.startsWith('http') ? testUrl : `${baseUrl}${testUrl}`

    console.log(`🔗 Full URL: ${fullUrl}`)

    try {
      const response = await fetch(fullUrl, {
        method: 'HEAD', // Just check headers, don't download
        headers: {
          'User-Agent': 'Migration Test Bot',
        },
        signal: AbortSignal.timeout(10000),
      })

      const result = {
        success: true,
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        headers: {
          'content-type': response.headers.get('content-type'),
          'content-length': response.headers.get('content-length'),
          'cache-control': response.headers.get('cache-control'),
        },
        accessible: response.ok,
        diagnosis: response.ok
          ? 'URL is accessible - migration should work'
          : `URL failed with ${response.status} - this is why migration is failing`,
      }

      console.log('🔍 Test result:', result)
      return NextResponse.json(result)
    } catch (fetchError) {
      const result = {
        success: false,
        url: fullUrl,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
        diagnosis: 'Cannot fetch from this URL - migration will fail',
        reason: 'PayloadCMS /api/media/ endpoints do not work on Vercel serverless',
      }

      console.log('❌ Fetch test failed:', result)
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run test',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
