import { NextResponse } from 'next/server'

export async function GET() {
  const hasToken = !!process.env.UPLOADTHING_TOKEN
  const tokenLength = process.env.UPLOADTHING_TOKEN?.length || 0
  const hasSecret = !!process.env.UPLOADTHING_SECRET
  const secretLength = process.env.UPLOADTHING_SECRET?.length || 0

  return NextResponse.json({
    token: {
      configured: hasToken,
      length: tokenLength,
      preview: hasToken
        ? `${process.env.UPLOADTHING_TOKEN?.slice(0, 10)}...${process.env.UPLOADTHING_TOKEN?.slice(-10)}`
        : 'NOT_SET',
    },
    secret: {
      configured: hasSecret,
      length: secretLength,
      preview: hasSecret
        ? `${process.env.UPLOADTHING_SECRET?.slice(0, 7)}...${process.env.UPLOADTHING_SECRET?.slice(-4)}`
        : 'NOT_SET',
    },
    env: process.env.NODE_ENV,
    recommendation: hasToken
      ? 'Using TOKEN (modern)'
      : hasSecret
        ? 'Using SECRET (legacy)'
        : 'NOT CONFIGURED',
  })
}
