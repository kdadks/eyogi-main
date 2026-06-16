/**
 * POST /api/auth/logout
 * Logout user
 */

import { NextRequest, NextResponse } from 'next/server'
import { successResponse } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  const response = NextResponse.json(successResponse(null, 'Logged out successfully'))

  // Clear auth cookie
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    maxAge: 0,
  })

  return response
}
