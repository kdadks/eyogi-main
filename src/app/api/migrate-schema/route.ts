import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { ensureMediaSchema } from '@/utilities/ensureSchema'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = await configPromise
    const payload = await getPayload({ config })
    const pool = (payload.db as any)?.pool

    await ensureMediaSchema(payload)

    let columns: any[] = []
    if (pool && typeof pool.query === 'function') {
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'media'
        ORDER BY ordinal_position;
      `)
      columns = result.rows
    }

    return NextResponse.json({
      success: true,
      message: 'Media schema verified and updated successfully',
      mediaColumns: columns,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
      },
      { status: 500 },
    )
  }
}
