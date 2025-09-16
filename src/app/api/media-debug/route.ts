import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    const mediaItems = await payload.find({
      collection: 'media',
      limit: 5,
      sort: '-createdAt',
    })

    return Response.json({
      success: true,
      count: mediaItems.docs.length,
      media: mediaItems.docs.map((item) => ({
        id: item.id,
        filename: item.filename,
        url: item.url,
        mimeType: item.mimeType,
        alt: item.alt,
      })),
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
