/**
 * GET /api/auth/me
 * Get current logged-in user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, getUserIdFromRequest } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    const supabase = createAdminClient()

    // Get user details
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, avatar_url, status, created_at')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json(errorResponse('User not found'), { status: 404 })
    }

    return NextResponse.json(successResponse(userData))
  } catch (error) {
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
