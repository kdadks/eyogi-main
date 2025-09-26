import { supabaseAdmin } from '../supabase'
import { Certificate } from '@/types'
export async function getStudentCertificates(studentId: string): Promise<Certificate[]> {
  try {
    // Get certificates from enrollments table where certificate_issued = true
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select(
        `
        id,
        student_id,
        course_id,
        certificate_url,
        certificate_issued_at,
        updated_at,
        courses (*),
        profiles!enrollments_student_id_fkey (*)
      `,
      )
      .eq('student_id', studentId)
      .eq('certificate_issued', true)
      .not('certificate_url', 'is', null)

    if (error) {
      console.error('Error fetching student certificates:', error)
      return []
    }

    // Transform enrollment data to certificate format
    const certificates: Certificate[] = (data || []).map((enrollment) => {
      // Extract certificate number from URL
      const urlMatch = enrollment.certificate_url?.match(/CERT-[\d]+-[\w]+/)
      const certificateNumber = urlMatch
        ? urlMatch[0]
        : `CERT-${Date.now()}-${enrollment.id.slice(-4)}`

      return {
        id: enrollment.id, // Use enrollment ID as certificate ID
        enrollment_id: enrollment.id,
        student_id: enrollment.student_id,
        course_id: enrollment.course_id,
        certificate_number: certificateNumber,
        template_id: 'default-template',
        issued_at: enrollment.certificate_issued_at || enrollment.updated_at,
        issued_by: 'admin',
        verification_code: certificateNumber.split('-').pop() || 'N/A',
        certificate_data: {
          student_name:
            (enrollment as unknown as { profiles?: { full_name?: string } }).profiles?.full_name ||
            'Student',
          course_title:
            (enrollment as unknown as { courses?: { title?: string } }).courses?.title || 'Course',
          completion_date: enrollment.certificate_issued_at || enrollment.updated_at,
        },
        file_url: enrollment.certificate_url || '',
        created_at: enrollment.updated_at,
      }
    })

    return certificates
  } catch (error) {
    console.error('Error in getStudentCertificates:', error)
    return []
  }
}
export async function downloadCertificate(certificateId: string): Promise<void> {
  // Get certificate URL from enrollments table (certificateId is actually enrollment ID)
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select('certificate_url')
    .eq('id', certificateId)
    .eq('certificate_issued', true)
    .single()

  if (error || !data?.certificate_url) {
    throw new Error('Certificate not found')
  }

  // Open certificate URL in new tab
  window.open(data.certificate_url, '_blank')
}

export async function getChildrenCertificates(
  parentId: string,
): Promise<{ childId: string; childName: string; certificates: Certificate[] }[]> {
  try {
    // Get all children of this parent
    const { data: children, error: childrenError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('parent_id', parentId)
      .eq('role', 'student')

    if (childrenError) {
      console.error('Error fetching children:', childrenError)
      return []
    }

    if (!children || children.length === 0) {
      return []
    }

    // Get certificates for each child
    const childrenWithCertificates = await Promise.all(
      children.map(async (child) => {
        const certificates = await getStudentCertificates(child.id)
        return {
          childId: child.id,
          childName: child.full_name || 'Child',
          certificates,
        }
      }),
    )

    return childrenWithCertificates
  } catch (error) {
    console.error('Error in getChildrenCertificates:', error)
    return []
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
    const now = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({
        certificate_issued: true,
        certificate_issued_at: now,
        certificate_url: `https://certificates.eyogigurukul.com/${certificateNumber}.pdf`,
        updated_at: now,
      })
      .eq('id', enrollmentId)
    if (updateError) {
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
    throw error
  }
}
export async function issueCertificateWithTemplate(
  enrollmentId: string,
  templateId: string,
): Promise<Certificate> {
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
    const now = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({
        certificate_issued: true,
        certificate_issued_at: now,
        certificate_url: `https://certificates.eyogigurukul.com/${certificateNumber}.pdf`,
        certificate_template_id: templateId,
        updated_at: now,
      })
      .eq('id', enrollmentId)
    if (updateError) {
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
    throw error
  }
}
export async function bulkIssueCertificates(enrollmentIds: string[]): Promise<Certificate[]> {
  const certificates: Certificate[] = []
  for (const enrollmentId of enrollmentIds) {
    try {
      const certificate = await issueCertificate(enrollmentId)
      certificates.push(certificate)
    } catch (error) {}
  }
  return certificates
}
