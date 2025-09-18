import { supabaseAdmin } from '../supabase'
import type { Database } from '../supabase'

type Certificate = Database['public']['Tables']['certificates']['Row']

export async function getStudentCertificates(studentId: string): Promise<Certificate[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select(
        `
        *,
        courses (*),
        profiles!certificates_student_id_fkey (*)
      `,
      )
      .eq('student_id', studentId)
      .order('issue_date', { ascending: false })

    if (error) {
      console.error('Error fetching student certificates:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching student certificates:', error)
    return []
  }
}

export async function downloadCertificate(certificateId: string): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('file_url')
      .eq('id', certificateId)
      .single()

    if (error || !data?.file_url) {
      throw new Error('Certificate not found')
    }

    // In a real app, this would trigger a file download
    window.open(data.file_url, '_blank')
  } catch (error) {
    console.error('Error downloading certificate:', error)
    throw error
  }
}

export async function issueCertificate(enrollmentId: string): Promise<Certificate> {
  try {
    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select(
        `
        *,
        courses (*),
        profiles!enrollments_student_id_fkey (*)
      `,
      )
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found')
    }

    if (enrollment.status !== 'completed') {
      throw new Error('Can only issue certificates for completed courses')
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabaseAdmin
      .from('certificates')
      .select('id')
      .eq('enrollment_id', enrollmentId)
      .single()

    if (existingCert) {
      throw new Error('Certificate already issued for this enrollment')
    }

    const certificateNumber = `CERT-${Date.now()}`
    const verificationCode = Math.random().toString(36).substr(2, 9).toUpperCase()

    const { data: certificate, error } = await supabaseAdmin
      .from('certificates')
      .insert({
        id: crypto.randomUUID(),
        enrollment_id: enrollmentId,
        student_id: enrollment.student_id,
        course_id: enrollment.course_id,
        certificate_number: certificateNumber,
        template_id: 'default-template',
        issue_date: new Date().toISOString(),
        issued_by: 'system',
        verification_code: verificationCode,
        certificate_data: {
          student_name: enrollment.profiles?.full_name,
          course_title: enrollment.courses?.title,
          completion_date: enrollment.completed_at || new Date().toISOString(),
        },
        file_url: `https://certificates.eyogigurukul.com/${certificateNumber}.pdf`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error issuing certificate:', error)
      throw new Error('Failed to issue certificate')
    }

    // Update enrollment to mark certificate as issued
    await supabaseAdmin
      .from('enrollments')
      .update({
        certificate_issued: true,
        certificate_url: certificate.file_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)

    return certificate
  } catch (error) {
    console.error('Error issuing certificate:', error)
    throw error
  }
}

export async function bulkIssueCertificates(enrollmentIds: string[]): Promise<Certificate[]> {
  const certificates: Certificate[] = []

  for (const enrollmentId of enrollmentIds) {
    try {
      const certificate = await issueCertificate(enrollmentId)
      certificates.push(certificate)
    } catch (error) {
      console.error(`Failed to issue certificate for enrollment ${enrollmentId}:`, error)
    }
  }

  return certificates
}
