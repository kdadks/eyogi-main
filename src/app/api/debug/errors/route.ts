import { NextResponse } from 'next/server'

// Simple in-memory error storage (will reset on function restart)
let errorLogs: Array<{
  timestamp: string
  error: string
  stack?: string
  page: string
  details?: unknown
}> = []

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    errors: errorLogs.slice(-10), // Return last 10 errors
    count: errorLogs.length,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    errorLogs.push({
      timestamp: new Date().toISOString(),
      error: body.error || 'Unknown error',
      stack: body.stack,
      page: body.page || 'unknown',
      details: body.details,
    })

    // Keep only last 50 errors to prevent memory issues
    if (errorLogs.length > 50) {
      errorLogs = errorLogs.slice(-50)
    }

    return NextResponse.json({ ok: true, logged: true })
  } catch (_err) {
    return NextResponse.json({ ok: false, error: 'Failed to log error' }, { status: 500 })
  }
}
