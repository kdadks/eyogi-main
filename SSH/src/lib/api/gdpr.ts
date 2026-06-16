/**
 * GDPR Right to Delete API
 *
 * Handles data deletion requests in compliance with GDPR Article 17
 * Implements cautious deletion with:
 * - Multi-step verification
 * - Admin approval workflow
 * - Comprehensive audit logging
 * - Soft deletion where appropriate
 * - Impact assessment before deletion
 */

import { supabaseAdmin, supabase } from '../supabase'
import { queryCache } from '../cache'
import { decryptProfileFields } from '../encryption'
import type {
  DeletionRequest,
  DeletionRequestStatus,
  DeletionRequestType,
  DeletionAuditLog,
  DeletionImpact,
  DeletionRequestWithImpact,
  DeletionStats,
} from '../../types/gdpr'

/**
 * Create a deletion request
 * Parents can request deletion for their children, students can request for themselves
 */
export async function createDeletionRequest(params: {
  user_id: string // User making the request
  target_user_id: string // User whose data will be deleted
  request_type: DeletionRequestType
  reason?: string
  ip_address?: string
  user_agent?: string
}): Promise<DeletionRequest | null> {
  try {
    // Verify the requester has permission to request deletion
    const canRequest = await verifyDeletionPermission(params.user_id, params.target_user_id)
    if (!canRequest) {
      console.error('User does not have permission to request deletion for target user')
      return null
    }

    // Check for existing pending or approved requests
    const { data: existingRequests } = await supabaseAdmin
      .from('deletion_requests')
      .select('*')
      .eq('target_user_id', params.target_user_id)
      .in('status', ['pending', 'approved', 'processing'])

    if (existingRequests && existingRequests.length > 0) {
      console.error('There is already a pending or approved deletion request for this user')
      return null
    }

    // Create the deletion request
    const { data, error } = await supabaseAdmin
      .from('deletion_requests')
      .insert({
        user_id: params.user_id,
        target_user_id: params.target_user_id,
        request_type: params.request_type,
        status: 'pending',
        reason: params.reason,
        ip_address: params.ip_address,
        user_agent: params.user_agent,
        requested_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        requester:profiles!deletion_requests_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        target_user:profiles!deletion_requests_target_user_id_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error creating deletion request:', error)
      return null
    }

    // Invalidate relevant caches
    queryCache.invalidatePattern('deletion:.*')

    // Decrypt profile fields
    const decryptedData = {
      ...data,
      requester: data.requester ? decryptProfileFields(data.requester) : null,
      target_user: data.target_user ? decryptProfileFields(data.target_user) : null,
    }

    return decryptedData as unknown as DeletionRequest
  } catch (error) {
    console.error('Error in createDeletionRequest:', error)
    return null
  }
}

/**
 * Verify if a user has permission to request deletion for a target user
 */
async function verifyDeletionPermission(user_id: string, target_user_id: string): Promise<boolean> {
  try {
    // User can always delete their own data
    if (user_id === target_user_id) {
      return true
    }

    // Check if user is a parent of the target user
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('parent_id')
      .eq('id', target_user_id)
      .single()

    if (targetProfile && targetProfile.parent_id === user_id) {
      return true
    }

    return false
  } catch (error) {
    console.error('Error verifying deletion permission:', error)
    return false
  }
}

/**
 * Get deletion impact analysis - shows what data will be deleted
 */
export async function getDeletionImpact(target_user_id: string): Promise<DeletionImpact> {
  try {
    // Check if user is a parent and count children
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', target_user_id)
      .single()

    const [
      enrollmentsCount,
      certificatesCount,
      attendanceCount,
      batchStudentsCount,
      complianceCount,
      consentCount,
      childrenCount,
    ] = await Promise.all([
      supabaseAdmin
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', target_user_id)
        .then((res) => res.count || 0),

      supabaseAdmin
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', target_user_id)
        .then((res) => res.count || 0),

      supabaseAdmin
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', target_user_id)
        .then((res) => res.count || 0),

      supabaseAdmin
        .from('batch_students')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', target_user_id)
        .then((res) => res.count || 0),

      supabaseAdmin
        .from('compliance_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', target_user_id)
        .then((res) => res.count || 0),

      supabaseAdmin
        .from('student_consent')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', target_user_id)
        .then((res) => res.count || 0),

      // Count children if user is a parent
      targetProfile?.role === 'parent'
        ? supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', target_user_id)
            .eq('role', 'student')
            .then((res) => res.count || 0)
        : Promise.resolve(0),
    ])

    return {
      profiles: 1, // The user's profile
      enrollments: enrollmentsCount,
      certificates: certificatesCount,
      attendance_records: attendanceCount,
      batch_students: batchStudentsCount,
      compliance_submissions: complianceCount,
      consent_records: consentCount,
      children_accounts: childrenCount,
      total_records:
        1 +
        enrollmentsCount +
        certificatesCount +
        attendanceCount +
        batchStudentsCount +
        complianceCount +
        consentCount +
        childrenCount, // Include children in total
    }
  } catch (error) {
    console.error('Error calculating deletion impact:', error)
    return {
      profiles: 0,
      enrollments: 0,
      certificates: 0,
      attendance_records: 0,
      batch_students: 0,
      compliance_submissions: 0,
      consent_records: 0,
      children_accounts: 0,
      total_records: 0,
    }
  }
}

/**
 * Get deletion request by ID
 */
export async function getDeletionRequest(requestId: string): Promise<DeletionRequest | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('deletion_requests')
      .select(
        `
        *,
        requester:profiles!deletion_requests_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        target_user:profiles!deletion_requests_target_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        reviewer:profiles!deletion_requests_reviewed_by_fkey (
          id,
          full_name,
          email
        )
      `,
      )
      .eq('id', requestId)
      .single()

    if (error) {
      console.error('Error fetching deletion request:', error)
      return null
    }

    // Decrypt profile fields
    const decryptedData = {
      ...data,
      requester: data.requester ? decryptProfileFields(data.requester) : null,
      target_user: data.target_user ? decryptProfileFields(data.target_user) : null,
      reviewer: data.reviewer ? decryptProfileFields(data.reviewer) : null,
    }

    return decryptedData as unknown as DeletionRequest
  } catch (error) {
    console.error('Error in getDeletionRequest:', error)
    return null
  }
}

/**
 * Get deletion request with impact analysis
 */
export async function getDeletionRequestWithImpact(
  requestId: string,
): Promise<DeletionRequestWithImpact | null> {
  try {
    const request = await getDeletionRequest(requestId)
    if (!request) return null

    // If target_user_id is null (user was already deleted), return zero impact
    const impact = request.target_user_id
      ? await getDeletionImpact(request.target_user_id)
      : {
          profiles: 0,
          enrollments: 0,
          certificates: 0,
          attendance_records: 0,
          batch_students: 0,
          compliance_submissions: 0,
          consent_records: 0,
          children_accounts: 0,
          total_records: 0,
        }

    return {
      ...request,
      impact,
    }
  } catch (error) {
    console.error('Error in getDeletionRequestWithImpact:', error)
    return null
  }
}

/**
 * Get all deletion requests (for admins)
 */
export async function getAllDeletionRequests(params?: {
  status?: DeletionRequestStatus
  limit?: number
  offset?: number
}): Promise<{ data: DeletionRequest[]; count: number }> {
  try {
    let query = supabaseAdmin.from('deletion_requests').select(
      `
        *,
        requester:profiles!deletion_requests_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        target_user:profiles!deletion_requests_target_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        reviewer:profiles!deletion_requests_reviewed_by_fkey (
          id,
          full_name,
          email
        )
      `,
      { count: 'exact' },
    )

    if (params?.status) {
      query = query.eq('status', params.status)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching deletion requests:', error)
      return { data: [], count: 0 }
    }

    // Decrypt profile fields for all requests
    const decryptedData = (data || []).map((request: any) => ({
      ...request,
      requester: request.requester ? decryptProfileFields(request.requester) : null,
      target_user: request.target_user ? decryptProfileFields(request.target_user) : null,
      reviewer: request.reviewer ? decryptProfileFields(request.reviewer) : null,
    }))

    return { data: (decryptedData as unknown as DeletionRequest[]) || [], count: count || 0 }
  } catch (error) {
    console.error('Error in getAllDeletionRequests:', error)
    return { data: [], count: 0 }
  }
}

/**
 * Get deletion requests for a specific user
 */
export async function getUserDeletionRequests(userId: string): Promise<DeletionRequest[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('deletion_requests')
      .select(
        `
        *,
        requester:profiles!deletion_requests_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        target_user:profiles!deletion_requests_target_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        reviewer:profiles!deletion_requests_reviewed_by_fkey (
          id,
          full_name,
          email
        )
      `,
      )
      .or(`user_id.eq.${userId},target_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user deletion requests:', error)
      return []
    }

    // Decrypt profile fields for all requests
    const decryptedData = (data || []).map((request: any) => ({
      ...request,
      requester: request.requester ? decryptProfileFields(request.requester) : null,
      target_user: request.target_user ? decryptProfileFields(request.target_user) : null,
      reviewer: request.reviewer ? decryptProfileFields(request.reviewer) : null,
    }))

    return (decryptedData as unknown as DeletionRequest[]) || []
  } catch (error) {
    console.error('Error in getUserDeletionRequests:', error)
    return []
  }
}

/**
 * Approve or reject a deletion request (Admin only)
 */
export async function reviewDeletionRequest(
  requestId: string,
  reviewerId: string,
  action: 'approve' | 'reject',
  rejectionReason?: string,
): Promise<DeletionRequest | null> {
  try {
    const updateData: {
      status: DeletionRequestStatus
      reviewed_by: string
      reviewed_at: string
      rejection_reason?: string
    } = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    }

    if (action === 'reject' && rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }

    const { data, error } = await supabaseAdmin
      .from('deletion_requests')
      .update(updateData)
      .eq('id', requestId)
      .select(
        `
        *,
        requester:profiles!deletion_requests_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        target_user:profiles!deletion_requests_target_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        reviewer:profiles!deletion_requests_reviewed_by_fkey (
          id,
          full_name,
          email
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error reviewing deletion request:', error)
      return null
    }

    // If approved, initiate deletion process
    if (action === 'approve') {
      // This will be handled separately by an admin triggering the actual deletion
      console.log('Deletion request approved. Admin must execute deletion separately.')
    }

    // Invalidate caches
    queryCache.invalidatePattern('deletion:.*')

    // Decrypt profile fields
    const decryptedData = {
      ...data,
      requester: data.requester ? decryptProfileFields(data.requester) : null,
      target_user: data.target_user ? decryptProfileFields(data.target_user) : null,
      reviewer: data.reviewer ? decryptProfileFields(data.reviewer) : null,
    }

    return decryptedData as unknown as DeletionRequest
  } catch (error) {
    console.error('Error in reviewDeletionRequest:', error)
    return null
  }
}

/**
 * Log a deletion action for audit trail
 */
async function logDeletionAction(
  requestId: string,
  performedBy: string,
  action: string,
  tableName: string,
  recordsAffected: number,
  success: boolean,
  errorMessage?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabaseAdmin.from('deletion_audit_logs').insert({
      deletion_request_id: requestId,
      action,
      table_name: tableName,
      records_affected: recordsAffected,
      success,
      error_message: errorMessage,
      performed_by: performedBy,
      performed_at: new Date().toISOString(),
      metadata,
    })
  } catch (error) {
    console.error('Error logging deletion action:', error)
  }
}

/**
 * Execute the deletion (Admin only, after approval)
 * This is the actual deletion process with full audit logging
 */
export async function executeDeletion(
  requestId: string,
  executorId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the deletion request
    const request = await getDeletionRequest(requestId)
    if (!request) {
      return { success: false, error: 'Deletion request not found' }
    }

    // Verify request is approved
    if (request.status !== 'approved') {
      return { success: false, error: 'Deletion request must be approved before execution' }
    }

    // Update status to processing
    await supabaseAdmin
      .from('deletion_requests')
      .update({ status: 'processing' })
      .eq('id', requestId)

    const targetUserId = request.target_user_id
    let hasError = false
    let errorMessage = ''

    // Delete in order of dependencies (children first, then parents)

    // 0. If deleting a parent account, first delete all their children
    if (request.request_type === 'full_account') {
      try {
        // Get all children of this parent
        const { data: children } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .eq('parent_id', targetUserId)
          .eq('role', 'student')

        if (children && children.length > 0) {
          // Delete each child's data recursively
          for (const child of children) {
            // Delete all child's related data in the same order as main deletion
            // This ensures complete cascade deletion

            // Delete compliance files for child
            const { data: childSubmissions } = await supabaseAdmin
              .from('compliance_submissions')
              .select('id')
              .eq('user_id', child.id)

            if (childSubmissions && childSubmissions.length > 0) {
              await supabaseAdmin
                .from('compliance_files')
                .delete()
                .in(
                  'submission_id',
                  childSubmissions.map((s) => s.id),
                )
            }

            // Delete all other child data
            await supabaseAdmin.from('compliance_submissions').delete().eq('user_id', child.id)
            await supabaseAdmin.from('attendance_records').delete().eq('student_id', child.id)
            await supabaseAdmin.from('batch_students').delete().eq('student_id', child.id)
            await supabaseAdmin.from('certificates').delete().eq('student_id', child.id)
            await supabaseAdmin.from('enrollments').delete().eq('student_id', child.id)
            await supabaseAdmin.from('student_consent').delete().eq('student_id', child.id)

            // Delete child profile
            await supabaseAdmin.from('profiles').delete().eq('id', child.id)

            // Broadcast deletion for each child
            const channel = new BroadcastChannel('gdpr-deletion-channel')
            channel.postMessage({
              type: 'user-deleted',
              userId: child.id,
              timestamp: Date.now(),
            })
            channel.close()
          }

          await logDeletionAction(
            requestId,
            executorId,
            'delete',
            'child_accounts',
            children.length,
            true,
            undefined,
            {
              note: 'Cascading deletion of parent account triggered deletion of all children',
              children: children.map((c) => ({ id: c.id, name: c.full_name })),
            },
          )
        }
      } catch (error) {
        console.error('Error deleting children accounts:', error)
        hasError = true
        errorMessage += 'Failed to delete children accounts. '
      }
    }

    // 1. Delete compliance files
    try {
      // First get submission IDs
      const { data: submissions } = await supabaseAdmin
        .from('compliance_submissions')
        .select('id')
        .eq('user_id', targetUserId)

      const submissionIds = submissions?.map((s) => s.id) || []

      // Then delete compliance files
      const { count, error } = await supabaseAdmin
        .from('compliance_files')
        .delete({ count: 'exact' })
        .in('submission_id', submissionIds)

      await logDeletionAction(
        requestId,
        executorId,
        'delete',
        'compliance_files',
        count || 0,
        !error,
        error?.message,
      )
    } catch (error) {
      console.error('Error deleting compliance files:', error)
      hasError = true
      errorMessage += 'Failed to delete compliance files. '
    }

    // 2. Delete compliance submissions
    try {
      const { count, error } = await supabaseAdmin
        .from('compliance_submissions')
        .delete({ count: 'exact' })
        .eq('user_id', targetUserId)

      await logDeletionAction(
        requestId,
        executorId,
        'delete',
        'compliance_submissions',
        count || 0,
        !error,
        error?.message,
      )
    } catch (error) {
      console.error('Error deleting compliance submissions:', error)
      hasError = true
      errorMessage += 'Failed to delete compliance submissions. '
    }

    // 3. Delete attendance records
    try {
      const { count, error } = await supabaseAdmin
        .from('attendance_records')
        .delete({ count: 'exact' })
        .eq('student_id', targetUserId)

      await logDeletionAction(
        requestId,
        executorId,
        'delete',
        'attendance_records',
        count || 0,
        !error,
        error?.message,
      )
    } catch (error) {
      console.error('Error deleting attendance records:', error)
      hasError = true
      errorMessage += 'Failed to delete attendance records. '
    }

    // 4. Delete batch students
    try {
      const { count, error } = await supabaseAdmin
        .from('batch_students')
        .delete({ count: 'exact' })
        .eq('student_id', targetUserId)

      await logDeletionAction(
        requestId,
        executorId,
        'delete',
        'batch_students',
        count || 0,
        !error,
        error?.message,
      )
    } catch (error) {
      console.error('Error deleting batch students:', error)
      hasError = true
      errorMessage += 'Failed to delete batch students. '
    }

    // 5. Anonymize certificates (keep for legal/audit reasons but remove PII)
    try {
      const { error } = await supabaseAdmin
        .from('certificates')
        .update({
          certificate_data: { anonymized: true, reason: 'GDPR deletion request' },
        })
        .eq('student_id', targetUserId)

      // Get count separately
      const { count } = await supabaseAdmin
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', targetUserId)

      await logDeletionAction(
        requestId,
        executorId,
        'anonymize',
        'certificates',
        count || 0,
        !error,
        error?.message,
        { note: 'Certificates anonymized for legal compliance' },
      )
    } catch (error) {
      console.error('Error anonymizing certificates:', error)
      hasError = true
      errorMessage += 'Failed to anonymize certificates. '
    }

    // 6. Delete enrollments
    try {
      const { count, error } = await supabaseAdmin
        .from('enrollments')
        .delete({ count: 'exact' })
        .eq('student_id', targetUserId)

      await logDeletionAction(
        requestId,
        executorId,
        'delete',
        'enrollments',
        count || 0,
        !error,
        error?.message,
      )
    } catch (error) {
      console.error('Error deleting enrollments:', error)
      hasError = true
      errorMessage += 'Failed to delete enrollments. '
    }

    // 7. Delete consent records
    try {
      const { count, error } = await supabaseAdmin
        .from('student_consent')
        .delete({ count: 'exact' })
        .eq('student_id', targetUserId)

      await logDeletionAction(
        requestId,
        executorId,
        'delete',
        'student_consent',
        count || 0,
        !error,
        error?.message,
      )
    } catch (error) {
      console.error('Error deleting consent records:', error)
      hasError = true
      errorMessage += 'Failed to delete consent records. '
    }

    // 8. Delete or anonymize profile (final step)
    try {
      // For full account deletion, delete the profile
      // For partial deletion, anonymize the profile
      if (request.request_type === 'full_account') {
        const { count, error } = await supabaseAdmin
          .from('profiles')
          .delete({ count: 'exact' })
          .eq('id', targetUserId)

        await logDeletionAction(
          requestId,
          executorId,
          'delete',
          'profiles',
          count || 0,
          !error,
          error?.message,
        )

        // Force logout the deleted user by clearing their session
        // Since we're using custom auth with localStorage, clear their session
        try {
          // Check if there's a session for this user and clear it from current browser
          const sessionKey = 'eyogi-ssh-local-session'
          const sessionStr = localStorage.getItem(sessionKey)
          if (sessionStr) {
            const session = JSON.parse(sessionStr)
            if (session.user?.id === targetUserId) {
              localStorage.removeItem(sessionKey)
              localStorage.removeItem('website-user-id')
            }
          }

          // Broadcast to other tabs/windows that this user has been deleted
          // This will trigger automatic logout across all sessions
          const channel = new BroadcastChannel('gdpr-deletion-channel')
          channel.postMessage({
            type: 'user-deleted',
            userId: targetUserId,
            timestamp: Date.now(),
          })
          channel.close()
        } catch (sessionError) {
          console.warn('Could not clear user session:', sessionError)
          // Don't fail the deletion if session clearing fails
        }
      } else {
        // Anonymize profile
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name: 'Deleted User',
            email: `deleted_${targetUserId}@anonymized.local`,
            phone: null,
            address_line_1: null,
            address_line_2: null,
            city: null,
            state: null,
            zip_code: null,
            country: null,
            parent_guardian_name: null,
            parent_guardian_email: null,
            parent_guardian_phone: null,
          })
          .eq('id', targetUserId)

        await logDeletionAction(
          requestId,
          executorId,
          'anonymize',
          'profiles',
          1,
          !error,
          error?.message,
        )
      }
    } catch (error) {
      console.error('Error deleting/anonymizing profile:', error)
      hasError = true
      errorMessage += 'Failed to delete/anonymize profile. '
    }

    // Update deletion request status
    const finalStatus: DeletionRequestStatus = hasError ? 'failed' : 'completed'
    await supabaseAdmin
      .from('deletion_requests')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    // Invalidate all caches
    queryCache.invalidatePattern('.*')

    if (hasError) {
      return { success: false, error: errorMessage }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in executeDeletion:', error)

    // Update status to failed
    await supabaseAdmin.from('deletion_requests').update({ status: 'failed' }).eq('id', requestId)

    return { success: false, error: errorMessage }
  }
}

/**
 * Get deletion audit logs for a request
 */
export async function getDeletionAuditLogs(requestId: string): Promise<DeletionAuditLog[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('deletion_audit_logs')
      .select('*')
      .eq('deletion_request_id', requestId)
      .order('performed_at', { ascending: true })

    if (error) {
      console.error('Error fetching deletion audit logs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getDeletionAuditLogs:', error)
    return []
  }
}

/**
 * Get deletion statistics
 */
export async function getDeletionStats(): Promise<DeletionStats> {
  try {
    const [total, pending, approved, rejected, completed] = await Promise.all([
      supabaseAdmin
        .from('deletion_requests')
        .select('*', { count: 'exact', head: true })
        .then((res) => res.count || 0),

      supabaseAdmin
        .from('deletion_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .then((res) => res.count || 0),

      supabaseAdmin
        .from('deletion_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .then((res) => res.count || 0),

      supabaseAdmin
        .from('deletion_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .then((res) => res.count || 0),

      supabaseAdmin
        .from('deletion_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .then((res) => res.count || 0),
    ])

    return {
      total_requests: total,
      pending_requests: pending,
      approved_requests: approved,
      rejected_requests: rejected,
      completed_requests: completed,
    }
  } catch (error) {
    console.error('Error getting deletion stats:', error)
    return {
      total_requests: 0,
      pending_requests: 0,
      approved_requests: 0,
      rejected_requests: 0,
      completed_requests: 0,
    }
  }
}

/**
 * Cancel a pending deletion request
 */
export async function cancelDeletionRequest(requestId: string, userId: string): Promise<boolean> {
  try {
    const request = await getDeletionRequest(requestId)
    if (!request) return false

    // Only allow cancellation by the requester and only if pending
    if (request.user_id !== userId || request.status !== 'pending') {
      return false
    }

    const { error } = await supabaseAdmin
      .from('deletion_requests')
      .update({ status: 'rejected', rejection_reason: 'Cancelled by requester' })
      .eq('id', requestId)

    if (error) {
      console.error('Error cancelling deletion request:', error)
      return false
    }

    // Invalidate caches
    queryCache.invalidatePattern('deletion:.*')

    return true
  } catch (error) {
    console.error('Error in cancelDeletionRequest:', error)
    return false
  }
}
