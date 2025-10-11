// Compliance API Functions
import { supabaseAdmin } from '../supabase'
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
  try {
    let query = supabaseAdmin
      .from('compliance_items')
      .select(
        `
        *,
        form:compliance_forms(*)
      `,
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (targetRole) {
      query = query.eq('target_role', targetRole)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching compliance items:', error)
    throw error
  }
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
  } catch (error) {
    console.error('Error deleting compliance item:', error)
    throw error
  }
}

// ================================
// COMPLIANCE FORMS MANAGEMENT
// ================================

export async function getComplianceForms(): Promise<ComplianceForm[]> {
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
}

export async function getComplianceForm(id: string): Promise<ComplianceForm | null> {
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
  try {
    let query = supabaseAdmin
      .from('compliance_submissions')
      .select('*')
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

    // Fetch related data manually
    const userIds = [...new Set(submissions.map((s) => s.user_id).filter(Boolean))]
    const itemIds = [...new Set(submissions.map((s) => s.compliance_item_id).filter(Boolean))]
    const submissionIds = submissions.map((s) => s.id)

    // Get users
    const { data: users } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)

    // Get compliance items
    const { data: items } = await supabaseAdmin
      .from('compliance_items')
      .select('*')
      .in('id', itemIds)

    // Get files
    const { data: files } = await supabaseAdmin
      .from('compliance_files')
      .select('*')
      .in('submission_id', submissionIds)

    // Combine data
    const enrichedSubmissions = submissions.map((submission) => ({
      ...submission,
      user: users?.find((u) => u.id === submission.user_id) || null,
      compliance_item: items?.find((i) => i.id === submission.compliance_item_id) || null,
      files: files?.filter((f) => f.submission_id === submission.id) || [],
      reviewer: submission.reviewed_by
        ? users?.find((u) => u.id === submission.reviewed_by) || null
        : null,
    }))

    return enrichedSubmissions
  } catch (error) {
    console.error('Error fetching compliance submissions:', error)
    throw error
  }
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
}

export async function getComplianceStats(
  userId?: string,
  role?: UserRole,
): Promise<ComplianceStats> {
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
      (item) => item.due_date && new Date(item.due_date) < new Date() && item.status !== 'approved',
    ).length

    return {
      total_items: totalItems,
      completed_items: completedItems,
      pending_items: pendingItems,
      overdue_items: overdueItems,
      completion_percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    }
  } catch (error) {
    console.error('Error getting compliance stats:', error)
    throw error
  }
}

// ================================
// ADMIN STATS AND MANAGEMENT
// ================================

export async function getComplianceAdminStats(): Promise<ComplianceAdminStats> {
  try {
    const [items, submissions] = await Promise.all([
      getComplianceItems(),
      getComplianceSubmissions({}),
    ])

    const totalSubmissions = submissions.length
    const pendingReviews = submissions.filter((s) => s.status === 'submitted').length
    const approvedSubmissions = submissions.filter((s) => s.status === 'approved').length
    const rejectedSubmissions = submissions.filter((s) => s.status === 'rejected').length

    // Calculate stats by role
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

    // This would need more complex queries to get accurate role-based stats
    // For now, return basic stats

    return {
      total_items: items.length,
      total_submissions: totalSubmissions,
      pending_reviews: pendingReviews,
      approved_submissions: approvedSubmissions,
      rejected_submissions: rejectedSubmissions,
      by_role: roleStats,
    }
  } catch (error) {
    console.error('Error getting admin compliance stats:', error)
    throw error
  }
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
}
