/**
 * GET /api/members/profile
 * Get authenticated member's profile and statistics
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

    // Get member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (memberError || !member) {
      return Response.json({ error: 'Member not found' }, { status: 404 })
    }

    // Get donation statistics
    const { data: donations, error: donationsError } = await supabase
      .from('member_donations')
      .select('amount, currency')
      .eq('member_id', member.id)

    const totalDonations = donations
      ? donations.reduce((sum, d) => sum + parseFloat(d.amount), 0)
      : 0

    // Get membership payments
    const { data: payments, error: paymentsError } = await supabase
      .from('member_payments')
      .select('amount, currency')
      .eq('member_id', member.id)
      .eq('status', 'completed')

    const totalContributions = payments
      ? payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      : 0

    // Calculate upcoming renewal
    const expiryDate = new Date(member.expiry_date)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    return Response.json({
      success: true,
      profile: {
        member: {
          id: member.id,
          memberNumber: member.member_number,
          firstName: member.first_name,
          lastName: member.last_name,
          email: member.email,
          phone: member.phone,
          addressLine1: member.address_line_1,
          city: member.city,
          state: member.state,
          postalCode: member.postal_code,
          country: member.country,
          membershipType: member.membership_type,
          status: member.status,
          joinedDate: member.joined_date,
          expiryDate: member.expiry_date,
          autoRenew: member.auto_renew,
        },
        statistics: {
          totalDonations: totalDonations.toFixed(2),
          totalContributions: (totalDonations + totalContributions).toFixed(2),
          daysUntilRenewal: daysUntilExpiry,
          memberSince: new Date(member.joined_date).getFullYear(),
        },
      },
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return Response.json(
      {
        error: 'Failed to fetch profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/members/profile
 * Update authenticated member's profile
 */
export async function PUT(request: Request) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const body = await request.json()

    // Verify token
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceRoleKey)
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Update allowed fields only
    const updateData: any = {}
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.addressLine1 !== undefined) updateData.address_line_1 = body.addressLine1
    if (body.city !== undefined) updateData.city = body.city
    if (body.state !== undefined) updateData.state = body.state
    if (body.postalCode !== undefined) updateData.postal_code = body.postalCode
    if (body.country !== undefined) updateData.country = body.country

    const { data: member, error: updateError } = await supabase
      .from('members')
      .update(updateData)
      .eq('auth_user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return Response.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      member: {
        id: member.id,
        memberNumber: member.member_number,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        phone: member.phone,
        addressLine1: member.address_line_1,
        city: member.city,
        state: member.state,
        postalCode: member.postal_code,
        country: member.country,
      },
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return Response.json(
      {
        error: 'Failed to update profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
