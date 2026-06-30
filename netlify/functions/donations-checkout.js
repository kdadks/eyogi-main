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

  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

function resolveSumupEnvironment(hostname, configuredEnvironment) {
  const host = (hostname || '').toLowerCase()
  const isProductionHost = host === 'eyogigurukul.com' || host === 'www.eyogigurukul.com'

  // Hard safety: UAT and Netlify preview domains must always use sandbox.
  if (!isProductionHost && host.endsWith('.netlify.app')) {
    return 'sandbox'
  }

  return configuredEnvironment === 'production' ? 'production' : 'sandbox'
}

async function createSumUpCheckout(apiKey, checkoutData) {
  const requestBody = {
    amount: checkoutData.amount,
    currency: checkoutData.currency,
    checkout_reference: checkoutData.checkout_reference,
    description: checkoutData.description,
    merchant_code: checkoutData.merchant_code,
    return_url: checkoutData.return_url,
    customer_email: checkoutData.email,
    hosted_checkout: { enabled: true },
  }

  // Validate return_url is not empty
  if (!requestBody.return_url || !requestBody.return_url.startsWith('http')) {
    throw new Error(`Invalid return_url: "${requestBody.return_url}"`)
  }

  console.log('📡 [SUMUP-API] Creating checkout request:', {
    checkout_reference: requestBody.checkout_reference,
    amount: requestBody.amount,
    currency: requestBody.currency,
    return_url: requestBody.return_url,
  })

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
    console.error('❌ [SUMUP-API] Error response:', {
      status: response.status,
      error,
      requestBody: requestBody,
    })
    throw new Error(`SumUp API error (${response.status}): ${error}`)
  }

  const responseData = await response.json()
  console.log('📡 [SUMUP-API] Full response from SumUp:', JSON.stringify(responseData, null, 2))
  return responseData
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const { donationId, amount, firstName, lastName, email, phone } = body

    if (!firstName || !lastName || !email || !amount) {
      return json(400, { error: 'Missing required fields: firstName, lastName, email, amount' })
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount < 5) {
      return json(400, { error: 'Minimum donation amount is EUR 5' })
    }

    const effectiveDonationId =
      typeof donationId === 'string' && donationId.trim().length > 0
        ? donationId.trim()
        : crypto.randomBytes(16).toString('hex')

    const supabase = getSupabase()

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
        return json(500, { error: insertDonationError.message })
      }
    }

    const { data: sumupSettings, error: sumupError } = await supabase
      .schema('gurukul_main')
      .from('settings')
      .select('key, value')
      .in('key', [
        'sumup_environment',
        'sumup_api_key_sandbox',
        'sumup_api_key_production',
        'sumup_merchant_code_sandbox',
        'sumup_merchant_code_production',
        'sumup_merchant_code',
      ])

    if (sumupError) {
      return json(500, { error: sumupError.message })
    }

    const settingsMap = {}
    sumupSettings?.forEach((setting) => {
      settingsMap[setting.key] = setting.value
    })

    const host = event.headers?.host
    const environment = resolveSumupEnvironment(host, settingsMap.sumup_environment)

    const sandboxApiKey = process.env.VITE_SUMUP_SANDBOX_KEY || settingsMap.sumup_api_key_sandbox
    const productionApiKey = process.env.VITE_SUMUP_PRODUCTION_KEY || settingsMap.sumup_api_key_production

    const sandboxMerchantCode =
      process.env.VITE_SUMUP_SANDBOX_MERCHANT_CODE ||
      settingsMap.sumup_merchant_code_sandbox ||
      settingsMap.sumup_merchant_code

    const productionMerchantCode =
      process.env.VITE_SUMUP_PRODUCTION_MERCHANT_CODE ||
      settingsMap.sumup_merchant_code_production ||
      settingsMap.sumup_merchant_code

    const apiKey = environment === 'production' ? productionApiKey : sandboxApiKey
    const merchantCode = environment === 'production' ? productionMerchantCode : sandboxMerchantCode

    const baseUrl =
      process.env.VITE_APP_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || (host ? `https://${host}` : '')
    
    if (!baseUrl) {
      console.error('❌ [DONATIONS-CHECKOUT] baseUrl is empty! host:', host, 'env vars:', {
        VITE_APP_URL: process.env.VITE_APP_URL,
        URL: process.env.URL,
        DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL,
      })
      return json(500, {
        error: 'Server configuration error: cannot determine application URL',
        hint: 'Please ensure VITE_APP_URL or similar environment variables are set',
      })
    }

    const returnUrl = `${baseUrl}/donation/success?donation_id=${effectiveDonationId}`

    if (!apiKey || !merchantCode) {
      const devCheckoutId = `dev_${effectiveDonationId}`
      return json(200, {
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
      email,
    })

    const checkoutUrl = checkout?.hosted_checkout_url
    if (!checkoutUrl) {
      return json(500, { error: 'SumUp API did not return hosted checkout URL' })
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
      return json(500, { error: paymentError.message })
    }

    return json(200, {
      success: true,
      checkout_url: checkoutUrl,
      checkout_id: checkout.id,
      donation_id: effectiveDonationId,
      amount: numericAmount,
      currency: 'EUR',
    })
  } catch (error) {
    return json(500, {
      error: 'Failed to create donation checkout',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
