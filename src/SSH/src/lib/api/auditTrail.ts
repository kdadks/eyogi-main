import { supabaseAdmin } from '../supabase'
import { decryptField } from '../encryption'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface AuditTrailEntry {
  id: string
  table_name: string
  record_id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  changed_by_id: string
  changed_by_email: string
  changed_by_name: string
  changed_by_role: string
  changed_at: string
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

export interface AuditTrailEntryDecrypted extends Omit<AuditTrailEntry, 'old_value' | 'new_value'> {
  old_value_decrypted: string | null
  new_value_decrypted: string | null
  old_value_encrypted: string | null
  new_value_encrypted: string | null
  affected_user_name?: string | null
  affected_user_email?: string | null
}

export interface AuditTrailFilters {
  table_name?: string
  record_id?: string
  field_name?: string
  action?: 'CREATE' | 'UPDATE' | 'DELETE'
  changed_by_id?: string
  changed_by_email?: string
  changed_by_role?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

export interface AuditTrailCreateParams {
  table_name: string
  record_id: string
  field_name: string
  old_value?: string | null
  new_value?: string | null
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  changed_by_id: string
  changed_by_email: string
  changed_by_name: string
  changed_by_role: string
  ip_address?: string | null
  user_agent?: string | null
}

export interface ChangedByInfo {
  id: string
  email: string
  name: string
  role: string
}

// List of encrypted fields that should be tracked
export const ENCRYPTED_FIELDS = [
  'full_name',
  'phone',
  'date_of_birth',
  'age',
  'emergency_contact',
  'address_line_1',
  'address_line_2',
  'city',
  'zip_code',
]

// ============================================
// AUDIT TRAIL FUNCTIONS
// ============================================

/**
 * Create a single audit trail entry
 */
export async function createAuditTrailEntry(
  params: AuditTrailCreateParams,
): Promise<AuditTrailEntry | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_trail')
      .insert({
        table_name: params.table_name,
        record_id: params.record_id,
        field_name: params.field_name,
        old_value: params.old_value || null,
        new_value: params.new_value || null,
        action: params.action,
        changed_by_id: params.changed_by_id,
        changed_by_email: params.changed_by_email,
        changed_by_name: params.changed_by_name,
        changed_by_role: params.changed_by_role,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
        changed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating audit trail entry:', error)
      return null
    }

    return data as AuditTrailEntry
  } catch (error) {
    console.error('Error creating audit trail entry:', error)
    return null
  }
}

/**
 * Create multiple audit trail entries for a batch of field changes
 */
export async function createAuditTrailEntries(
  entries: AuditTrailCreateParams[],
): Promise<AuditTrailEntry[]> {
  if (entries.length === 0) return []

  try {
    const insertData = entries.map((params) => ({
      table_name: params.table_name,
      record_id: params.record_id,
      field_name: params.field_name,
      old_value: params.old_value || null,
      new_value: params.new_value || null,
      action: params.action,
      changed_by_id: params.changed_by_id,
      changed_by_email: params.changed_by_email,
      changed_by_name: params.changed_by_name,
      changed_by_role: params.changed_by_role,
      ip_address: params.ip_address || null,
      user_agent: params.user_agent || null,
      changed_at: new Date().toISOString(),
    }))

    const { data, error } = await supabaseAdmin.from('audit_trail').insert(insertData).select()

    if (error) {
      console.error('Error creating audit trail entries:', error)
      return []
    }

    return (data || []) as AuditTrailEntry[]
  } catch (error) {
    console.error('Error creating audit trail entries:', error)
    return []
  }
}

/**
 * Log changes to encrypted fields by comparing old and new values
 * Expects PLAINTEXT/DECRYPTED values for proper comparison
 */
export async function logEncryptedFieldChanges(
  tableName: string,
  recordId: string,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown>,
  changedBy: ChangedByInfo,
  action: 'CREATE' | 'UPDATE' | 'DELETE' = 'UPDATE',
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  const auditEntries: AuditTrailCreateParams[] = []

  // Helper to normalize values for comparison - treats empty/null values consistently
  const normalizeForComparison = (val: unknown): string | null => {
    if (val === null || val === undefined) return null

    if (typeof val === 'string') {
      const trimmed = val.trim()
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null
      return trimmed
    }

    if (typeof val === 'number') {
      return String(val)
    }

    if (typeof val === 'object') {
      // Handle emergency_contact and other objects
      const jsonStr = JSON.stringify(val)
      if (
        jsonStr === '{}' ||
        jsonStr === 'null' ||
        jsonStr === '{"name":null,"phone":null,"email":null,"relationship":null}'
      )
        return null
      return jsonStr
    }

    return String(val)
  }

  for (const fieldName of ENCRYPTED_FIELDS) {
    const oldValue = oldData?.[fieldName]
    const newValue = newData[fieldName]

    // Normalize values for comparison
    const oldNormalized = normalizeForComparison(oldValue)
    const newNormalized = normalizeForComparison(newValue)

    // For CREATE action, log all fields with non-null values
    if (action === 'CREATE') {
      if (newNormalized !== null) {
        auditEntries.push({
          table_name: tableName,
          record_id: recordId,
          field_name: fieldName,
          old_value: null,
          new_value: newNormalized,
          action: 'CREATE',
          changed_by_id: changedBy.id,
          changed_by_email: changedBy.email,
          changed_by_name: changedBy.name,
          changed_by_role: changedBy.role,
          ip_address: ipAddress,
          user_agent: userAgent,
        })
      }
    }
    // For UPDATE action, log only fields that actually changed
    else if (action === 'UPDATE') {
      if (oldNormalized !== newNormalized) {
        auditEntries.push({
          table_name: tableName,
          record_id: recordId,
          field_name: fieldName,
          old_value: oldNormalized,
          new_value: newNormalized,
          action: 'UPDATE',
          changed_by_id: changedBy.id,
          changed_by_email: changedBy.email,
          changed_by_name: changedBy.name,
          changed_by_role: changedBy.role,
          ip_address: ipAddress,
          user_agent: userAgent,
        })
      }
    }
    // For DELETE action, log all fields that had values
    else if (action === 'DELETE') {
      if (oldValue !== null && oldValue !== undefined && oldValue !== '') {
        auditEntries.push({
          table_name: tableName,
          record_id: recordId,
          field_name: fieldName,
          old_value: typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue),
          new_value: null,
          action: 'DELETE',
          changed_by_id: changedBy.id,
          changed_by_email: changedBy.email,
          changed_by_name: changedBy.name,
          changed_by_role: changedBy.role,
          ip_address: ipAddress,
          user_agent: userAgent,
        })
      }
    }
  }

  if (auditEntries.length > 0) {
    await createAuditTrailEntries(auditEntries)
  }
}

/**
 * Get audit trail entries with filtering and pagination
 */
export async function getAuditTrailEntries(
  filters: AuditTrailFilters = {},
): Promise<{ entries: AuditTrailEntryDecrypted[]; total: number }> {
  try {
    const { page = 1, limit = 50 } = filters
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('audit_trail')
      .select('*', { count: 'exact' })
      .order('changed_at', { ascending: false })

    // Apply filters
    if (filters.table_name) {
      query = query.eq('table_name', filters.table_name)
    }
    if (filters.record_id) {
      query = query.eq('record_id', filters.record_id)
    }
    if (filters.field_name) {
      query = query.eq('field_name', filters.field_name)
    }
    if (filters.action) {
      query = query.eq('action', filters.action)
    }
    if (filters.changed_by_id) {
      query = query.eq('changed_by_id', filters.changed_by_id)
    }
    if (filters.changed_by_email) {
      query = query.ilike('changed_by_email', `%${filters.changed_by_email}%`)
    }
    if (filters.changed_by_role) {
      query = query.eq('changed_by_role', filters.changed_by_role)
    }
    if (filters.start_date) {
      query = query.gte('changed_at', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('changed_at', filters.end_date)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching audit trail entries:', error)
      return { entries: [], total: 0 }
    }

    // Get unique record IDs to fetch affected user names
    const recordIds = [...new Set((data || []).map((entry) => entry.record_id))]

    // Fetch affected user names from profiles table
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', recordIds)

    // Create a map of record_id to user info
    const userInfoMap = new Map<string, { name: string | null; email: string | null }>()
    if (profiles) {
      profiles.forEach((profile) => {
        const decryptedName = profile.full_name ? decryptField(profile.full_name) : null
        userInfoMap.set(profile.id, {
          name: decryptedName,
          email: profile.email || null,
        })
      })
    }

    // Decrypt values for display
    const decryptedEntries: AuditTrailEntryDecrypted[] = (data || []).map((entry) => {
      const userInfo = userInfoMap.get(entry.record_id)
      return {
        ...entry,
        old_value_encrypted: entry.old_value,
        new_value_encrypted: entry.new_value,
        old_value_decrypted: entry.old_value ? decryptField(entry.old_value) : null,
        new_value_decrypted: entry.new_value ? decryptField(entry.new_value) : null,
        affected_user_name: userInfo?.name || null,
        affected_user_email: userInfo?.email || null,
      }
    })

    return { entries: decryptedEntries, total: count || 0 }
  } catch (error) {
    console.error('Error fetching audit trail entries:', error)
    return { entries: [], total: 0 }
  }
}

/**
 * Get audit trail for a specific record
 */
export async function getRecordAuditTrail(
  tableName: string,
  recordId: string,
): Promise<AuditTrailEntryDecrypted[]> {
  const { entries } = await getAuditTrailEntries({
    table_name: tableName,
    record_id: recordId,
    limit: 1000, // Get all history for this record
  })
  return entries
}

/**
 * Get audit trail summary/statistics
 */
export async function getAuditTrailStats(
  startDate?: string,
  endDate?: string,
): Promise<{
  totalChanges: number
  changesByAction: Record<string, number>
  changesByTable: Record<string, number>
  changesByField: Record<string, number>
  changesByRole: Record<string, number>
  recentChangers: Array<{ email: string; name: string; role: string; count: number }>
}> {
  try {
    let query = supabaseAdmin.from('audit_trail').select('*')

    if (startDate) {
      query = query.gte('changed_at', startDate)
    }
    if (endDate) {
      query = query.lte('changed_at', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching audit trail stats:', error)
      return {
        totalChanges: 0,
        changesByAction: {},
        changesByTable: {},
        changesByField: {},
        changesByRole: {},
        recentChangers: [],
      }
    }

    const entries = data || []

    // Calculate statistics
    const changesByAction: Record<string, number> = {}
    const changesByTable: Record<string, number> = {}
    const changesByField: Record<string, number> = {}
    const changesByRole: Record<string, number> = {}
    const changerMap = new Map<
      string,
      { email: string; name: string; role: string; count: number }
    >()

    entries.forEach((entry) => {
      // By action
      changesByAction[entry.action] = (changesByAction[entry.action] || 0) + 1

      // By table
      changesByTable[entry.table_name] = (changesByTable[entry.table_name] || 0) + 1

      // By field
      changesByField[entry.field_name] = (changesByField[entry.field_name] || 0) + 1

      // By role
      changesByRole[entry.changed_by_role] = (changesByRole[entry.changed_by_role] || 0) + 1

      // By changer
      const existing = changerMap.get(entry.changed_by_id)
      if (existing) {
        existing.count++
      } else {
        changerMap.set(entry.changed_by_id, {
          email: entry.changed_by_email,
          name: entry.changed_by_name,
          role: entry.changed_by_role,
          count: 1,
        })
      }
    })

    const recentChangers = Array.from(changerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalChanges: entries.length,
      changesByAction,
      changesByTable,
      changesByField,
      changesByRole,
      recentChangers,
    }
  } catch (error) {
    console.error('Error fetching audit trail stats:', error)
    return {
      totalChanges: 0,
      changesByAction: {},
      changesByTable: {},
      changesByField: {},
      changesByRole: {},
      recentChangers: [],
    }
  }
}

/**
 * Export audit trail data (for compliance reports)
 */
export async function exportAuditTrail(
  filters: AuditTrailFilters = {},
): Promise<AuditTrailEntryDecrypted[]> {
  const { entries } = await getAuditTrailEntries({
    ...filters,
    limit: 10000, // Export up to 10k records
  })
  return entries
}
