import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Temporary deletion fix instructions',
    problem: 'UploadThing plugin is interfering with media deletion',
    solution: 'Temporarily disable UploadThing plugin to allow deletions',
    instructions: [
      '1. Comment out the uploadthingStorage plugin in payload.config.ts',
      '2. Restart the application',
      '3. Delete unwanted media records',
      '4. Re-enable the plugin',
      '5. New uploads will use UploadThing again',
    ],
    temporaryFix: {
      file: 'src/payload.config.ts',
      change: 'Comment out the uploadthingStorage plugin temporarily',
      location: 'Around line 77-84',
    },
    recommendation: 'This is a safe temporary fix that only affects new uploads',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { action } = body

    if (action === 'disable-plugin') {
      return NextResponse.json({
        success: true,
        message: 'Instructions to disable UploadThing plugin',
        steps: [
          'Open src/payload.config.ts',
          'Find the uploadthingStorage plugin (around line 77)',
          'Comment it out like this:',
          '// uploadthingStorage({',
          '//   collections: {',
          '//     media: true,',
          '//   },',
          '//   options: {',
          '//     token: process.env.UPLOADTHING_TOKEN || "",',
          '//     acl: "public-read",',
          '//   },',
          '// }),',
          'Commit and push the changes',
          'Wait for deployment',
          'Try deleting media records',
        ],
        note: 'This will temporarily disable UploadThing for new uploads but allow deletions',
      })
    }

    if (action === 'enable-plugin') {
      return NextResponse.json({
        success: true,
        message: 'Instructions to re-enable UploadThing plugin',
        steps: [
          'Open src/payload.config.ts',
          'Uncomment the uploadthingStorage plugin',
          'Commit and push the changes',
          'New uploads will use UploadThing again',
        ],
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown action',
      availableActions: ['disable-plugin', 'enable-plugin'],
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
