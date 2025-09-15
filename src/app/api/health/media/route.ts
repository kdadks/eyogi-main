import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = await configPromise
    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'media',
      limit: 5,
      sort: '-updatedAt',
      select: {
        id: true,
        filename: true,
        url: true,
        thumbnailURL: true,
        mimeType: true,
      },
    })

    const results = await Promise.all(
      docs.map(async (m) => {
        const url = m.thumbnailURL || m.url
        if (!url) {
          return { id: m.id, ok: false, status: 0, error: 'no-url' }
        }
        try {
          const res = await fetch(url, { method: 'HEAD', cache: 'no-store' })
          return { id: m.id, ok: res.ok, status: res.status, url }
        } catch (e) {
          return { id: m.id, ok: false, status: 0, url, error: String(e) }
        }
      }),
    )

    const ok = results.every((r) => r.ok)
    return NextResponse.json({ ok, count: results.length, results })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
