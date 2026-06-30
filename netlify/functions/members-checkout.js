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

async function createSumUpCheckout(apiKey, checkoutData) {
  const requestBody = {
    amount: checkoutData.amount,
    currency: checkoutData.currency,
    checkout_reference: checkoutData.checkout_reference,
    description: checkoutData.description,
    merchant_code: checkoutData.merchant_code,
    return_url: checkoutData.return_url,
    redirect_url: checkoutData.redirect_url || checkoutData.return_url,
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
      country,
      membershipType,
    } = body

    if (!firstName || !lastName || !email || !membershipType) {
      return json(400, {
        error: 'Missing required fields: firstName, lastName, email, membershipType',
      })
    }

    if (!['monthly', 'annual'].includes(membershipType)) {
      return json(400, { error: 'Invalid membershipType. Must be "monthly" or "annual"' })
    }

    const supabase = getSupabase()
    const priceKey = membershipType === 'monthly' ? 'membership_monthly_price' : 'membership_annual_price'
    const defaultPrices = {
      membership_monthly_price: 11.0,
      membership_annual_price: 120.0,
    }

    let amount = defaultPrices[priceKey]

    const { data: priceSetting } = await supabase
      .schema('gurukul_main')
      .from('settings')
      .select('value')
      .eq('key', priceKey)
      .maybeSingle()

    if (priceSetting?.value) {
      const parsed = parseFloat(priceSetting.value)
      if (Number.isFinite(parsed) && parsed > 0) {
        amount = parsed
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
        'sumup_merchant_code',
      ])

    if (sumupError) {
      return json(500, { error: 'Failed to fetch payment configuration' })
    }

    const settingsMap = {}
    sumupSettings?.forEach((setting) => {
      settingsMap[setting.key] = setting.value
    })

    const environment = settingsMap.sumup_environment || 'sandbox'
    const merchantCode = settingsMap.sumup_merchant_code
    const apiKey =
      environment === 'production' ? settingsMap.sumup_api_key_production : settingsMap.sumup_api_key_sandbox

    const host = event.headers?.host
    const baseUrl =
      process.env.VITE_APP_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || (host ? `https://${host}` : '')

    const checkoutReference = `MEM_${Date.now()}`

    if (!apiKey || !merchantCode) {
      const mockCheckoutId = `MOCK_${Date.now()}`
      const mockReturnUrl = `${baseUrl}/membership/confirmation?checkout_id=${mockCheckoutId}&dev_mode=true`

      return json(200, {
        registration_id: checkoutReference,
        registration_data: {
          firstName,
          lastName,
          email,
          phone,
          addressLine1,
          city,
          state,
          postalCode,
          country,
          membershipType,
        },
        checkout_id: mockCheckoutId,
        amount,
        currency: 'EUR',
        membershipType,
        checkout_url: mockReturnUrl,
        dev_mode: true,
      })
    }

    const returnUrl = `${baseUrl}/membership/confirmation?checkout_id=${checkoutReference}`

    const checkout = await createSumUpCheckout(apiKey, {
      checkout_reference: checkoutReference,
      amount,
      currency: 'EUR',
      merchant_code: merchantCode,
      description: `${membershipType === 'monthly' ? 'Monthly' : 'Annual'} Membership - ${firstName} ${lastName}`,
      return_url: returnUrl,
      redirect_url: returnUrl,
      email,
      hosted_checkout: { enabled: true },
    })

    const checkoutUrl = checkout?.checkout_url || checkout?.hosted_checkout_url || checkout?.hosted_checkout?.url

    if (!checkoutUrl) {
      return json(500, { error: 'SumUp checkout created but no checkout URL returned' })
    }

    return json(200, {
      registration_id: checkoutReference,
      registration_data: {
        firstName,
        lastName,
        email,
        phone,
        addressLine1,
        city,
        state,
        postalCode,
        country,
        membershipType,
      },
      checkout_id: checkout.id,
      amount,
      currency: 'EUR',
      membershipType,
      checkout_url: checkoutUrl,
    })
  } catch (error) {
    return json(500, {
      error: 'Failed to create checkout',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
