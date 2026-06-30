/**
 * POST /api/members/checkout
 * 
 * Creates a membership checkout session with SumUp payment
 * Validates membership pricing, fetches SumUp config, and creates checkout
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

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
      country,
      membershipType, // 'monthly' or 'annual'
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !membershipType) {
      return Response.json(
        {
          error: 'Missing required fields: firstName, lastName, email, membershipType',
        },
        { status: 400 }
      )
    }

    if (!['monthly', 'annual'].includes(membershipType)) {
      return Response.json(
        {
          error: 'Invalid membershipType. Must be "monthly" or "annual"',
        },
        { status: 400 }
      )
    }

    // Fetch membership pricing from settings with fallback
    const priceKey = membershipType === 'monthly' ? 'membership_monthly_price' : 'membership_annual_price'
    const defaultPrices = {
      membership_monthly_price: 11.00,
      membership_annual_price: 120.00,
    }
    
    let priceValue = defaultPrices[priceKey as keyof typeof defaultPrices]
    
    try {
      const { data: priceSetting, error: priceError } = await supabase
        .schema('gurukul_main')
        .from('settings')
        .select('value')
        .eq('key', priceKey)
        .single()

      if (!priceError && priceSetting) {
        priceValue = parseFloat(priceSetting.value)
      }
    } catch (err) {
      console.warn(`Warning: Could not fetch ${priceKey}, using default: €${defaultPrices[priceKey as keyof typeof defaultPrices]}`)
    }

    const amount = priceValue // Amount in EUR from database
    if (amount <= 0) {
      return Response.json(
        {
          error: 'Invalid membership price',
          amount: priceValue,
        },
        { status: 400 }
      )
    }

    console.log(`💰 Membership price for ${membershipType}: €${amount}`)

    // Fetch SumUp configuration from settings
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
      console.error('SumUp settings fetch error:', sumupError)
      return Response.json(
        {
          error: 'Failed to fetch payment configuration',
        },
        { status: 500 }
      )
    }

    // Parse SumUp settings
    const settingsMap = new Map(sumupSettings.map((s: any) => [s.key, s.value]))
    const environment = settingsMap.get('sumup_environment') || 'sandbox'
    const merchantCode = settingsMap.get('sumup_merchant_code')
    const apiKey =
      environment === 'production'
        ? settingsMap.get('sumup_api_key_production')
        : settingsMap.get('sumup_api_key_sandbox')

    console.log('🔐 SumUp Configuration:')
    console.log(`   Environment: ${environment}`)
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`)
    console.log(`   Merchant Code: ${merchantCode || 'NOT SET'}`)
    console.log(`   Amount: €${amount}`)

    // Check if SumUp is configured
    if (!apiKey || !merchantCode) {
      console.warn('⚠️  SumUp not fully configured - returning mock checkout for development')
      // Return mock checkout for development/testing
      const mockCheckoutId = `MOCK_${Date.now()}`
      const mockReturnUrl = `${new URL(request.url).origin}/membership/confirmation?checkout_id=${mockCheckoutId}&dev_mode=true`
      
      return Response.json({
        registration_id: `REG_${Date.now()}`,
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
        amount: amount,
        currency: 'EUR',
        membershipType,
        checkout_url: mockReturnUrl,
        dev_mode: true,
      })
    }

    // Create SumUp checkout
    console.log('🔄 Creating SumUp checkout...')
    const checkoutReference = `MEM_${Date.now()}`
    const returnUrl = `${new URL(request.url).origin}/membership/confirmation?checkout_id=${checkoutReference}`

    const sumupCheckoutPayload = {
      checkout_reference: checkoutReference,
      amount,
      currency: 'EUR',
      merchant_code: merchantCode,
      description: `${membershipType === 'monthly' ? 'Monthly' : 'Annual'} Membership - ${firstName} ${lastName}`,
      return_url: returnUrl,
    }

    console.log('   Sending to SumUp:', {
      ...sumupCheckoutPayload,
      amount: `${sumupCheckoutPayload.amount} cents`,
    })

    const sumupResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sumupCheckoutPayload),
    })

    if (!sumupResponse.ok) {
      const errorData = await sumupResponse.text()
      console.error(`❌ SumUp API Response Error: Status: ${sumupResponse.status} Body: ${errorData}`)
      return Response.json(
        {
          error: 'Failed to create payment checkout with SumUp',
          status: sumupResponse.status,
          details: errorData,
        },
        { status: 500 }
      )
    }

    const sumupData = await sumupResponse.json()
    const checkoutUrl =
      sumupData.checkout_url || sumupData.hosted_checkout_url || sumupData.hosted_checkout?.url

    console.log('✅ SumUp checkout created:', {
      id: sumupData.id,
      checkout_url: checkoutUrl ? '✓' : '✗',
      full_response: JSON.stringify(sumupData).substring(0, 200),
    })

    // Ensure checkout_url exists
    if (!checkoutUrl) {
      console.error('❌ SumUp checkout missing checkout_url:', sumupData)
      return Response.json(
        {
          error: 'SumUp checkout created but no checkout URL returned',
          details: 'Unable to generate payment link',
        },
        { status: 500 }
      )
    }

    return Response.json({
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
      checkout_id: sumupData.id,
      amount: amount / 100,
      currency: 'EUR',
      membershipType,
      checkout_url: checkoutUrl,
    })
  } catch (error) {
    console.error('❌ Checkout error:', error)
    return Response.json(
      {
        error: 'Failed to create checkout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
