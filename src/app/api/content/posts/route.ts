/**
 * GET /api/content/posts
 * List all published posts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    const supabase = createAdminClient()

    let query = supabase
      .from('posts')
      .select('id, title, slug, excerpt, published_at, created_at, created_by', { count: 'exact' })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply search filter
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(handleApiError(error), { status: 400 })
    }

    return NextResponse.json(
      successResponse({
        posts: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
        },
      }),
    )
  } catch (error) {
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
