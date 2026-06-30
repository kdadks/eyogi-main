/**
 * Grant Admin Privileges API Endpoint
 * POST /api/admin/grant-admin
 * 
 * Grants admin role to an existing user
 * 
 * Request body:
 * {
 *   "email": "admin@eyogi.com"
 * }
 */

import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Find the user in auth
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const authUser = authUsers?.users.find(u => u.email === email)

    if (!authUser) {
      return NextResponse.json(
        { error: `User with email ${email} not found in Supabase Auth` },
        { status: 404 }
      )
    }

    // Update user metadata to include admin role
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      {
        user_metadata: {
          ...authUser.user_metadata,
          role: 'admin',
          full_name: authUser.user_metadata?.full_name || email,
        },
      }
    )

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update user metadata: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Check if user exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .single()

    if (!existingUser) {
      // Create user record in users table
      const { error: dbError } = await supabase.from('users').insert({
        id: authUser.id,
        email,
        full_name: authUser.user_metadata?.full_name || email,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (dbError) {
        return NextResponse.json(
          { error: `Failed to create user record: ${dbError.message}` },
          { status: 500 }
        )
      }
    } else {
      // Update existing user record to admin
      const { error: dbError } = await supabase
        .from('users')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', authUser.id)

      if (dbError) {
        return NextResponse.json(
          { error: `Failed to update user record: ${dbError.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: 'Admin privileges granted successfully',
      user: {
        id: authUser.id,
        email: authUser.email,
        role: 'admin',
      },
    })
  } catch (error) {
    console.error('Grant admin error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to grant admin privileges' },
      { status: 500 }
    )
  }
}
