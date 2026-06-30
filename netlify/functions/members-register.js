import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
}

function getSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    db: { schema: 'gurukul_main' },
  })
}

async function sendPasswordCreationEmail(email, firstName, token) {
  const appUrl =
    process.env.VITE_APP_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://eyogigurukul.com'
  const setPasswordUrl = `${appUrl}/members/set-password?token=${token}`

  console.log(`
========================================
PASSWORD CREATION EMAIL
========================================
To: ${email}
Subject: Create Your eYogi Member Password

Hi ${firstName},

Welcome to eYogi! Your membership registration is almost complete.

Please create your password by clicking the link below:
${setPasswordUrl}

This link will expire in 24 hours.

Best regards,
The eYogi Team
========================================
  `)
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {}
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

    if (!firstName || !lastName || !email || !membershipType) {
      return json(400, {
        error: 'Missing required fields: firstName, lastName, email, membershipType',
      })
    }

    const supabase = getSupabase()

    const { data: existing } = await supabase.from('members').select('id').eq('email', email.toLowerCase()).maybeSingle()

    if (existing) {
      return json(400, { error: 'A member with this email already exists' })
    }

    const { data: memberNumber, error: memberNumError } = await supabase.rpc('generate_member_number')
    if (memberNumError || !memberNumber) {
      return json(500, { error: 'Failed to generate member number' })
    }

    const joinedDate = new Date()
    const { data: expiryDate, error: expiryError } = await supabase.rpc('calculate_membership_expiry', {
      membership_type: membershipType,
      start_date: joinedDate.toISOString(),
    })

    if (expiryError || !expiryDate) {
      return json(500, { error: 'Failed to calculate membership expiry' })
    }

    const passwordToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date()
    tokenExpiry.setHours(tokenExpiry.getHours() + 24)

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
        status: 'pending',
        joined_date: joinedDate.toISOString(),
        expiry_date: expiryDate,
        auto_renew: true,
        password_reset_token: passwordToken,
        password_reset_expires: tokenExpiry.toISOString(),
      })
      .select()
      .single()

    if (memberError) {
      return json(500, { error: 'Failed to create member', details: memberError.message })
    }

    try {
      await sendPasswordCreationEmail(email, firstName, passwordToken)
    } catch {
      // Ignore email send failure for registration response
    }

    return json(200, {
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
    return json(500, {
      error: 'Failed to register member',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
