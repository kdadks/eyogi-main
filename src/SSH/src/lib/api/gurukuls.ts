import { supabaseAdmin } from '../supabase'
import { Gurukul } from '../../types'

export async function getGurukuls(): Promise<Gurukul[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('gurukuls')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching gurukuls:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching gurukuls:', error)
    return []
  }
}

export async function getAllGurukuls(): Promise<Gurukul[]> {
  try {
    console.log('Fetching all gurukuls from database...')
    const { data, error } = await supabaseAdmin
      .from('gurukuls')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching all gurukuls:', error)
      return []
    }

    console.log('Raw gurukuls data from Supabase:', data)
    return data || []
  } catch (error) {
    console.error('Exception fetching all gurukuls:', error)
    return []
  }
}

export async function getGurukul(slug: string): Promise<Gurukul | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('gurukuls')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching gurukul:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching gurukul:', error)
    return null
  }
}

export async function createGurukul(
  gurukul: Omit<Gurukul, 'id' | 'created_at' | 'updated_at'>,
): Promise<Gurukul> {
  try {
    const { data, error } = await supabaseAdmin
      .from('gurukuls')
      .insert({
        ...gurukul,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating gurukul:', error)
      throw new Error('Failed to create gurukul')
    }

    return data
  } catch (error) {
    console.error('Error creating gurukul:', error)
    throw error
  }
}

export async function updateGurukul(id: string, updates: Partial<Gurukul>): Promise<Gurukul> {
  try {
    const { data, error } = await supabaseAdmin
      .from('gurukuls')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating gurukul:', error)
      throw new Error('Failed to update gurukul')
    }

    return data
  } catch (error) {
    console.error('Error updating gurukul:', error)
    throw error
  }
}

export async function deleteGurukul(id: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('gurukuls').update({ is_active: false }).eq('id', id)

    if (error) {
      console.error('Error deleting gurukul:', error)
      throw new Error('Failed to delete gurukul')
    }
  } catch (error) {
    console.error('Error deleting gurukul:', error)
    throw error
  }
}
