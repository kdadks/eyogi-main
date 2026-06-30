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
  const memberId = event.queryStringParameters?.memberId

  if (!memberId || typeof memberId !== 'string') {
    return json(400, { error: 'Member ID is required' })
  }

  try {
    const supabase = getSupabase()

    if (event.httpMethod === 'DELETE') {
      const { data, error } = await supabase
        .schema('gurukul_main')
        .from('members')
        .delete()
        .eq('id', memberId)
        .select()

      if (error) {
        return json(500, { error: error.message })
      }

      return json(200, {
        success: true,
        message: 'Member deleted successfully',
        deletedMember: data?.[0] || null,
      })
    }

    if (event.httpMethod === 'PUT') {
      const body = event.body ? JSON.parse(event.body) : {}
      const { first_name, last_name, email, phone, status, membership_type, expiry_date } = body

      const updateData = {}
      if (first_name !== undefined) updateData.first_name = first_name
      if (last_name !== undefined) updateData.last_name = last_name
      if (email !== undefined) updateData.email = email
      if (phone !== undefined) updateData.phone = phone
      if (status !== undefined) updateData.status = status
      if (membership_type !== undefined) updateData.membership_type = membership_type
      if (expiry_date !== undefined) updateData.expiry_date = expiry_date

      const { data, error } = await supabase
        .schema('gurukul_main')
        .from('members')
        .update(updateData)
        .eq('id', memberId)
        .select()

      if (error) {
        return json(500, { error: error.message })
      }

      return json(200, {
        success: true,
        message: 'Member updated successfully',
        updatedMember: data?.[0] || null,
      })
    }

    return json(405, { error: 'Method not allowed' })
  } catch (error) {
    return json(500, {
      error: 'Failed to process member request',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
