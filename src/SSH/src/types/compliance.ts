// Compliance Management Types

export type UserRole = 'teacher' | 'parent' | 'student'
export type ComplianceStatus = 'pending' | 'submitted' | 'approved' | 'rejected'
export type ComplianceItemType = 'form_submission' | 'verification' | 'document_upload'
export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'date'
  | 'number'
  | 'email'
  | 'phone'

export interface ComplianceItem {
  id: string
  title: string
  description: string
  target_role: UserRole
  type: ComplianceItemType
  is_mandatory: boolean
  due_date?: string
  has_form: boolean
  form_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
  // Relations
  form?: ComplianceForm
}

export interface ComplianceForm {
  id: string
  title: string
  description?: string
  fields: ComplianceFormField[]
  is_active: boolean
  version: number
  created_at: string
  updated_at: string
  created_by: string
}

export interface ComplianceFormField {
  id: string
  name: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  help_text?: string
  options?: string[] // For select, radio, checkbox fields
  validation?: {
    min_length?: number
    max_length?: number
    pattern?: string
    min_value?: number
    max_value?: number
    max_file_size?: number // in bytes, default 2MB
    allowed_file_types?: string[]
  }
  order: number
}

export interface ComplianceSubmission {
  id: string
  compliance_item_id: string
  user_id: string
  form_data: Record<string, string | number | boolean | string[]>
  status: ComplianceStatus
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  rejection_reason?: string
  files?: ComplianceFile[]
  // Relations
  compliance_item?: ComplianceItem
  user?: {
    id: string
    email: string
    full_name: string
  }
  reviewer?: {
    id: string
    full_name: string
  }
}

export interface ComplianceFile {
  id: string
  submission_id: string
  field_name: string
  original_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_at: string
}

export interface UserComplianceStatus {
  user_id: string
  compliance_item_id: string
  status: ComplianceStatus
  submission_id?: string
  last_updated: string
}

// Dashboard/UI specific types
export interface ComplianceChecklistItem {
  id: string
  title: string
  description: string
  type: ComplianceItemType
  status: ComplianceStatus
  is_mandatory: boolean
  due_date?: string
  has_form: boolean
  submission_id?: string
  rejection_reason?: string
  can_submit: boolean // true if form can be submitted (not already submitted and pending)
}

export interface ComplianceStats {
  total_items: number
  completed_items: number
  pending_items: number
  overdue_items: number
  completion_percentage: number
}

// Admin management types
export interface ComplianceAdminStats {
  total_items: number
  total_submissions: number
  pending_reviews: number
  approved_submissions: number
  rejected_submissions: number
  by_role: {
    teacher: ComplianceStats
    parent: ComplianceStats
    student: ComplianceStats
  }
}

export interface ComplianceSubmissionReview {
  submission_id: string
  action: 'approve' | 'reject'
  rejection_reason?: string
}

// Form validation result
export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string>
  fileSizeErrors?: string[]
}

// Notification types for compliance
export interface ComplianceNotification {
  id: string
  user_id: string
  type:
    | 'submission_approved'
    | 'submission_rejected'
    | 'compliance_due'
    | 'new_compliance_item'
    | 'deadline_reminder'
    | 'form_submitted'
  title: string
  message: string
  compliance_item_id?: string
  submission_id?: string
  is_read: boolean
  read_at?: string
  metadata?: {
    rejection_reason?: string
    due_date?: string
    [key: string]: string | number | boolean | null | undefined
  }
  created_at: string
}
