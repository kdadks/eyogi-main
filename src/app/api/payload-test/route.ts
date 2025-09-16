import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Testing Payload initialization...')

    // Test config import
    const configPromise = await import('@payload-config')
    console.log('Config imported successfully')

    const config = await configPromise.default
    console.log('Config resolved successfully')

    // Test getPayload import
    const { getPayload } = await import('payload')
    console.log('getPayload imported successfully')

    // Test Payload initialization
    const payload = await getPayload({ config })
    console.log('Payload initialized successfully')

    // Test simple collection access
    const result = await payload.find({
      collection: 'categories',
      limit: 1,
    })

    console.log('Categories query successful')

    return NextResponse.json({
      status: 'Payload Test Success',
      categories_count: result.totalDocs,
      config_loaded: true,
      payload_initialized: true,
    })
  } catch (error) {
    console.error('Payload test error:', error)

    return NextResponse.json(
      {
        status: 'Payload Test Failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
