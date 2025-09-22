import { supabaseAdmin } from '../supabase'
import { Certificate } from '@/types'

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

    if (error) {
      console.error('Error fetching certificates:', error)
      // Return empty array if certificates table doesn't exist
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getStudentCertificates:', error)
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

    // Check if certificate already exists by looking at enrollment record
    if (enrollment.certificate_issued) {
      throw new Error('Certificate already issued for this enrollment')
    }

    const certificateNumber = `CERT-${Date.now()}-${enrollmentId.slice(-4)}`
    const verificationCode = Math.random().toString(36).substr(2, 9).toUpperCase()

    // Update the enrollment record to mark certificate as issued
    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({
        certificate_issued: true,
        certificate_url: `https://certificates.eyogigurukul.com/${certificateNumber}.pdf`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)

    if (updateError) {
      console.error('Error updating enrollment with certificate info:', updateError)
      throw new Error(`Failed to issue certificate: ${updateError.message}`)
    }

    // Return a certificate object for the UI
    const certificate: Certificate = {
      id: crypto.randomUUID(),
      enrollment_id: enrollmentId,
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      certificate_number: certificateNumber,
      template_id: 'default-template',
      issued_at: new Date().toISOString(),
      issued_by: 'system',
      verification_code: verificationCode,
      certificate_data: {
        student_name: enrollment.profiles?.full_name,
        course_title: enrollment.courses?.title,
        completion_date: enrollment.completed_at || new Date().toISOString(),
      },
      file_url: `https://certificates.eyogigurukul.com/${certificateNumber}.pdf`,
      created_at: new Date().toISOString(),
    }

    return certificate
  } catch (error) {
    console.error('Error issuing certificate:', error)
    throw error
  }
}

export async function issueCertificateWithTemplate(enrollmentId: string, templateId: string): Promise<Certificate> {
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

    // Check if certificate already exists by looking at enrollment record
    if (enrollment.certificate_issued) {
      throw new Error('Certificate already issued for this enrollment')
    }

    // Get the certificate template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('certificate_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      throw new Error('Certificate template not found')
    }

    const certificateNumber = `CERT-${Date.now()}-${enrollmentId.slice(-4)}`
    const verificationCode = Math.random().toString(36).substr(2, 9).toUpperCase()

    // Update the enrollment record to mark certificate as issued
    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({
        certificate_issued: true,
        certificate_url: `https://certificates.eyogigurukul.com/${certificateNumber}.pdf`,
        certificate_template_id: templateId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)

    if (updateError) {
      console.error('Error updating enrollment with certificate info:', updateError)
      throw new Error(`Failed to issue certificate: ${updateError.message}`)
    }

    // Return a certificate object for the UI
    const certificate: Certificate = {
      id: crypto.randomUUID(),
      enrollment_id: enrollmentId,
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      certificate_number: certificateNumber,
      template_id: templateId,
      issued_at: new Date().toISOString(),
      issued_by: 'teacher',
      verification_code: verificationCode,
      certificate_data: {
        student_name: enrollment.profiles?.full_name,
        course_title: enrollment.courses?.title,
        completion_date: enrollment.completed_at || new Date().toISOString(),
        template_name: template.name,
      },
      file_url: `https://certificates.eyogigurukul.com/${certificateNumber}.pdf`,
      created_at: new Date().toISOString(),
    }

    return certificate
  } catch (error) {
    console.error('Error issuing certificate with template:', error)
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
      console.error(`Error issuing certificate for enrollment ${enrollmentId}:`, error)
    }
  }

  return certificates
}
