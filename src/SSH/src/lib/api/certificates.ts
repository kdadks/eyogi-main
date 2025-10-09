import { supabaseAdmin } from '../supabase'
import { Certificate } from '@/types'

// NEW: Functions for working with the certificates table

/**
 * Create a new certificate record in the certificates table
 */
export async function createCertificate(certificateData: {
  student_id: string
  course_id: string
  template_id?: string | null
  teacher_id?: string | null
  title: string
  completion_date: string
  certificate_data?: object | null
  file_url?: string | null
}): Promise<Certificate> {
  try {
    const certificateNumber = `CERT-${Date.now()}-${certificateData.course_id.slice(-4)}`
    const verificationCode = Math.random().toString(36).substr(2, 9).toUpperCase()
    const now = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('certificates')
      .insert({
        id: crypto.randomUUID(),
        certificate_number: certificateNumber,
        student_id: certificateData.student_id,
        course_id: certificateData.course_id,
        template_id: certificateData.template_id,
        teacher_id: certificateData.teacher_id,
        title: certificateData.title,
        completion_date: certificateData.completion_date,
        issue_date: now,
        certificate_data: certificateData.certificate_data,
        file_url: certificateData.file_url || `/ssh-app/certificates/${certificateNumber}.pdf`,
        verification_code: verificationCode,
        is_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select(
        `
        *,
        courses(*),
        student:profiles!certificates_student_id_fkey(*),
        teacher:profiles!certificates_teacher_id_fkey(*)
      `,
      )
      .single()

    if (error) {
      throw new Error(`Failed to create certificate: ${error.message}`)
    }

    // Transform data to match interface
    return {
      ...data,
      issued_at: data.issue_date, // Alias for backward compatibility
      issued_by: data.teacher_id || 'system', // For backward compatibility
      course: data.courses,
      student: data.student,
      teacher: data.teacher,
    } as Certificate
  } catch (error) {
    console.error('Error creating certificate:', error)
    throw error
  }
}

/**
 * Get certificates from the certificates table
 */
export async function getCertificatesFromTable(filters?: {
  student_id?: string
  course_id?: string
  teacher_id?: string
  is_active?: boolean
}): Promise<Certificate[]> {
  try {
    let query = supabaseAdmin.from('certificates').select(`
        *,
        courses(*),
        student:profiles!certificates_student_id_fkey(*),
        teacher:profiles!certificates_teacher_id_fkey(*)
      `)

    if (filters?.student_id) {
      query = query.eq('student_id', filters.student_id)
    }
    if (filters?.course_id) {
      query = query.eq('course_id', filters.course_id)
    }
    if (filters?.teacher_id) {
      query = query.eq('teacher_id', filters.teacher_id)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch certificates: ${error.message}`)
    }

    // Transform data to match interface
    return (data || []).map((cert) => ({
      ...cert,
      issued_at: cert.issue_date, // Alias for backward compatibility
      issued_by: cert.teacher_id || 'system', // For backward compatibility
      course: cert.courses,
      student: cert.student,
      teacher: cert.teacher,
    })) as Certificate[]
  } catch (error) {
    console.error('Error fetching certificates from table:', error)
    return []
  }
}

/**
 * Check if a certificate exists for a student and course
 */
export async function certificateExists(studentId: string, courseId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .limit(1)

    if (error) {
      console.error('Error checking certificate existence:', error)
      return false
    }

    return (data?.length || 0) > 0
  } catch (error) {
    console.error('Error checking certificate existence:', error)
    return false
  }
}

// LEGACY: Functions for backward compatibility with enrollments table

export async function getStudentCertificates(studentId: string): Promise<Certificate[]> {
  try {
    console.log('Fetching certificates for student ID:', studentId)

    // Get certificates from the dedicated certificates table
    const certificatesFromTable = await getCertificatesFromTable({
      student_id: studentId,
      is_active: true,
    })

    console.log(
      `Found ${certificatesFromTable.length} certificates in certificates table for student ${studentId}`,
    )
    return certificatesFromTable
  } catch (error) {
    console.error('Error in getStudentCertificates:', error)
    return []
  }
}

/**
 * Migration function to transfer certificates from enrollments table to certificates table
 * This should be run once to migrate existing data
 */
export async function migrateCertificatesFromEnrollments(): Promise<{
  migrated: number
  skipped: number
  errors: string[]
}> {
  const results = {
    migrated: 0,
    skipped: 0,
    errors: [] as string[],
  }

  try {
    // Get all enrollments that have certificates issued
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select(
        `
        *,
        courses(*),
        profiles!enrollments_student_id_fkey(*)
      `,
      )
      .eq('certificate_issued', true)
      .not('certificate_url', 'is', null)

    if (enrollmentError) {
      throw new Error(`Failed to fetch enrollments: ${enrollmentError.message}`)
    }

    if (!enrollments || enrollments.length === 0) {
      console.log('No certificates found in enrollments table to migrate')
      return results
    }

    console.log(`Found ${enrollments.length} certificates to migrate from enrollments table`)

    for (const enrollment of enrollments) {
      try {
        // Check if certificate already exists in certificates table
        const existingCertificate = await getCertificatesFromTable({
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
          is_active: true,
        })

        if (existingCertificate.length > 0) {
          console.log(
            `Certificate already exists for student ${enrollment.student_id}, course ${enrollment.course_id}`,
          )
          results.skipped++
          continue
        }

        // Extract certificate number from URL or generate one
        let certificateNumber = `CERT-${enrollment.id.slice(-8)}`
        if (enrollment.certificate_url) {
          const urlMatch = enrollment.certificate_url.match(/CERT-[\d]+-[\w]+/)
          if (urlMatch) {
            certificateNumber = urlMatch[0]
          }
        }

        // Convert old external URLs to relative URLs
        let fileUrl = enrollment.certificate_url || ''
        if (
          fileUrl.startsWith('https://certificates.eyogigurukul.com/') ||
          fileUrl.startsWith('data:')
        ) {
          fileUrl = `/ssh-app/certificates/${certificateNumber}.pdf`
        }

        const courseTitle = enrollment.courses?.title || 'Course'
        const completionDate =
          enrollment.certificate_issued_at || enrollment.completed_at || enrollment.updated_at

        // Create certificate in certificates table
        await createCertificate({
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
          template_id: enrollment.certificate_template_id,
          teacher_id: null,
          title: `Certificate of Completion - ${courseTitle}`,
          completion_date: completionDate,
          certificate_data: {
            student_name: enrollment.profiles?.full_name || 'Student',
            course_title: courseTitle,
            completion_date: completionDate,
            enrollment_id: enrollment.id, // Keep reference to original enrollment
            migrated_from: 'enrollments_table',
          },
          file_url: fileUrl,
        })

        results.migrated++
        console.log(`Migrated certificate for enrollment ${enrollment.id}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(
          `Failed to migrate certificate for enrollment ${enrollment.id}: ${errorMessage}`,
        )
        console.error(`Failed to migrate certificate for enrollment ${enrollment.id}:`, error)
      }
    }

    console.log(
      `Migration completed: ${results.migrated} migrated, ${results.skipped} skipped, ${results.errors.length} errors`,
    )
    return results
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    results.errors.push(`Migration failed: ${errorMessage}`)
    console.error('Certificate migration failed:', error)
    return results
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

  // Check if certificate already exists in certificates table
  const existingCertificate = await getCertificatesFromTable({
    student_id: enrollment.student_id,
    course_id: enrollment.course_id,
    is_active: true,
  })

  if (existingCertificate.length > 0) {
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

  // Create certificate in the certificates table
  const certificate = await createCertificate({
    student_id: enrollment.student_id,
    course_id: enrollment.course_id,
    template_id: templateId,
    teacher_id: null, // Could be enhanced to include teacher ID
    title: `Certificate of Completion - ${enrollment.courses?.title || 'Course'}`,
    completion_date: enrollment.completed_at || new Date().toISOString(),
    certificate_data: {
      student_name: enrollment.profiles?.full_name || 'Student',
      course_title: enrollment.courses?.title || 'Course',
      completion_date: enrollment.completed_at || new Date().toISOString(),
      enrollment_id: enrollmentId, // Keep reference to original enrollment
    },
  })

  return certificate
}

export async function issueCertificateWithTemplate(
  enrollmentId: string,
  templateId: string,
): Promise<Certificate> {
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

  // Check if certificate already exists in certificates table
  const existingCertificate = await getCertificatesFromTable({
    student_id: enrollment.student_id,
    course_id: enrollment.course_id,
    is_active: true,
  })

  if (existingCertificate.length > 0) {
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

  // Create certificate in the certificates table
  const certificate = await createCertificate({
    student_id: enrollment.student_id,
    course_id: enrollment.course_id,
    template_id: templateId,
    teacher_id: null, // Could be enhanced to include teacher ID
    title: `Certificate of Completion - ${enrollment.courses?.title || 'Course'}`,
    completion_date: enrollment.completed_at || new Date().toISOString(),
    certificate_data: {
      student_name: enrollment.profiles?.full_name || 'Student',
      course_title: enrollment.courses?.title || 'Course',
      completion_date: enrollment.completed_at || new Date().toISOString(),
      enrollment_id: enrollmentId, // Keep reference to original enrollment
    },
  })

  return certificate
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
