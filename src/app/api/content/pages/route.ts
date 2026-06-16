/**
 * GET /api/content/pages
 * List all published pages
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createAdminClient()

    const { data, error, count } = await supabase
      .from('pages')
      .select('id, title, slug, excerpt, meta_title, meta_description, status, created_at', {
        count: 'exact',
      })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(handleApiError(error), { status: 400 })
    }

    return NextResponse.json(
      successResponse({
        pages: data || [],
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
