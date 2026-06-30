/**
 * POST /api/members/register-with-payment
 * 
 * Completes member registration after successful SumUp payment
 * Verifies payment status and creates member record
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

/**
 * Check SumUp checkout status
 */
async function checkSumUpCheckoutStatus(apiKey: string, checkoutId: string) {
  try {
    console.log(`🔍 [VERIFY] Checking SumUp checkout status for: ${checkoutId}`)

    const response = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ [VERIFY] SumUp API error: ${response.status} - ${error}`)
      return null
    }

    const data = await response.json()
    console.log(`✅ [VERIFY] Checkout status: ${data.status}`)
    console.log(`📊 [VERIFY] Transactions: ${data.transactions?.length || 0}`)

    return data
  } catch (error) {
    console.error('❌ [VERIFY] Error checking checkout status:', error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    console.log('\n📥 [MEMBER-REGISTER] Request received')

    const body = await request.json()
    const { checkoutId, registrationData, membershipType, amount } = body

    console.log('📥 [MEMBER-REGISTER] Body:', body)

    if (!checkoutId || !registrationData) {
      console.error('❌ [MEMBER-REGISTER] Missing required fields')
      return Response.json(
        { error: 'Missing checkoutId or registrationData' },
        { status: 400 }
      )
    }

    console.log(`✅ [MEMBER-REGISTER] Validating payment for checkout: ${checkoutId}`)

    // Check if in dev mode (mock checkout ID)
    const isDevMode = checkoutId.startsWith('dev_') || checkoutId.startsWith('MOCK_')

    if (!isDevMode) {
      // Get SumUp config
      const { data: sumupSettings, error: settingsError } = await supabase
        .schema('gurukul_main')
        .from('settings')
        .select('key, value')
        .in('key', ['sumup_environment', 'sumup_api_key_sandbox', 'sumup_api_key_production'])

      if (!settingsError && sumupSettings) {
        const settingsMap = new Map(sumupSettings.map((s: any) => [s.key, s.value]))

        const isProduction = settingsMap.get('sumup_environment') === 'production'
        const apiKey = isProduction
          ? settingsMap.get('sumup_api_key_production')
          : settingsMap.get('sumup_api_key_sandbox')

        if (apiKey) {
          // Verify payment with SumUp
          const checkout = await checkSumUpCheckoutStatus(apiKey, checkoutId)

          if (!checkout) {
            console.error('❌ [MEMBER-REGISTER] Could not verify checkout')
            return Response.json(
              {
                error: 'Payment verification failed. Please contact support.',
              },
              { status: 400 }
            )
          }

          // Check if payment was completed
          const isPaid =
            checkout.transactions &&
            checkout.transactions.length > 0 &&
            checkout.transactions.some((t: any) => t.status === 'SUCCESSFUL')

          if (!isPaid) {
            console.error(
              `❌ [MEMBER-REGISTER] Payment not completed. Status: ${checkout.status}`
            )
            return Response.json(
              { error: 'Payment was not completed. Please try again.' },
              { status: 400 }
            )
          }

          console.log(`✅ [MEMBER-REGISTER] Payment verified successfully`)
        } else {
          console.log(`⚠️  [MEMBER-REGISTER] No SumUp API key, skipping verification`)
        }
      } else {
        console.log(`⚠️  [MEMBER-REGISTER] Could not fetch SumUp settings, skipping verification`)
      }
    } else {
      console.log(`✅ [MEMBER-REGISTER] Dev mode - skipping SumUp verification`)
    }

    // Continue with member registration
    const { firstName, lastName, email, phone, addressLine1, city, state, postalCode, country } =
      registrationData

    // Validate required fields
    if (!firstName || !lastName || !email) {
      console.error('❌ [MEMBER-REGISTER] Missing registration data')
      return Response.json(
        { error: 'Missing required registration fields' },
        { status: 400 }
      )
    }

    console.log(`📝 [MEMBER-REGISTER] Creating member: ${email}`)

    // Generate member number using RPC
    const { data: memberNumber, error: memberNumError } = await supabase.rpc(
      'generate_member_number'
    )

    if (memberNumError || !memberNumber) {
      console.error('❌ [MEMBER-REGISTER] Failed to generate member number:', memberNumError)
      return Response.json(
        { error: 'Failed to generate member number' },
        { status: 500 }
      )
    }

    console.log(`✅ [MEMBER-REGISTER] Member number generated: ${memberNumber}`)

    // Calculate expiry date
    const joinedDate = new Date()
    const { data: expiryDate, error: expiryError } = await supabase.rpc(
      'calculate_membership_expiry',
      {
        membership_type: membershipType,
        start_date: joinedDate.toISOString(),
      }
    )

    if (expiryError || !expiryDate) {
      console.error('❌ [MEMBER-REGISTER] Failed to calculate expiry:', expiryError)
      return Response.json(
        { error: 'Failed to calculate membership expiry' },
        { status: 500 }
      )
    }

    console.log(`✅ [MEMBER-REGISTER] Expiry date calculated: ${expiryDate}`)

    // Generate password reset token
    const passwordToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date()
    tokenExpiry.setHours(tokenExpiry.getHours() + 24)

    // Create member record
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
        status: 'active', // Active since payment succeeded
        joined_date: joinedDate.toISOString(),
        expiry_date: expiryDate,
        auto_renew: true,
        password_reset_token: passwordToken,
        password_reset_expires: tokenExpiry.toISOString(),
      })
      .select()
      .single()

    if (memberError) {
      console.error('❌ [MEMBER-REGISTER] Failed to create member:', memberError)
      return Response.json(
        {
          error: 'Failed to create member',
          details: memberError.message,
        },
        { status: 500 }
      )
    }

    console.log(`✅ [MEMBER-REGISTER] Member created: ${member.id}`)

    // Create payment record if we have the details
    if (checkoutId && amount) {
      const { error: paymentError } = await supabase.from('member_payments').insert({
        member_id: member.id,
        amount: amount,
        currency: 'EUR',
        payment_type: membershipType === 'annual' ? 'annual_membership' : 'monthly_membership',
        status: 'completed',
        payment_date: new Date().toISOString(),
        payment_method: 'sumup',
        transaction_id: checkoutId,
      })

      if (paymentError) {
        console.error('❌ [MEMBER-REGISTER] Failed to create payment record:', paymentError)
        // Don't fail the registration if payment record fails
      } else {
        console.log(`✅ [MEMBER-REGISTER] Payment record created`)
      }
    }

    console.log(`✅ [MEMBER-REGISTER] Member registration completed successfully`)

    return Response.json({
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
    console.error('❌ [MEMBER-REGISTER] Error:', error)
    return Response.json(
      {
        error: 'Failed to complete registration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
