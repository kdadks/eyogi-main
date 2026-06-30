import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      donation_id,
      amount,
      firstName,
      lastName,
      email,
      phone,
      status = 'completed',
      payment_method = 'SumUp',
    } = req.body || {}

    if (!donation_id || !amount || !firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

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
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ success: true, donation: data?.[0] || null })
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
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true, donation: data?.[0] || null })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to save donation',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
