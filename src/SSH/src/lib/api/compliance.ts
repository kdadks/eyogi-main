// Compliance API Functions
import { supabaseAdmin } from '../supabase'
import { queryCache, CACHE_DURATIONS, createCacheKey } from '../cache'
import { decryptProfileFields } from '../encryption'
import type {
  ComplianceItem,
  ComplianceForm,
  ComplianceSubmission,
  ComplianceFile,
  ComplianceAdminStats,
  ComplianceSubmissionReview,
  ComplianceChecklistItem,
  ComplianceStats,
  ComplianceNotification,
  UserRole,
} from '../../types/compliance'

// ================================
// COMPLIANCE ITEMS MANAGEMENT
// ================================

export async function getComplianceItems(targetRole?: UserRole): Promise<ComplianceItem[]> {
  const cacheKey = createCacheKey('compliance', 'items', targetRole || 'all')

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        let query = supabaseAdmin
          .from('compliance_items')
          .select(
            'id, title, description, target_role, type, has_form, is_mandatory, due_date, is_active, created_by, created_at, updated_at',
          )
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (targetRole) {
          query = query.eq('target_role', targetRole)
        }

        const { data, error } = await query

        if (error) throw error
        return (data || []) as unknown as ComplianceItem[]
      } catch (error) {
        console.error('Error fetching compliance items:', error)
        throw error
      }
    },
    CACHE_DURATIONS.COMPLIANCE, // 1 day
  )
}

export async function createComplianceItem(
  item: Omit<ComplianceItem, 'id' | 'created_at' | 'updated_at'>,
): Promise<ComplianceItem> {
  try {
    const { data, error } = await supabaseAdmin
      .from('compliance_items')
      .insert({
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Invalidate compliance caches
    queryCache.invalidatePattern('compliance:.*')

    return data
  } catch (error) {
    console.error('Error creating compliance item:', error)
    throw error
  }
}

export async function updateComplianceItem(
  id: string,
  updates: Partial<ComplianceItem>,
): Promise<ComplianceItem> {
  try {
    const { data, error } = await supabaseAdmin
      .from('compliance_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Invalidate compliance caches
    queryCache.invalidatePattern('compliance:.*')

    return data
  } catch (error) {
    console.error('Error updating compliance item:', error)
    throw error
  }
}

export async function deleteComplianceItem(id: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('compliance_items').delete().eq('id', id)

    if (error) throw error

    // Invalidate compliance caches
    queryCache.invalidatePattern('compliance:.*')
  } catch (error) {
    console.error('Error deleting compliance item:', error)
    throw error
  }
}

// ================================
// COMPLIANCE FORMS MANAGEMENT
// ================================

export async function getComplianceForms(): Promise<ComplianceForm[]> {
  const cacheKey = createCacheKey('compliance', 'forms')

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('compliance_forms')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
      } catch (error) {
        console.error('Error fetching compliance forms:', error)
        throw error
      }
    },
    CACHE_DURATIONS.COMPLIANCE, // 1 day
  )
}

export async function getComplianceForm(id: string): Promise<ComplianceForm | null> {
  const cacheKey = createCacheKey('compliance', 'form', id)

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('compliance_forms')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error fetching compliance form:', error)
        throw error
      }
    },
    CACHE_DURATIONS.COMPLIANCE, // 1 day
  )
}

export async function createComplianceForm(
  form: Omit<ComplianceForm, 'id' | 'created_at' | 'updated_at' | 'version'>,
): Promise<ComplianceForm> {
  try {
    const { data, error } = await supabaseAdmin
      .from('compliance_forms')
      .insert({
        ...form,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Invalidate compliance caches
    queryCache.invalidatePattern('compliance:.*')

    return data
  } catch (error) {
    console.error('Error creating compliance form:', error)
    throw error
  }
}

export async function updateComplianceForm(
  id: string,
  updates: Partial<ComplianceForm>,
): Promise<ComplianceForm> {
  try {
    // Get current version
    const { data: currentForm } = await supabaseAdmin
      .from('compliance_forms')
      .select('version')
      .eq('id', id)
      .single()

    const { data, error } = await supabaseAdmin
      .from('compliance_forms')
      .update({
        ...updates,
        version: (currentForm?.version || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Invalidate compliance caches
    queryCache.invalidatePattern('compliance:.*')

    return data
  } catch (error) {
    console.error('Error updating compliance form:', error)
    throw error
  }
}

// ================================
// SUBMISSIONS MANAGEMENT
// ================================

export async function getComplianceSubmissions(filters: {
  complianceItemId?: string
  userId?: string
  status?: string
  reviewerId?: string
}): Promise<ComplianceSubmission[]> {
  const cacheKey = createCacheKey('compliance', 'submissions', JSON.stringify(filters))

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        let query = supabaseAdmin
          .from('compliance_submissions')
          .select(
            'id, compliance_item_id, user_id, status, submitted_at, reviewed_at, reviewed_by, notes',
          )
          .order('submitted_at', { ascending: false })

        if (filters.complianceItemId) {
          query = query.eq('compliance_item_id', filters.complianceItemId)
        }
        if (filters.userId) {
          query = query.eq('user_id', filters.userId)
        }
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.reviewerId) {
          query = query.eq('reviewed_by', filters.reviewerId)
        }

        const { data: submissions, error } = await query

        if (error) throw error

        if (!submissions || submissions.length === 0) {
          return []
        }

        // Fetch related data in parallel instead of sequentially
        const userIds = [...new Set(submissions.map((s) => s.user_id).filter(Boolean))]
        const itemIds = [...new Set(submissions.map((s) => s.compliance_item_id).filter(Boolean))]
        const submissionIds = submissions.map((s) => s.id)

        // Parallel queries
        const [usersResult, itemsResult, filesResult] = await Promise.all([
          userIds.length > 0
            ? supabaseAdmin.from('profiles').select('id, email, full_name, role').in('id', userIds)
            : Promise.resolve({ data: [] }),
          itemIds.length > 0
            ? supabaseAdmin.from('compliance_items').select('id, title, type').in('id', itemIds)
            : Promise.resolve({ data: [] }),
          submissionIds.length > 0
            ? supabaseAdmin
                .from('compliance_files')
                .select('id, submission_id, file_path, file_name')
                .in('submission_id', submissionIds)
            : Promise.resolve({ data: [] }),
        ])

        const users = usersResult.data || []
        const items = itemsResult.data || []
        const files = filesResult.data || []

        // Decrypt user profiles
        const decryptedUsers = users.map((user) => decryptProfileFields(user))

        // Combine data
        const enrichedSubmissions = submissions.map((submission) => ({
          ...submission,
          user: decryptedUsers.find((u) => u.id === submission.user_id) || null,
          compliance_item: items.find((i) => i.id === submission.compliance_item_id) || null,
          files: files.filter((f) => f.submission_id === submission.id) || [],
          reviewer: submission.reviewed_by
            ? decryptedUsers.find((u) => u.id === submission.reviewed_by) || null
            : null,
        }))

        return enrichedSubmissions as unknown as ComplianceSubmission[]
      } catch (error) {
        console.error('Error fetching compliance submissions:', error)
        throw error
      }
    },
    CACHE_DURATIONS.COMPLIANCE, // 1 day
  )
}

export async function submitComplianceForm(
  complianceItemId: string,
  userId: string,
  formData: Record<string, string | number | boolean | string[]>,
  files?: File[],
): Promise<ComplianceSubmission> {
  try {
    // First create the submission
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('compliance_submissions')
      .insert({
        compliance_item_id: complianceItemId,
        user_id: userId,
        form_data: formData,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (submissionError) throw submissionError

    // Handle file uploads if any
    if (files && files.length > 0) {
      const uploadedFiles = await uploadComplianceFiles(submission.id, files)
      submission.files = uploadedFiles
    }

    // Invalidate compliance caches
    queryCache.invalidatePattern('compliance:.*')

    return submission
  } catch (error) {
    console.error('Error submitting compliance form:', error)
    throw error
  }
}

export async function markComplianceAsComplete(
  complianceItemId: string,
  userId: string,
): Promise<ComplianceSubmission> {
  try {
    // Check if there's already a submission for this item
    const { data: existingSubmissions, error: checkError } = await supabaseAdmin
      .from('compliance_submissions')
      .select('*')
      .eq('compliance_item_id', complianceItemId)
      .eq('user_id', userId)

    // If query error (other than not found), throw it
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing submission:', checkError)
      throw checkError
    }

    // If submission exists and is rejected, update it to resubmit
    if (existingSubmissions && existingSubmissions.length > 0) {
      const existingSubmission = existingSubmissions[0]

      if (existingSubmission.status === 'rejected') {
        const { data: updatedSubmission, error: updateError } = await supabaseAdmin
          .from('compliance_submissions')
          .update({
            form_data: { checkbox_completed: true, resubmitted: true },
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            rejection_reason: null, // Clear rejection reason on resubmit
          })
          .eq('id', existingSubmission.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating rejected submission:', updateError)
          throw updateError
        }

        // Invalidate compliance caches
        queryCache.invalidatePattern('compliance:.*')

        return updatedSubmission
      } else {
        return existingSubmission
      }
    }

    // Create a new submission with minimal data
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('compliance_submissions')
      .insert({
        compliance_item_id: complianceItemId,
        user_id: userId,
        form_data: { checkbox_completed: true },
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Error creating submission:', submissionError)
      throw submissionError
    }

    // Create notification for admins about the completion
    await createComplianceNotification(
      userId,
      'form_submitted',
      `A compliance item has been marked as complete and requires review.`,
      complianceItemId,
      submission.id,
    )

    // Invalidate compliance caches
    queryCache.invalidatePattern('compliance:.*')

    return submission
  } catch (error) {
    console.error('Error marking compliance as complete:', error)
    throw error
  }
}

export async function reviewComplianceSubmission(
  submissionId: string,
  reviewerId: string | null,
  review: ComplianceSubmissionReview,
): Promise<ComplianceSubmission> {
  try {
    // Validate reviewerId if provided - it must exist in profiles table
    let validReviewerId: string | null = null
    if (reviewerId && reviewerId !== '00000000-0000-0000-0000-000000000000') {
      const { data: reviewer } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', reviewerId)
        .single()

      if (reviewer) {
        validReviewerId = reviewerId
      } else {
        console.warn('⚠️ Reviewer ID not found in profiles, setting to null')
      }
    }

    // First, update the submission
    const { data: updatedSubmission, error: updateError } = await supabaseAdmin
      .from('compliance_submissions')
      .update({
        status: review.action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: validReviewerId,
        rejection_reason: review.action === 'reject' ? review.rejection_reason : null,
      })
      .eq('id', submissionId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating submission:', updateError)
      throw updateError
    }

    // Then fetch related data separately to avoid join issues
    const [complianceItem, userProfile] = await Promise.all([
      supabaseAdmin
        .from('compliance_items')
        .select('*')
        .eq('id', updatedSubmission.compliance_item_id)
        .single()
        .then((res) => res.data),
      supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', updatedSubmission.user_id)
        .single()
        .then((res) => res.data),
    ])

    // Combine the data
    const data = {
      ...updatedSubmission,
      compliance_item: complianceItem,
      user: userProfile,
    }

    // Create notification for user
    try {
      await createComplianceNotification(
        data.user_id,
        review.action === 'approve' ? 'submission_approved' : 'submission_rejected',
        review.action === 'approve'
          ? `Your compliance submission for "${complianceItem?.title || 'item'}" has been approved.`
          : `Your compliance submission for "${complianceItem?.title || 'item'}" has been rejected.`,
        data.compliance_item_id,
        submissionId,
        review.rejection_reason,
      )
    } catch (notifError) {
      console.error('⚠️ Error creating notification (non-critical):', notifError)
      // Don't throw - notification failure shouldn't block the review
    }

    // Invalidate compliance caches
    queryCache.invalidatePattern('compliance:.*')

    return data
  } catch (error) {
    console.error('❌ Error reviewing compliance submission:', error)
    throw error
  }
}

// ================================
// USER COMPLIANCE STATUS
// ================================

export async function getUserComplianceStatus(
  userId: string,
  role: UserRole,
): Promise<ComplianceChecklistItem[]> {
  const cacheKey = createCacheKey('compliance', 'user-status', userId, role)

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        // Get all compliance items for user's role
        const complianceItems = await getComplianceItems(role)

        // Get user's submissions
        const submissions = await getComplianceSubmissions({ userId })

        // Create submission map for quick lookup
        const submissionMap = new Map()
        submissions.forEach((sub) => {
          submissionMap.set(sub.compliance_item_id, sub)
        })

        // Build checklist items
        const checklistItems: ComplianceChecklistItem[] = complianceItems.map((item) => {
          const submission = submissionMap.get(item.id)

          return {
            id: item.id,
            title: item.title,
            description: item.description,
            type: item.type,
            status: submission?.status || 'pending',
            is_mandatory: item.is_mandatory,
            due_date: item.due_date,
            has_form: item.has_form && item.form_id != null,
            submission_id: submission?.id,
            rejection_reason: submission?.rejection_reason,
            can_submit: !submission || submission.status === 'rejected',
          }
        })

        return checklistItems
      } catch (error) {
        console.error('Error getting user compliance status:', error)
        throw error
      }
    },
    CACHE_DURATIONS.COMPLIANCE, // 1 day
  )
}

export async function getComplianceStats(
  userId?: string,
  role?: UserRole,
): Promise<ComplianceStats> {
  const cacheKey = createCacheKey('compliance', 'stats', userId || 'all', role || 'all')

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        let items: ComplianceChecklistItem[] = []

        if (userId && role) {
          items = await getUserComplianceStatus(userId, role)
        }

        const totalItems = items.length
        const completedItems = items.filter((item) => item.status === 'approved').length
        // Pending includes: pending, submitted, and rejected (need action)
        const pendingItems = items.filter(
          (item) =>
            item.status === 'pending' || item.status === 'submitted' || item.status === 'rejected',
        ).length
        const overdueItems = items.filter(
          (item) =>
            item.due_date && new Date(item.due_date) < new Date() && item.status !== 'approved',
        ).length

        return {
          total_items: totalItems,
          completed_items: completedItems,
          pending_items: pendingItems,
          overdue_items: overdueItems,
          completion_percentage:
            totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        }
      } catch (error) {
        console.error('Error getting compliance stats:', error)
        throw error
      }
    },
    CACHE_DURATIONS.COMPLIANCE, // 1 day
  )
}

// ================================
// ADMIN STATS AND MANAGEMENT
// ================================

export async function getComplianceAdminStats(): Promise<ComplianceAdminStats> {
  const cacheKey = createCacheKey('compliance', 'admin-stats')

  return queryCache.get(
    cacheKey,
    async () => {
      try {
        // Use count queries instead of fetching all data
        const [itemsResult, submissionsResult, pendingResult, approvedResult, rejectedResult] =
          await Promise.all([
            supabaseAdmin
              .from('compliance_items')
              .select('*', { count: 'exact', head: true })
              .eq('is_active', true),
            supabaseAdmin
              .from('compliance_submissions')
              .select('*', { count: 'exact', head: true }),
            supabaseAdmin
              .from('compliance_submissions')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'submitted'),
            supabaseAdmin
              .from('compliance_submissions')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'approved'),
            supabaseAdmin
              .from('compliance_submissions')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'rejected'),
          ])

        const roleStats = {
          teacher: {
            total_items: 0,
            completed_items: 0,
            pending_items: 0,
            overdue_items: 0,
            completion_percentage: 0,
          },
          parent: {
            total_items: 0,
            completed_items: 0,
            pending_items: 0,
            overdue_items: 0,
            completion_percentage: 0,
          },
          student: {
            total_items: 0,
            completed_items: 0,
            pending_items: 0,
            overdue_items: 0,
            completion_percentage: 0,
          },
        }

        return {
          total_items: itemsResult.count || 0,
          total_submissions: submissionsResult.count || 0,
          pending_reviews: pendingResult.count || 0,
          approved_submissions: approvedResult.count || 0,
          rejected_submissions: rejectedResult.count || 0,
          by_role: roleStats,
        }
      } catch (error) {
        console.error('Error getting admin compliance stats:', error)
        throw error
      }
    },
    CACHE_DURATIONS.COMPLIANCE, // 1 day
  )
}

// ================================
// FILE UPLOAD HELPERS
// ================================

async function uploadComplianceFiles(
  submissionId: string,
  files: File[],
): Promise<ComplianceFile[]> {
  try {
    const uploadedFiles: ComplianceFile[] = []

    for (const file of files) {
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error(`File ${file.name} exceeds 2MB size limit`)
      }

      // Upload to Supabase storage
      const fileName = `${submissionId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('compliance-files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from('compliance-files').getPublicUrl(fileName)

      // Save file record
      const { data: fileRecord, error: fileError } = await supabaseAdmin
        .from('compliance_files')
        .insert({
          submission_id: submissionId,
          field_name: 'file', // This should match the form field name
          original_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (fileError) throw fileError
      uploadedFiles.push(fileRecord)
    }

    return uploadedFiles
  } catch (error) {
    console.error('Error uploading compliance files:', error)
    throw error
  }
}

// ================================
// NOTIFICATIONS
// ================================

async function createComplianceNotification(
  userId: string,
  type: string,
  message: string,
  complianceItemId?: string,
  submissionId?: string,
  rejectionReason?: string,
): Promise<void> {
  try {
    await supabaseAdmin.from('compliance_notifications').insert({
      user_id: userId,
      type,
      title: type.replace('_', ' ').toUpperCase(),
      message: rejectionReason ? `${message} Reason: ${rejectionReason}` : message,
      compliance_item_id: complianceItemId,
      submission_id: submissionId,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error creating compliance notification:', error)
    // Don't throw error for notification failures
  }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(userId: string): Promise<ComplianceNotification[]> {
  const cacheKey = createCacheKey('compliance', 'notifications', userId)

  return queryCache.get(
    cacheKey,
    async () => {
      const { data, error } = await supabaseAdmin
        .from('compliance_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications:', error)
        throw new Error('Failed to fetch notifications')
      }

      return data || []
    },
    CACHE_DURATIONS.NOTIFICATIONS, // 5 minutes
  )
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('compliance_notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    throw new Error('Failed to update notification')
  }

  // Invalidate compliance notification caches
  queryCache.invalidatePattern('compliance:notifications:.*')
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('compliance_notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    console.error('Error deleting notification:', error)
    throw new Error('Failed to delete notification')
  }

  // Invalidate compliance notification caches
  queryCache.invalidatePattern('compliance:notifications:.*')
}
