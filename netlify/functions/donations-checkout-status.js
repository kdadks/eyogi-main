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

  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    const checkoutId = event.queryStringParameters?.checkoutId

    if (!checkoutId || typeof checkoutId !== 'string') {
      return json(400, { error: 'Checkout ID is required' })
    }

    const supabase = getSupabase()

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('checkout_id, donation_id')
      .eq('checkout_id', checkoutId)
      .maybeSingle()

    if (paymentError) {
      return json(500, { error: paymentError.message })
    }

    if (!payment?.donation_id) {
      return json(404, { error: 'Checkout data not found' })
    }

    const { data: donation, error: donationError } = await supabase
      .schema('gurukul_main')
      .from('donations')
      .select('id, amount, donor_first_name, donor_last_name, donor_email, donor_phone, created_at')
      .eq('id', payment.donation_id)
      .maybeSingle()

    if (donationError) {
      return json(500, { error: donationError.message })
    }

    if (!donation) {
      return json(404, { error: 'Checkout data not found' })
    }

    return json(200, {
      success: true,
      checkout: {
        amount: donation.amount,
        firstName: donation.donor_first_name,
        lastName: donation.donor_last_name,
        email: donation.donor_email,
        phone: donation.donor_phone,
        createdAt: donation.created_at,
      },
    })
  } catch (error) {
    return json(500, {
      error: 'Failed to fetch checkout status',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
