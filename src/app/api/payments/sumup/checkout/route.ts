/**
 * POST /api/payments/sumup/checkout
 * 
 * Creates a SumUp checkout session
 * This endpoint must run on the server to keep API keys secure
 */

import { createClient } from '@supabase/supabase-js'
import { createSumUpCheckout } from '@/lib/sumup/checkout'
import { isProductionEnvironment } from '@/lib/sumup/config'

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
      amount,
      currency = 'EUR',
      checkout_reference, // donation_id
      description,
      merchant_code,
      return_url,
      email,
    } = body

    // Validate required fields
    if (!amount || !checkout_reference || !merchant_code || !return_url || !email) {
      return Response.json(
        {
          error: 'Missing required fields',
          details: 'amount, checkout_reference, merchant_code, return_url, and email are required',
        },
        { status: 400 }
      )
    }

    // Get the appropriate API key based on environment
    const isProduction = isProductionEnvironment()
    const apiKey = isProduction
      ? process.env.VITE_SUMUP_PRODUCTION_KEY
      : process.env.VITE_SUMUP_SANDBOX_KEY

    if (!apiKey) {
      console.error(`SumUp ${isProduction ? 'production' : 'sandbox'} API key not configured`)
      return Response.json(
        {
          error: 'Payment service not configured',
          environment: isProduction ? 'production' : 'sandbox',
        },
        { status: 500 }
      )
    }

    // Create the SumUp checkout
    const checkout = await createSumUpCheckout(apiKey, {
      amount,
      currency,
      checkout_reference,
      description,
      merchant_code,
      return_url,
      redirect_url: return_url,
      email,
      hosted_checkout: { enabled: true },
    })

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        donation_id: checkout_reference,
        provider: 'sumup',
        amount,
        currency,
        status: 'pending',
        checkout_id: checkout.id,
        checkout_url: checkout.hosted_checkout_url || checkout.checkout_url,
        payment_method: 'card', // SumUp default
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      return Response.json(
        {
          error: 'Failed to create payment record',
          message: paymentError.message,
        },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      checkout_url: checkout.hosted_checkout_url || checkout.checkout_url,
      checkout_id: checkout.id,
      payment_id: payment.id,
      status: checkout.status,
    })
  } catch (error) {
    console.error('SumUp checkout error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout'

    return Response.json(
      {
        error: 'Failed to create payment checkout',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/payments/sumup/checkout
 * 
 * Health check endpoint
 */
export async function GET(request: Request) {
  try {
    const isProduction = isProductionEnvironment()
    const apiKey = isProduction
      ? process.env.VITE_SUMUP_PRODUCTION_KEY
      : process.env.VITE_SUMUP_SANDBOX_KEY

    const isConfigured = !!apiKey

    return Response.json({
      status: 'ok',
      environment: isProduction ? 'production' : 'sandbox',
      configured: isConfigured,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
