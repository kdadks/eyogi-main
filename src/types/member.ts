/**
 * Type definitions for Member Portal system
 */

export interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address_line_1?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  member_number: string
  membership_type: 'monthly' | 'annual'
  status: 'pending' | 'active' | 'suspended' | 'cancelled'
  joined_date: string
  expiry_date: string
  auto_renew: boolean
  password_hash?: string
  password_set_at?: string
  password_reset_token?: string
  password_reset_expires?: string
  auth_user_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface MemberPayment {
  id: string
  member_id: string
  amount: number
  currency: string
  payment_type: 'membership_signup' | 'membership_renewal'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  provider: string
  provider_transaction_id?: string
  checkout_id?: string
  period_start?: string
  period_end?: string
  receipt_url?: string
  receipt_number?: string
  payment_date?: string
  created_at: string
  updated_at: string
}

export interface MemberDonation {
  id: string
  donor_email: string
  member_id: string
  member_number: string
  amount: number
  currency: string
  status: string
  donation_date: string
  payment_method?: string
  transaction_id?: string
  notes?: string
  created_at: string
}

export interface MemberProfile {
  member: Member
  totalDonations: number
  totalContributions: number
  upcomingRenewal?: string
  memberSince: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordSetRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface MemberLoginRequest {
  email: string
  password: string
}

export interface MemberRegistrationRequest {
  firstName: string
  lastName: string
  email: string
  phone?: string
  addressLine1?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  membershipType: 'monthly' | 'annual'
}
