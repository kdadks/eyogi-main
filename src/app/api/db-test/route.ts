import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test if we can import and use postgres
    const { Client } = await import('pg')
    
    const client = new Client({
      connectionString: process.env.DATABASE_URI,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })

    await client.connect()
    const result = await client.query('SELECT NOW() as current_time, version() as db_version')
    await client.end()

    return NextResponse.json({
      status: 'Database Connected',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].db_version,
      connection: 'SUCCESS',
    })
  } catch (error) {
    console.error('Database connection error:', error)
    
    return NextResponse.json({
      status: 'Database Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof Error && 'code' in error ? error.code : 'NO_CODE',
      connection: 'FAILED',
    }, { status: 500 })
  }
}