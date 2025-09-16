import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 MEDIA DEBUG - Simple test...')

    const response = {
      success: true,
      message: 'Media debug endpoint is working!',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasUploadThingToken: !!process.env.UPLOADTHING_TOKEN,
        uploadThingTokenLength: process.env.UPLOADTHING_TOKEN?.length || 0,
        databaseUri: process.env.DATABASE_URI ? 'present' : 'missing',
      },
      imageIssue: {
        problem: 'All 108 images stored in database, /api/media/ endpoints failing on Vercel',
        cause: 'PayloadCMS serverless functions cannot serve database-stored files',
        solution: 'Need to migrate to UploadThing or fix media serving',
        urgency: 'HIGH - All images currently broken',
      },
    }

    console.log('📋 MEDIA DEBUG RESPONSE:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Media debug error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run media debug',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
