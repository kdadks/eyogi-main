/**
 * GET /api/content/posts/[id]
 * Get single post by ID or slug
 *
 * PUT /api/content/posts/[id]
 * Update post
 *
 * DELETE /api/content/posts/[id]
 * Delete post
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  successResponse,
  errorResponse,
  handleApiError,
  getUserIdFromRequest,
  validateRequired,
} from '@/lib/api-utils'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = createAdminClient()

    // Try to find by ID or slug
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, slug, excerpt, content, published_at, created_at, updated_at, created_by')
      .or(`id.eq.${id},slug.eq.${id}`)
      .single()

    if (error) {
      return NextResponse.json(errorResponse('Post not found'), { status: 404 })
    }

    return NextResponse.json(successResponse(data))
  } catch (error) {
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    const supabase = createAdminClient()

    // Verify user is creator or admin
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json(errorResponse('Post not found'), { status: 404 })
    }

    if (post.created_by !== userId) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 })
    }

    // Update post
    const { data, error } = await supabase
      .from('posts')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(handleApiError(error), { status: 400 })
    }

    return NextResponse.json(successResponse(data, 'Post updated successfully'))
  } catch (error) {
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    const { id } = params
    const supabase = createAdminClient()

    // Verify user is creator or admin
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json(errorResponse('Post not found'), { status: 404 })
    }

    if (post.created_by !== userId) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 })
    }

    // Delete post
    const { error } = await supabase.from('posts').delete().eq('id', id)

    if (error) {
      return NextResponse.json(handleApiError(error), { status: 400 })
    }

    return NextResponse.json(successResponse(null, 'Post deleted successfully'))
  } catch (error) {
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
