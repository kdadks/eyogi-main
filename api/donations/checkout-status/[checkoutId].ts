import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { checkoutId } = req.query

    if (!checkoutId || typeof checkoutId !== 'string') {
      return res.status(400).json({ error: 'Checkout ID is required' })
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('checkout_id, donation_id')
      .eq('checkout_id', checkoutId)
      .maybeSingle()

    if (paymentError) {
      return res.status(500).json({ error: paymentError.message })
    }

    if (!payment?.donation_id) {
      return res.status(404).json({ error: 'Checkout data not found' })
    }

    const { data: donation, error: donationError } = await supabase
      .schema('gurukul_main')
      .from('donations')
      .select('id, amount, donor_first_name, donor_last_name, donor_email, donor_phone, created_at')
      .eq('id', payment.donation_id)
      .maybeSingle()

    if (donationError) {
      return res.status(500).json({ error: donationError.message })
    }

    if (!donation) {
      return res.status(404).json({ error: 'Checkout data not found' })
    }

    return res.status(200).json({
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
    return res.status(500).json({
      error: 'Failed to fetch checkout status',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
