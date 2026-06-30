import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data, error } = await supabase
      .schema('gurukul_main')
      .from('members')
      .select('id, email, first_name, last_name, phone, status, membership_type, joined_date, expiry_date, member_number')
      .order('joined_date', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({
      success: true,
      members: data || [],
      count: data?.length || 0,
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch members',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
