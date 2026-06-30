/**
 * POST /api/members/register
 * Register a new member and trigger payment workflow
 */

import { createClient } from '@supabase/supabase-js'
import { sendPasswordCreationEmail } from '@/lib/email/memberEmailService'
import crypto from 'crypto'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  db: { schema: 'gurukul_main' },
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      addressLine1,
      city,
      state,
      postalCode,
      country = 'Ireland',
      membershipType = 'monthly',
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !membershipType) {
      return Response.json(
        { error: 'Missing required fields: firstName, lastName, email, membershipType' },
        { status: 400 },
      )
    }

    // Check if member already exists
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return Response.json({ error: 'A member with this email already exists' }, { status: 400 })
    }

    // Generate member number
    const { data: memberNumber, error: memberNumError } = await supabase.rpc(
      'generate_member_number',
    )

    if (memberNumError || !memberNumber) {
      console.error('Failed to generate member number:', memberNumError)
      return Response.json({ error: 'Failed to generate member number' }, { status: 500 })
    }

    // Calculate expiry date
    const joinedDate = new Date()
    const { data: expiryDate, error: expiryError } = await supabase.rpc(
      'calculate_membership_expiry',
      {
        membership_type: membershipType,
        start_date: joinedDate.toISOString(),
      },
    )

    if (expiryError || !expiryDate) {
      console.error('Failed to calculate expiry:', expiryError)
      return Response.json({ error: 'Failed to calculate membership expiry' }, { status: 500 })
    }

    // Generate password reset token
    const passwordToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date()
    tokenExpiry.setHours(tokenExpiry.getHours() + 24) // 24 hours expiry

    // Create member record
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        address_line_1: addressLine1?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        postal_code: postalCode?.trim() || null,
        country: country?.trim() || 'Ireland',
        member_number: memberNumber,
        membership_type: membershipType,
        status: 'pending', // Will be activated after payment
        joined_date: joinedDate.toISOString(),
        expiry_date: expiryDate,
        auto_renew: true,
        password_reset_token: passwordToken,
        password_reset_expires: tokenExpiry.toISOString(),
      })
      .select()
      .single()

    if (memberError) {
      console.error('Failed to create member:', memberError)
      return Response.json(
        { error: 'Failed to create member', details: memberError.message },
        { status: 500 },
      )
    }

    // Send password creation email
    try {
      await sendPasswordCreationEmail(email, firstName, passwordToken)
    } catch (emailError) {
      console.error('Failed to send password creation email:', emailError)
      // Don't fail the registration if email fails
    }

    return Response.json({
      success: true,
      member: {
        id: member.id,
        memberNumber: member.member_number,
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name,
        membershipType: member.membership_type,
        status: member.status,
      },
      message: 'Registration successful. Please check your email to create your password.',
    })
  } catch (error) {
    console.error('Member registration error:', error)
    return Response.json(
      {
        error: 'Failed to register member',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
