import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('🔥 DEBUG API CALLED!')

  const response = {
    ok: true,
    message: 'Debug endpoint is working - Console logs enabled!',
    timestamp: new Date().toISOString(),
    consoleLogsEnabled: true,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL || 'missing',
      DATABASE_URI: process.env.DATABASE_URI ? 'present' : 'missing',
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? 'present' : 'missing',
    },
  }

  console.log('📊 DEBUG API Response:', response)
  return NextResponse.json(response)
}
