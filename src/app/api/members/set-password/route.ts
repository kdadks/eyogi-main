/**
 * POST /api/members/set-password
 * Set password for a new member using the token from email
 */

import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email/memberEmailService'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  db: { schema: 'gurukul_main' },
})

const supabaseAuth = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = body

    // Validate inputs
    if (!token || !password) {
      return Response.json({ error: 'Missing required fields: token, password' }, { status: 400 })
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Find member by token
    const { data: member, error: findError } = await supabase
      .from('members')
      .select('*')
      .eq('password_reset_token', token)
      .single()

    if (findError || !member) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    // Check token expiry
    if (new Date(member.password_reset_expires) < new Date()) {
      return Response.json({ error: 'Token has expired' }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAuth.auth.admin.createUser({
      email: member.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: member.first_name,
        last_name: member.last_name,
        member_number: member.member_number,
        role: 'member',
      },
    })

    if (authError || !authData.user) {
      console.error('Failed to create Supabase auth user:', authError)
      return Response.json(
        { error: 'Failed to create authentication account', details: authError?.message },
        { status: 500 },
      )
    }

    // Update member with password and auth user ID
    const { error: updateError } = await supabase
      .from('members')
      .update({
        password_hash: passwordHash,
        password_set_at: new Date().toISOString(),
        password_reset_token: null,
        password_reset_expires: null,
        auth_user_id: authData.user.id,
        status: 'active', // Activate member after password is set
      })
      .eq('id', member.id)

    if (updateError) {
      console.error('Failed to update member:', updateError)
      return Response.json(
        { error: 'Failed to update member', details: updateError.message },
        { status: 500 },
      )
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(member.email, member.first_name, member.member_number)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the password set if email fails
    }

    return Response.json({
      success: true,
      message: 'Password created successfully. You can now login to your member portal.',
      memberNumber: member.member_number,
    })
  } catch (error) {
    console.error('Set password error:', error)
    return Response.json(
      {
        error: 'Failed to set password',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
