import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Debug endpoint is working',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NETLIFY: process.env.NETLIFY || 'false',
      DATABASE_URI: process.env.DATABASE_URI ? 'present' : 'missing',
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? 'present' : 'missing',
      URL: process.env.URL || 'missing',
    },
  })
}
