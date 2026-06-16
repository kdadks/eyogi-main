import { supabaseAdmin } from '../supabase'
import { decryptProfileFields } from '../encryption'

/**
 * Student Consent Management API
 *
 * Handles consent for student participation in eYogi Gurukul activities
 */

export const CONSENT_TEXT = `I/ my children(s) wish to voluntarily participate in eYogi Gurukul ('eYogi') activities and for this purpose, I agree that, I grant the absolute rights to eYogi as below:

• eYogi has right to photograph, film and otherwise record my/ my children(s) voice, image, conversations, sounds, performance(s) in connection with any participation, preparation, filming, or recordings (collectively 'recordings');
• eYogi has right to edit and change such recordings and to produce, distribute, promote, maintain or publish such recordings in any print or digital media including website and social media;
• eYogi has right to transfer or give any of all of benefits under this agreement to designated third party for processing and accreditation to achieve objectives of organisation;
• eYogi has right to copyright the recordings in its own name.

I understand that eYogi is volunteer-based charity and may not have insurance to cover for any personal injury or damage to any property that may occur during eYogi activities.

I consent that eYogi may contact me via text messages, phone calls, emails and postal letters for the promotion and organisation of its activities.

I consent for eYogi to process my personal data as per its data privacy policy and applicable laws governing the privacy and security of personal data. I retain the right to withdraw my personal data at any time by sending formal request at info@eyogigurukul.com

I shall not disclose any Intellectual Property and information relating to eYogi, to any third party without eYogi' prior written consent and shall not use any Information for any purpose other than for the performance of the Services.`

export interface StudentConsent {
  id: string
  student_id: string
  consent_given: boolean
  consent_text: string
  consent_date: string | null
  consented_by: string | null
  ip_address: string | null
  user_agent: string | null
  withdrawn: boolean
  withdrawn_date: string | null
  withdrawn_reason: string | null
  created_at: string
  updated_at: string
  // Joined data
  student?: {
    id: string
    full_name: string
    email: string
    student_id: string
  }
  consented_by_user?: {
    id: string
    full_name: string
    email: string
  }
}

/**
 * Get consent status for a student
 */
export async function getStudentConsent(studentId: string): Promise<StudentConsent | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('student_consent')
      .select(
        `
        *,
        student:profiles!student_consent_student_id_fkey (
          id,
          full_name,
          email,
          student_id
        ),
        consented_by_user:profiles!student_consent_consented_by_fkey (
          id,
          full_name,
          email
        )
      `,
      )
      .eq('student_id', studentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No consent record exists
        return null
      }
      // Suppress RLS permission errors - parents may not have access
      if (error.code !== 'PGRST301' && error.code !== '42501') {
        console.error('Error fetching student consent:', error)
      }
      return null
    }

    // Decrypt profile fields
    if (data.student) {
      data.student = decryptProfileFields(data.student)
    }
    if (data.consented_by_user) {
      data.consented_by_user = decryptProfileFields(data.consented_by_user)
    }

    return data
  } catch (error) {
    // Suppress errors - they're likely permission-related and expected
    return null
  }
}

/**
 * Give consent for a student
 */
export async function giveConsent(params: {
  student_id: string
  consented_by: string
  ip_address?: string
  user_agent?: string
}): Promise<StudentConsent | null> {
  try {
    const now = new Date().toISOString()

    // Check if consent already exists
    const existing = await getStudentConsent(params.student_id)

    if (existing) {
      // Update existing consent
      const { data, error } = await supabaseAdmin
        .from('student_consent')
        .update({
          consent_given: true,
          consent_date: now,
          consented_by: params.consented_by,
          ip_address: params.ip_address || null,
          user_agent: params.user_agent || null,
          withdrawn: false,
          withdrawn_date: null,
          withdrawn_reason: null,
          updated_at: now,
        })
        .eq('student_id', params.student_id)
        .select()
        .single()

      if (error) {
        console.error('Error updating consent:', error)
        return null
      }

      return data
    } else {
      // Create new consent
      const { data, error } = await supabaseAdmin
        .from('student_consent')
        .insert({
          student_id: params.student_id,
          consent_given: true,
          consent_text: CONSENT_TEXT,
          consent_date: now,
          consented_by: params.consented_by,
          ip_address: params.ip_address || null,
          user_agent: params.user_agent || null,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating consent:', error)
        return null
      }

      return data
    }
  } catch (error) {
    console.error('Error in giveConsent:', error)
    return null
  }
}

/**
 * Withdraw consent for a student
 */
export async function withdrawConsent(
  studentId: string,
  reason?: string,
): Promise<StudentConsent | null> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('student_consent')
      .update({
        consent_given: false,
        withdrawn: true,
        withdrawn_date: now,
        withdrawn_reason: reason || null,
        updated_at: now,
      })
      .eq('student_id', studentId)
      .select()
      .single()

    if (error) {
      console.error('Error withdrawing consent:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in withdrawConsent:', error)
    return null
  }
}

/**
 * Get consent status for multiple students (for teachers/admins)
 */
export async function getStudentsConsent(studentIds: string[]): Promise<StudentConsent[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('student_consent')
      .select(
        `
        *,
        student:profiles!student_consent_student_id_fkey (
          id,
          full_name,
          email,
          student_id
        ),
        consented_by_user:profiles!student_consent_consented_by_fkey (
          id,
          full_name,
          email
        )
      `,
      )
      .in('student_id', studentIds)

    if (error) {
      console.error('Error fetching students consent:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getStudentsConsent:', error)
    return []
  }
}

/**
 * Get all consents for admin view (with pagination)
 */
export async function getAllConsents(params?: {
  limit?: number
  offset?: number
  consent_status?: 'given' | 'not_given' | 'withdrawn' | 'all'
}): Promise<{ data: StudentConsent[]; count: number }> {
  try {
    let query = supabaseAdmin.from('student_consent').select(
      `
        *,
        student:profiles!student_consent_student_id_fkey (
          id,
          full_name,
          email,
          student_id
        ),
        consented_by_user:profiles!student_consent_consented_by_fkey (
          id,
          full_name,
          email
        )
      `,
      { count: 'exact' },
    )

    // Filter by consent status
    if (params?.consent_status) {
      if (params.consent_status === 'given') {
        query = query.eq('consent_given', true).eq('withdrawn', false)
      } else if (params.consent_status === 'not_given') {
        query = query.eq('consent_given', false)
      } else if (params.consent_status === 'withdrawn') {
        query = query.eq('withdrawn', true)
      }
    }

    // Apply pagination
    if (params?.limit) {
      query = query.limit(params.limit)
    }
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    query = query.order('consent_date', { ascending: false, nullsFirst: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching all consents:', error)
      return { data: [], count: 0 }
    }

    // Decrypt profile fields for all consents
    const decryptedData = (data || []).map((consent) => ({
      ...consent,
      student: consent.student ? decryptProfileFields(consent.student) : consent.student,
      consented_by_user: consent.consented_by_user
        ? decryptProfileFields(consent.consented_by_user)
        : consent.consented_by_user,
    }))

    return { data: decryptedData, count: count || 0 }
  } catch (error) {
    console.error('Error in getAllConsents:', error)
    return { data: [], count: 0 }
  }
}

/**
 * Get consent statistics
 */
export async function getConsentStats(): Promise<{
  total_students: number
  consented: number
  not_consented: number
  withdrawn: number
}> {
  try {
    const { count: totalStudents } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')

    const { count: consented } = await supabaseAdmin
      .from('student_consent')
      .select('*', { count: 'exact', head: true })
      .eq('consent_given', true)
      .eq('withdrawn', false)

    const { count: withdrawn } = await supabaseAdmin
      .from('student_consent')
      .select('*', { count: 'exact', head: true })
      .eq('withdrawn', true)

    return {
      total_students: totalStudents || 0,
      consented: consented || 0,
      not_consented: (totalStudents || 0) - (consented || 0),
      withdrawn: withdrawn || 0,
    }
  } catch (error) {
    console.error('Error in getConsentStats:', error)
    return {
      total_students: 0,
      consented: 0,
      not_consented: 0,
      withdrawn: 0,
    }
  }
}
