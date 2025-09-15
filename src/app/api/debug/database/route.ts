import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test database connection without Payload
    const { Pool } = await import('pg')

    const pool = new Pool({
      connectionString: process.env.DATABASE_URI,
      ssl: {
        rejectUnauthorized: false,
      },
    })

    const client = await pool.connect()
    const result = await client.query('SELECT NOW() as current_time')
    client.release()
    await pool.end()

    return NextResponse.json({
      ok: true,
      database: 'connected',
      timestamp: result.rows[0].current_time,
      env: {
        DATABASE_URI: process.env.DATABASE_URI
          ? `${process.env.DATABASE_URI.substring(0, 20)}...`
          : 'missing',
        NODE_ENV: process.env.NODE_ENV,
        NETLIFY: process.env.NETLIFY || 'false',
      },
    })
  } catch (err) {
    console.error('Database test error:', err)
    return NextResponse.json(
      {
        ok: false,
        error: (err as Error).message,
        env: {
          DATABASE_URI: process.env.DATABASE_URI
            ? `${process.env.DATABASE_URI.substring(0, 20)}...`
            : 'missing',
          NODE_ENV: process.env.NODE_ENV,
          NETLIFY: process.env.NETLIFY || 'false',
        },
      },
      { status: 500 },
    )
  }
}
