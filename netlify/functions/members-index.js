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

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .schema('gurukul_main')
      .from('members')
      .select(
        'id, email, first_name, last_name, phone, status, membership_type, joined_date, expiry_date, member_number'
      )
      .order('joined_date', { ascending: false })

    if (error) {
      return json(500, { error: error.message })
    }

    return json(200, {
      success: true,
      members: data || [],
      count: data?.length || 0,
    })
  } catch (error) {
    return json(500, {
      error: 'Failed to fetch members',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
