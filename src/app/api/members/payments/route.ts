/**
 * GET /api/members/payments
 * Get authenticated member's payment history (membership payments)
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

    // Get payments
    const { data: payments, error: paymentsError } = await supabase
      .from('member_payments')
      .select('*')
      .eq('member_id', member.id)
      .order('payment_date', { ascending: false })

    if (paymentsError) {
      console.error('Failed to fetch payments:', paymentsError)
      return Response.json(
        { error: 'Failed to fetch payments', details: paymentsError.message },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
      payments: payments || [],
      total: payments ? payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) : 0,
    })
  } catch (error) {
    console.error('Payments fetch error:', error)
    return Response.json(
      {
        error: 'Failed to fetch payments',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
