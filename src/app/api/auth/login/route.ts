/**
 * POST /api/auth/login
 * User login with email and password
 * Authenticates against Supabase Auth only (no users table needed)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, validateRequired } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const validation = validateRequired(body, ['email', 'password'])
    if (validation) {
      return NextResponse.json(errorResponse(validation), { status: 400 })
    }

    const { email, password } = body
    const supabase = createAdminClient()

    // Authenticate user against Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Supabase auth error:', error)
      return NextResponse.json(errorResponse('Invalid credentials'), { status: 401 })
    }

    if (!data?.session) {
      console.error('No session returned from Supabase')
      return NextResponse.json(errorResponse('Authentication failed: no session'), { status: 401 })
    }

    const response = NextResponse.json(
      successResponse(
        {
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
            user: {
              id: data.user.id,
              email: data.user.email,
              user_metadata: data.user.user_metadata,
            },
          },
        },
        'Login successful',
      ),
    )

    // Set secure cookie with access token
    response.cookies.set('auth_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login API error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(errorResponse(errorMessage), { status: 500 })
  }
}
