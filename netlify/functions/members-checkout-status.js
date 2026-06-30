import { createClient } from '@supabase/supabase-js'

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' })
  }

  // Accept both registration_id and checkout_id parameters
  const registrationId = event.queryStringParameters?.registrationId || event.pathParameters?.registrationId
  const checkoutId = event.queryStringParameters?.checkoutId || event.pathParameters?.checkoutId

  if (!registrationId && !checkoutId) {
    return json(400, { error: 'Either registration_id or checkout_id is required' })
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase configuration')
      return json(500, { error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Build query based on what we have
    let query = supabase
      .schema('gurukul_main')
      .from('checkout_sessions')
      .select('checkout_data, created_at, registration_id, sumup_checkout_id')

    if (registrationId) {
      query = query.eq('registration_id', registrationId)
      console.log(`📡 [CHECKOUT-STATUS] Querying by registration_id: ${registrationId}`)
    } else if (checkoutId) {
      query = query.eq('sumup_checkout_id', checkoutId)
      console.log(`📡 [CHECKOUT-STATUS] Querying by sumup_checkout_id: ${checkoutId}`)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        console.warn(`⚠️ [CHECKOUT-STATUS] Not found for id: ${registrationId || checkoutId}`)
        return json(404, {
          error: 'Checkout data not found',
          message: 'Please retry membership registration if this page was reopened later.',
        })
      }
      console.error('Database query error:', error)
      return json(500, { error: 'Failed to retrieve checkout data' })
    }

    // Check if session has expired (older than 2 hours)
    const createdAt = new Date(data.created_at)
    const expiryTime = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000)
    if (new Date() > expiryTime) {
      console.warn(`⚠️ [CHECKOUT-STATUS] Session expired for id: ${registrationId || checkoutId}`)
      return json(410, {
        error: 'Checkout session expired',
        message: 'Your checkout session has expired. Please start the registration process again.',
      })
    }

    console.log(`✅ [CHECKOUT-STATUS] Found checkout session, registration_id: ${data.registration_id}`)

    return json(200, {
      success: true,
      registration_id: data.registration_id,
      checkout_id: data.sumup_checkout_id,
      checkout: data.checkout_data,
    })
  } catch (error) {
    console.error('Error retrieving checkout session:', error)
    return json(500, { error: 'Internal server error' })
  }
}
