import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Don't expose sensitive data, just check if they exist
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URI: process.env.DATABASE_URI ? 'SET' : 'MISSING',
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? 'SET' : 'MISSING',
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'MISSING',
    NETLIFY: process.env.NETLIFY || 'false',
    URL: process.env.URL || 'MISSING',
    // Check if DATABASE_URI format is correct
    DB_URI_FORMAT: process.env.DATABASE_URI?.startsWith('postgresql://') ? 'POSTGRES' : 'INVALID',
  }

  return NextResponse.json({
    status: 'Environment Check',
    env: envCheck,
    timestamp: new Date().toISOString(),
  })
}
