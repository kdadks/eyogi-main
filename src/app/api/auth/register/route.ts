/**
 * POST /api/auth/register
 * Register new user account
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, validateRequired, handleApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const validation = validateRequired(body, ['email', 'password', 'full_name'])
    if (validation) {
      return NextResponse.json(errorResponse(validation), { status: 400 })
    }

    const { email, password, full_name } = body
    const supabase = createAdminClient()

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(errorResponse('User already exists'), { status: 409 })
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (authError) {
      return NextResponse.json(handleApiError(authError), { status: 400 })
    }

    // Create user record in users table
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      full_name,
      role: 'public', // Default role
    })

    if (dbError) {
      return NextResponse.json(handleApiError(dbError), { status: 400 })
    }

    return NextResponse.json(
      successResponse(
        {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            full_name,
          },
        },
        'Registration successful',
      ),
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
