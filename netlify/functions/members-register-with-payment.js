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

  if (!isProductionHost && host.endsWith('.netlify.app')) {
    return 'sandbox'
  }

  return configuredEnvironment === 'production' ? 'production' : 'sandbox'
}

async function checkSumUpCheckoutStatus(apiKey, checkoutId) {
  const response = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    return null
  }

  return response.json()
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const { checkoutId, registrationData, membershipType, amount, isDevMode } = body

    if (!checkoutId || !registrationData) {
      return json(400, { error: 'Missing checkoutId or registrationData' })
    }

    const host = (event.headers?.host || '').toLowerCase()
    const isNetlifyPreviewHost = host.endsWith('.netlify.app')
    const isReferenceStyleId = typeof checkoutId === 'string' && /^MEM_/i.test(checkoutId)
    const isCheckoutIdStyle = typeof checkoutId === 'string' && /^c-/i.test(checkoutId)

    const shouldBypassVerification =
      isDevMode === true ||
      checkoutId.startsWith('dev_') ||
      checkoutId.startsWith('MOCK_') ||
      (isNetlifyPreviewHost && isReferenceStyleId && !isCheckoutIdStyle)

    const supabase = getSupabase()

    if (!shouldBypassVerification) {
      const { data: sumupSettings } = await supabase
        .schema('gurukul_main')
        .from('settings')
        .select('key, value')
        .in('key', ['sumup_environment', 'sumup_api_key_sandbox', 'sumup_api_key_production'])

      if (sumupSettings?.length) {
        const settingsMap = {}
        sumupSettings.forEach((setting) => {
          settingsMap[setting.key] = setting.value
        })

        const host = event.headers?.host
        const environment = resolveSumupEnvironment(host, settingsMap.sumup_environment)
        const apiKey =
          environment === 'production'
            ? process.env.VITE_SUMUP_PRODUCTION_KEY || settingsMap.sumup_api_key_production
            : process.env.VITE_SUMUP_SANDBOX_KEY || settingsMap.sumup_api_key_sandbox

        if (apiKey) {
          const checkout = await checkSumUpCheckoutStatus(apiKey, checkoutId)
          if (!checkout) {
            return json(400, { error: 'Payment verification failed. Please contact support.' })
          }

          const isPaid =
            checkout.transactions &&
            checkout.transactions.length > 0 &&
            checkout.transactions.some((transaction) => transaction.status === 'SUCCESSFUL')

          if (!isPaid) {
            return json(400, { error: 'Payment was not completed. Please try again.' })
          }
        }
      }
    }

    const { firstName, lastName, email, phone, addressLine1, city, state, postalCode, country } = registrationData

    if (!firstName || !lastName || !email) {
      return json(400, { error: 'Missing required registration fields' })
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
        status: 'active',
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

    if (checkoutId && amount) {
      await supabase.from('member_payments').insert({
        member_id: member.id,
        amount,
        currency: 'EUR',
        payment_type: membershipType === 'annual' ? 'annual_membership' : 'monthly_membership',
        status: 'completed',
        payment_date: new Date().toISOString(),
        payment_method: 'sumup',
        transaction_id: checkoutId,
      })
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
      message: 'Registration successful! Please check your email to create your password.',
    })
  } catch (error) {
    return json(500, {
      error: 'Failed to complete registration',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
