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
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const {
      donation_id,
      amount,
      firstName,
      lastName,
      email,
      phone,
      status = 'completed',
      payment_method = 'SumUp',
    } = body

    if (!donation_id || !amount || !firstName || !lastName || !email) {
      return json(400, { error: 'Missing required fields' })
    }

    const supabase = getSupabase()

    const { data: existing } = await supabase
      .schema('gurukul_main')
      .from('donations')
      .select('id')
      .eq('id', donation_id)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .schema('gurukul_main')
        .from('donations')
        .update({
          status,
          payment_method,
          updated_at: new Date().toISOString(),
        })
        .eq('id', donation_id)
        .select()

      if (error) {
        return json(500, { error: error.message })
      }

      return json(200, { success: true, donation: data?.[0] || null })
    }

    const { data, error } = await supabase
      .schema('gurukul_main')
      .from('donations')
      .insert({
        id: donation_id,
        donor_first_name: firstName,
        donor_last_name: lastName,
        donor_email: email,
        donor_phone: phone || null,
        amount,
        currency: 'EUR',
        status,
        payment_method,
        donation_date: new Date().toISOString(),
        transaction_id: donation_id,
      })
      .select()

    if (error) {
      return json(500, { error: error.message })
    }

    return json(200, { success: true, donation: data?.[0] || null })
  } catch (error) {
    return json(500, {
      error: 'Failed to save donation',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
