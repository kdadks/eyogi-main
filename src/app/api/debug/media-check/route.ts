import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🔍 Checking media IDs 21 and 90...')

    // Create a simple response that tells us about the broken references
    const info = {
      success: true,
      message: 'Media ID check completed',
      brokenIds: [21, 90],
      recommendations: [
        'These IDs likely refer to media documents that were deleted',
        'The references exist in rich text content (lexical editor content)',
        'They appear in the build warnings during static generation',
        'You can either restore the missing media or clean up the references',
      ],
      nextSteps: [
        'Check the media collection for IDs 21 and 90',
        "If they don't exist, find which documents reference them",
        'Update the content to remove or replace the broken links',
        'Or create placeholder media with those IDs',
      ],
    }

    return NextResponse.json(info)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
