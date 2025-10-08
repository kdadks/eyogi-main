import { supabaseAdmin } from '../supabase'
import { Certificate } from '@/types'

export async function getStudentCertificates(studentId: string): Promise<Certificate[]> {
  try {
    console.log('Fetching certificates for student ID:', studentId)

    // Read from enrollments table instead of separate certificates table
    const { data: enrollments, error } = await supabaseAdmin
      .from('enrollments')
      .select(
        `
        *,
        courses(*),
        profiles!enrollments_student_id_fkey(*)
      `,
      )
      .eq('student_id', studentId)
      .eq('certificate_issued', true)
      .order('certificate_issued_at', { ascending: false })

    if (error) {
      console.error('Error fetching student certificates:', error)
      return []
    }

    console.log(
      `Found ${enrollments?.length || 0} enrollments with certificates for student ${studentId}`,
    )
    console.log('Enrollments data:', enrollments)

    if (!enrollments || enrollments.length === 0) {
      console.log('No certificate enrollments found')
      return []
    }

    // Transform enrollment data to Certificate objects
    return enrollments.map((enrollment) => {
      // Extract certificate number from URL if available, or generate a consistent one
      let certificateNumber = `CERT-${enrollment.id.slice(-8)}`
      if (enrollment.certificate_url) {
        const urlMatch = enrollment.certificate_url.match(/CERT-[\d]+-[\w]+/)
        if (urlMatch) {
          certificateNumber = urlMatch[0]
        }
      }

      // Convert old external URLs to relative URLs for compatibility
      let fileUrl = enrollment.certificate_url || ''
      if (
        fileUrl.startsWith('https://certificates.eyogigurukul.com/') ||
        fileUrl.startsWith('data:')
      ) {
        // Convert old URL to relative path
        fileUrl = `/ssh-app/certificates/${certificateNumber}.pdf`
      }

      return {
        id: enrollment.id, // Use enrollment ID as certificate ID
        enrollment_id: enrollment.id,
        student_id: enrollment.student_id,
        course_id: enrollment.course_id,
        certificate_number: certificateNumber,
        template_id:
          (enrollment as unknown as { certificate_template_id?: string }).certificate_template_id ||
          'default-template',
        issued_at: enrollment.certificate_issued_at || enrollment.updated_at,
        issued_by: 'admin',
        verification_code: certificateNumber.split('-').pop() || 'N/A',
        // Add course object for backwards compatibility with StudentDashboard
        course: (enrollment as unknown as { courses?: unknown }).courses,
        certificate_data: {
          student_name:
            (enrollment as unknown as { profiles?: { full_name?: string } }).profiles?.full_name ||
            'Student',
          course_title:
            (enrollment as unknown as { courses?: { title?: string } }).courses?.title || 'Course',
          completion_date: enrollment.certificate_issued_at || enrollment.updated_at,
        },
        file_url: fileUrl, // Use converted URL
        created_at: enrollment.updated_at,
      } as Certificate
    })
  } catch (error) {
    console.error('Error in getStudentCertificates:', error)
    return []
  }
}

// Function to download certificate PDF
export async function downloadCertificatePDF(certificateUrl: string): Promise<void> {
  if (!certificateUrl) {
    throw new Error('Certificate URL is required')
  }

  // Open certificate URL in new tab
  window.open(certificateUrl, '_blank')
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
          childName: child.full_name || 'Unknown',
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

  // Get the first active student template from database
  let templateId: string | null = null

  try {
    const { data: templates } = await supabaseAdmin
      .from('certificate_templates')
      .select('id')
      .eq('type', 'student')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)

    if (templates && templates.length > 0) {
      templateId = templates[0].id
    }
  } catch {
    console.warn('Could not fetch certificate template from database')
  }

  if (!templateId) {
    throw new Error('No active student certificate template found in database')
  }

  // Generate certificate details
  const certificateNumber = `CERT-${Date.now()}-${enrollmentId.slice(-4)}`
  const verificationCode = Math.random().toString(36).substr(2, 9).toUpperCase()
  const now = new Date().toISOString()

  // Create a relative certificate URL
  const certificateUrl = `/ssh-app/certificates/${certificateNumber}.pdf`

  const { error: updateError } = await supabaseAdmin
    .from('enrollments')
    .update({
      certificate_issued: true,
      certificate_issued_at: now,
      certificate_url: certificateUrl, // Store simple certificate data URL
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
    issued_by: 'system',
    verification_code: verificationCode,
    certificate_data: {
      student_name: enrollment.profiles?.full_name,
      course_title: enrollment.courses?.title,
      completion_date: enrollment.completed_at || new Date().toISOString(),
    },
    file_url: certificateUrl,
    created_at: new Date().toISOString(),
  }

  return certificate
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

    // Generate certificate details
    const certificateNumber = `CERT-${Date.now()}-${enrollmentId.slice(-4)}`
    const verificationCode = Math.random().toString(36).substr(2, 9).toUpperCase()
    const now = new Date().toISOString()

    // Create a relative certificate URL
    const certificateUrl = `/ssh-app/certificates/${certificateNumber}.pdf`

    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({
        certificate_issued: true,
        certificate_issued_at: now,
        certificate_url: certificateUrl,
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
      },
      file_url: certificateUrl,
      created_at: new Date().toISOString(),
    }

    return certificate
  } catch (error) {
    throw error
  }
}

export async function bulkIssueCertificates(enrollmentIds: string[]): Promise<Certificate[]> {
  const certificates: Certificate[] = []
  const errors: string[] = []

  for (const enrollmentId of enrollmentIds) {
    try {
      const certificate = await issueCertificate(enrollmentId)
      certificates.push(certificate)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Failed to issue certificate for enrollment ${enrollmentId}: ${errorMessage}`)
      console.error(`Failed to issue certificate for enrollment ${enrollmentId}:`, error)
      // Continue with other certificates even if one fails
    }
  }

  // If there were errors but some certificates were issued, log the errors but return the successful ones
  if (errors.length > 0) {
    console.warn('Some certificates failed to issue:', errors)
  }

  return certificates
}

export async function getAllCertificates(): Promise<Certificate[]> {
  try {
    console.log('Fetching all certificates from enrollments table')

    // Get all enrollments with certificates issued
    const { data: enrollments, error } = await supabaseAdmin
      .from('enrollments')
      .select(
        `
        *,
        courses(*),
        profiles!enrollments_student_id_fkey(*)
      `,
      )
      .eq('certificate_issued', true)
      .order('certificate_issued_at', { ascending: false })

    if (error) {
      console.error('Error fetching all certificates:', error)
      return []
    }

    console.log(`Found ${enrollments?.length || 0} enrollments with certificates`)

    if (!enrollments || enrollments.length === 0) {
      console.log('No certificate enrollments found')
      return []
    }

    // Transform enrollment data to Certificate objects
    return enrollments.map((enrollment) => {
      // Extract certificate number from URL if available, or generate a consistent one
      let certificateNumber = `CERT-${enrollment.id.slice(-8)}`
      if (enrollment.certificate_url) {
        const urlMatch = enrollment.certificate_url.match(/CERT-[\d]+-[\w]+/)
        if (urlMatch) {
          certificateNumber = urlMatch[0]
        }
      }

      // Convert old external URLs to relative URLs for compatibility
      let fileUrl = enrollment.certificate_url || ''
      if (
        fileUrl.startsWith('https://certificates.eyogigurukul.com/') ||
        fileUrl.startsWith('data:')
      ) {
        // Convert old URL to relative path
        fileUrl = `/ssh-app/certificates/${certificateNumber}.pdf`
      }

      return {
        id: enrollment.id, // Use enrollment ID as certificate ID
        enrollment_id: enrollment.id,
        student_id: enrollment.student_id,
        course_id: enrollment.course_id,
        certificate_number: certificateNumber,
        template_id:
          (enrollment as unknown as { certificate_template_id?: string }).certificate_template_id ||
          'default-template',
        issued_at: enrollment.certificate_issued_at || enrollment.updated_at,
        issued_by: 'admin',
        verification_code: certificateNumber.split('-').pop() || 'N/A',
        // Add student and course objects for admin display
        student: (
          enrollment as unknown as { profiles?: { full_name?: string; student_id?: string } }
        ).profiles,
        course: (enrollment as unknown as { courses?: unknown }).courses,
        certificate_data: {
          student_name:
            (enrollment as unknown as { profiles?: { full_name?: string } }).profiles?.full_name ||
            'Student',
          course_title:
            (enrollment as unknown as { courses?: { title?: string } }).courses?.title || 'Course',
          completion_date: enrollment.certificate_issued_at || enrollment.updated_at,
        },
        file_url: fileUrl, // Use converted URL
        created_at: enrollment.updated_at,
      } as Certificate
    })
  } catch (error) {
    console.error('Error in getAllCertificates:', error)
    return []
  }
}

export interface BatchCertificateResult {
  success: boolean
  studentId: string
  error?: string
}

export async function issueBatchCertificates(
  batchId: string,
  templateId?: string,
): Promise<BatchCertificateResult[]> {
  try {
    // Import getBatchStudents dynamically to avoid circular dependency
    const { getBatchStudents } = await import('./batches')

    // Get all active students in the batch
    const batchStudents = await getBatchStudents(batchId)

    if (!batchStudents || batchStudents.length === 0) {
      throw new Error('No active students found in this batch')
    }

    // Get batch details with course information
    const { data: batchDetails, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (batchError || !batchDetails) {
      throw new Error('Failed to fetch batch details')
    }

    // For each student, check if they have a completed enrollment and issue certificate
    const certificatePromises = batchStudents.map(async (batchStudent) => {
      try {
        // Check if enrollment exists and is completed
        const { data: existingEnrollment, error: enrollmentError } = await supabaseAdmin
          .from('enrollments')
          .select('*')
          .eq('student_id', batchStudent.student_id)
          .eq('course_id', batchDetails.course_id)
          .eq('status', 'completed')
          .single()

        if (enrollmentError || !existingEnrollment) {
          throw new Error(
            `No completed enrollment found for student ${batchStudent.student_id}. Student must be manually enrolled by teacher first.`,
          )
        }

        // Issue certificate
        if (templateId) {
          await issueCertificateWithTemplate(existingEnrollment.id, templateId)
        } else {
          await issueCertificate(existingEnrollment.id)
        }

        return { success: true, studentId: batchStudent.student_id }
      } catch (error) {
        console.error(`Error issuing certificate for student ${batchStudent.student_id}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return { success: false, studentId: batchStudent.student_id, error: errorMessage }
      }
    })

    // Wait for all certificate operations to complete
    const results = await Promise.all(certificatePromises)

    // Update batch to mark certificates as issued
    const successfulCount = results.filter((r) => r.success).length
    if (successfulCount > 0) {
      await supabaseAdmin
        .from('batches')
        .update({
          certificates_issued: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchId)
    }

    return results
  } catch (error) {
    console.error('Error in issueBatchCertificates:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to issue batch certificates: ${errorMessage}`)
  }
}
