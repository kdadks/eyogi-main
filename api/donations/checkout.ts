import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function createSumUpCheckout(apiKey: string, checkoutData: any) {
  const requestBody = {
    amount: checkoutData.amount,
    currency: checkoutData.currency,
    checkout_reference: checkoutData.checkout_reference,
    description: checkoutData.description,
    merchant_code: checkoutData.merchant_code,
    return_url: checkoutData.return_url,
    redirect_url: checkoutData.redirect_url || checkoutData.return_url,
    success_url: checkoutData.success_url || checkoutData.return_url,
    cancel_url: checkoutData.cancel_url || checkoutData.return_url,
    customer_email: checkoutData.email,
    hosted_checkout: checkoutData.hosted_checkout || { enabled: true },
    locale: 'en-IE',
  }

  const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SumUp API error (${response.status}): ${error}`)
  }

  return response.json()
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { donationId, amount, firstName, lastName, email, phone } = req.body || {}

    if (!firstName || !lastName || !email || !amount) {
      return res.status(400).json({ error: 'Missing required fields: firstName, lastName, email, amount' })
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount < 5) {
      return res.status(400).json({ error: 'Minimum donation amount is EUR 5' })
    }

    const effectiveDonationId =
      typeof donationId === 'string' && donationId.trim().length > 0
        ? donationId.trim()
        : crypto.randomBytes(16).toString('hex')

    const { data: existingDonation } = await supabase
      .schema('gurukul_main')
      .from('donations')
      .select('id')
      .eq('id', effectiveDonationId)
      .maybeSingle()

    if (!existingDonation) {
      const { error: insertDonationError } = await supabase
        .schema('gurukul_main')
        .from('donations')
        .insert({
          id: effectiveDonationId,
          amount: numericAmount,
          donor_first_name: firstName,
          donor_last_name: lastName,
          donor_email: email,
          donor_phone: phone || null,
          status: 'pending',
          payment_method: 'SumUp',
          donation_date: new Date().toISOString(),
        })

      if (insertDonationError) {
        return res.status(500).json({ error: insertDonationError.message })
      }
    }

    const { data: sumupSettings, error: sumupError } = await supabase
      .schema('gurukul_main')
      .from('settings')
      .select('key, value')
      .in('key', ['sumup_environment', 'sumup_api_key_sandbox', 'sumup_api_key_production', 'sumup_merchant_code'])

    if (sumupError) {
      return res.status(500).json({ error: sumupError.message })
    }

    const settingsMap: Record<string, string> = {}
    sumupSettings?.forEach((s: any) => {
      settingsMap[s.key] = s.value
    })

    const isProduction = settingsMap.sumup_environment === 'production'
    const apiKey = isProduction ? settingsMap.sumup_api_key_production : settingsMap.sumup_api_key_sandbox
    const merchantCode = settingsMap.sumup_merchant_code

    const baseUrl = process.env.VITE_APP_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`
    const returnUrl = `${baseUrl}/donation/success?donation_id=${effectiveDonationId}`

    if (!apiKey || !merchantCode) {
      const devCheckoutId = `dev_${effectiveDonationId}`
      return res.status(200).json({
        success: true,
        checkout_url: `${returnUrl}&status=completed&dev_mode=true&checkout_id=${devCheckoutId}`,
        checkout_id: devCheckoutId,
        donation_id: effectiveDonationId,
        amount: numericAmount,
        currency: 'EUR',
        dev_mode: true,
      })
    }

    const checkout = await createSumUpCheckout(apiKey, {
      checkout_reference: effectiveDonationId,
      amount: numericAmount,
      currency: 'EUR',
      merchant_code: merchantCode,
      description: 'Donation to eYogi Gurukul',
      return_url: returnUrl,
      redirect_url: returnUrl,
      email,
      hosted_checkout: { enabled: true },
    })

    const checkoutUrl = checkout.hosted_checkout_url || checkout.hosted_checkout?.url
    if (!checkoutUrl) {
      return res.status(500).json({ error: 'SumUp API did not return hosted checkout URL' })
    }

    const { error: paymentError } = await supabase.from('payments').insert({
      donation_id: effectiveDonationId,
      provider: 'sumup',
      amount: numericAmount,
      currency: 'EUR',
      status: 'pending',
      checkout_id: checkout.id,
      checkout_url: checkoutUrl,
      payment_method: 'card',
    })

    if (paymentError) {
      return res.status(500).json({ error: paymentError.message })
    }

    return res.status(200).json({
      success: true,
      checkout_url: checkoutUrl,
      checkout_id: checkout.id,
      donation_id: effectiveDonationId,
      amount: numericAmount,
      currency: 'EUR',
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create donation checkout',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
