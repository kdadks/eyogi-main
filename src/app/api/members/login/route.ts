/**
 * POST /api/members/login
 * Authenticate a member and return session
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate inputs
    if (!email || !password) {
      return Response.json({ error: 'Missing required fields: email, password' }, { status: 400 })
    }

    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password,
    })

    if (error) {
      console.error('Login error:', error)
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!data.user) {
      return Response.json({ error: 'Authentication failed' }, { status: 401 })
    }

    // Get member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single()

    if (memberError || !member) {
      console.error('Failed to fetch member:', memberError)
      return Response.json({ error: 'Member not found' }, { status: 404 })
    }

    return Response.json({
      success: true,
      session: data.session,
      member: {
        id: member.id,
        memberNumber: member.member_number,
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name,
        membershipType: member.membership_type,
        status: member.status,
        expiryDate: member.expiry_date,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json(
      {
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
