/**
 * GDPR Right to Delete Types
 *
 * Types for managing data deletion requests in compliance with GDPR
 */

export type DeletionRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'failed'

export type DeletionRequestType = 'student_data' | 'parent_data' | 'full_account'

export interface DeletionRequest {
  id: string
  user_id: string | null // User requesting deletion (null if deleted)
  target_user_id: string | null // User whose data will be deleted (null if deleted)
  request_type: DeletionRequestType
  status: DeletionRequestStatus
  reason?: string
  requested_at: string
  reviewed_at?: string
  reviewed_by?: string | null
  completed_at?: string
  rejection_reason?: string
  ip_address?: string
  user_agent?: string
  created_at: string
  updated_at: string
  // Joined data (may be null if user was deleted)
  requester?: {
    id: string
    full_name: string
    email: string
    role: string
  } | null
  target_user?: {
    id: string
    full_name: string
    email: string
    role: string
  } | null
  reviewer?: {
    id: string
    full_name: string
    email: string
  } | null
}

export interface DeletionAuditLog {
  id: string
  deletion_request_id: string
  action: string
  table_name: string
  records_affected: number
  success: boolean
  error_message?: string
  performed_by: string | null // Null if admin was deleted
  performed_at: string
  metadata?: Record<string, unknown>
}

export interface DeletionImpact {
  profiles: number
  enrollments: number
  certificates: number
  attendance_records: number
  batch_students: number
  compliance_submissions: number
  consent_records: number
  children_accounts: number // Number of children that will be cascaded deleted if parent
  total_records: number
}

export interface DeletionRequestWithImpact extends DeletionRequest {
  impact: DeletionImpact
}

export interface DeletionStats {
  total_requests: number
  pending_requests: number
  approved_requests: number
  rejected_requests: number
  completed_requests: number
}
