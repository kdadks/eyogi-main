import { NextResponse } from 'next/server'

export async function GET() {
  const hasSecret = !!process.env.UPLOADTHING_SECRET
  const secretLength = process.env.UPLOADTHING_SECRET?.length || 0

  return NextResponse.json({
    configured: hasSecret,
    secretLength: secretLength,
    env: process.env.NODE_ENV,
    // Only show first/last 4 chars for security
    secretPreview: hasSecret
      ? `${process.env.UPLOADTHING_SECRET?.slice(0, 7)}...${process.env.UPLOADTHING_SECRET?.slice(-4)}`
      : 'NOT_SET',
  })
}
