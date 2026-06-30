/**
 * GET /api/members/donations
 * Get authenticated member's donation history
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  db: { schema: 'gurukul_main' },
})

export async function GET(request: Request) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify token
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceRoleKey)
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Get member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, member_number')
      .eq('auth_user_id', user.id)
      .single()

    if (memberError || !member) {
      return Response.json({ error: 'Member not found' }, { status: 404 })
    }

    // Get donations
    const { data: donations, error: donationsError } = await supabase
      .from('member_donations')
      .select('*')
      .eq('member_id', member.id)
      .order('donation_date', { ascending: false })

    if (donationsError) {
      console.error('Failed to fetch donations:', donationsError)
      return Response.json(
        { error: 'Failed to fetch donations', details: donationsError.message },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
      donations: donations || [],
      total: donations ? donations.reduce((sum, d) => sum + parseFloat(d.amount), 0) : 0,
    })
  } catch (error) {
    console.error('Donations fetch error:', error)
    return Response.json(
      {
        error: 'Failed to fetch donations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
