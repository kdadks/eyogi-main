/**
 * GET /api/users/profile
 * Get current user profile
 *
 * PUT /api/users/profile
 * Update current user profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  successResponse,
  errorResponse,
  getUserIdFromRequest,
  handleApiError,
} from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, role, status, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json(errorResponse('User not found'), { status: 404 })
    }

    return NextResponse.json(successResponse(data))
  } catch (error) {
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    const body = await request.json()

    // Only allow updating specific fields
    const allowedFields = ['full_name', 'avatar_url']
    const updateData: Record<string, any> = {}

    allowedFields.forEach((field) => {
      if (field in body) {
        updateData[field] = body[field]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(errorResponse('No valid fields to update'), { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(handleApiError(error), { status: 400 })
    }

    return NextResponse.json(successResponse(data, 'Profile updated successfully'))
  } catch (error) {
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
