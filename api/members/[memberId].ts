import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export default async function handler(req: any, res: any) {
  const { memberId } = req.query

  if (!memberId || typeof memberId !== 'string') {
    return res.status(400).json({ error: 'Member ID is required' })
  }

  if (req.method === 'DELETE') {
    try {
      const { data, error } = await supabase
        .schema('gurukul_main')
        .from('members')
        .delete()
        .eq('id', memberId)
        .select()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({
        success: true,
        message: 'Member deleted successfully',
        deletedMember: data?.[0] || null,
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to delete member',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { first_name, last_name, email, phone, status, membership_type, expiry_date } = req.body || {}

      const updateData: Record<string, any> = {}
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
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({
        success: true,
        message: 'Member updated successfully',
        updatedMember: data?.[0] || null,
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to update member',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
