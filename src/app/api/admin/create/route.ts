/**
 * Admin Creation API Endpoint
 * POST /api/admin/create
 * 
 * Creates a new admin user account
 * 
 * Request body:
 * {
 *   "email": "admin@example.com",
 *   "password": "SecurePassword123",
 *   "full_name": "Admin User"
 * }
 */

import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An admin account with this email already exists' },
        { status: 409 }
      )
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || email,
        role: 'admin',
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: `Auth creation failed: ${authError.message}` },
        { status: 400 }
      )
    }

    if (!authData?.user?.id) {
      return NextResponse.json(
        { error: 'Failed to create admin user' },
        { status: 500 }
      )
    }

    // Create user record in users table
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      full_name: full_name || email,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (dbError) {
      // Clean up auth user if database insertion fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: `Database creation failed: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'admin',
      },
    })
  } catch (error) {
    console.error('Admin creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create admin' },
      { status: 500 }
    )
  }
}
