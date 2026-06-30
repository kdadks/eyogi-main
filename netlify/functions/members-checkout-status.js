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

  const registrationId = event.queryStringParameters?.registrationId || event.pathParameters?.registrationId

  if (!registrationId || typeof registrationId !== 'string') {
    return json(400, { error: 'Registration ID is required' })
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase configuration')
      return json(500, { error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Retrieve checkout session from database
    const { data, error } = await supabase
      .schema('gurukul_main')
      .from('checkout_sessions')
      .select('checkout_data, created_at')
      .eq('registration_id', registrationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
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
      return json(410, {
        error: 'Checkout session expired',
        message: 'Your checkout session has expired. Please start the registration process again.',
      })
    }

    return json(200, {
      success: true,
      checkout: data.checkout_data,
    })
  } catch (error) {
    console.error('Error retrieving checkout session:', error)
    return json(500, { error: 'Internal server error' })
  }
}
