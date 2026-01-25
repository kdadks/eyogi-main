import { supabaseAdmin } from '../supabase'
import { Certificate, CertificateTemplate } from '@/types'
import { generateCertificatePDF, CertificateData } from '../pdf/certificateGenerator'
import { decryptProfileFields, decryptField } from '../encryption'
import { deleteFromSupabaseStorage, bulkDeleteFromSupabaseStorage } from '../supabase-storage'
import { sendEmailViaAPI } from '../email-service'

/**
 * Send certificate issued email notification to parent
 * Uses the centralized email service
 */
async function sendCertificateEmailNotification(
  studentName: string,
  courseName: string,
  certificateUrl: string,
  parentEmail?: string | null,
): Promise<void> {
  try {
    if (!parentEmail) {
      console.log('No parent email available, skipping certificate notification')
      return
    }

    const htmlBody = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>Certificate Issued</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td, a {font-family: Arial, sans-serif !important;}
        </style>
        <![endif]-->
      </head>
      <body style="background-color: #f5f5f5; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 10px;">
              <!--[if mso]>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
              <tr>
              <td>
              <![endif]-->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff;">
                <!-- Logo -->
                <tr>
                  <td align="center" style="padding: 30px 20px 20px 20px;">
                    <img src="https://eyogigurukul.com/ssh-app/Images/SSH_Logo.png" width="180" height="auto" alt="eYogi Gurukul" style="display: block; border: 0; max-width: 100%; height: auto;" />
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 20px 40px 40px 40px;">
                    <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">🎓 Certificate Issued</h2>
                    <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Dear Parent/Guardian,</p>
                    <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                      We are pleased to inform you that <strong>${studentName}</strong> has been issued a certificate for successfully completing the course:
                    </p>
                    
                    <!-- Course Info Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                      <tr>
                        <td style="padding: 15px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                          <p style="margin: 0; padding: 0; font-size: 18px; color: #2c5f2d; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.4;">${courseName}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0; padding: 15px 0 25px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                      You can view and download the certificate using the button below:
                    </p>
                    
                    <!-- Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${certificateUrl}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="13%" strokecolor="#2c5f2d" fillcolor="#2c5f2d">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">View Certificate</center>
                          </v:roundrect>
                          <![endif]-->
                          <![if !mso]>
                          <a href="${certificateUrl}" target="_blank" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; border: 2px solid #2c5f2d;">View Certificate</a>
                          <![endif]>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0; padding: 25px 0 15px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; word-break: break-all;">
                          <p style="margin: 0; padding: 0; font-size: 13px; color: #666666; font-family: Arial, Helvetica, sans-serif; line-height: 19px;">
                            <a href="${certificateUrl}" target="_blank" style="color: #2c5f2d; text-decoration: underline; word-break: break-all;">${certificateUrl}</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0; padding: 25px 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                      This certificate is a testament to ${studentName}'s dedication and hard work. Please feel free to download and share it.
                    </p>
                    
                    <p style="margin: 0; padding: 25px 0 10px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                      For help, contact us at
                      <a href="mailto:office@eyogigurukul.com" style="color: #2c5f2d; text-decoration: underline;">office@eyogigurukul.com</a>
                    </p>
                    <p style="margin: 0; padding: 20px 0 0 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">&mdash; Team eYogi Gurukul</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; padding: 0; text-align: center; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif; line-height: 18px;">
                      This is an automated notification from eYogi Gurukul.<br />
                      Please do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
              <!--[if mso]>
              </td>
              </tr>
              </table>
              <![endif]-->
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    const emailSent = await sendEmailViaAPI({
      to: parentEmail,
      subject: `Certificate Issued - ${courseName}`,
      htmlBody,
    })

    if (emailSent) {
      console.log('Certificate email notification sent successfully to:', parentEmail)
    } else {
      console.warn('Failed to send certificate email to:', parentEmail)
    }
  } catch (error) {
    console.error('Error sending certificate email notification:', error)
    // Don't throw - email failure shouldn't prevent certificate issuance
  }
}

// NEW: Functions for working with the certificates table

/**
 * Generate and upload certificate PDF to Supabase storage
 * Returns the public URL of the uploaded PDF
 */
export async function generateAndUploadCertificatePDF(
  certificateNumber: string,
  certificateData: CertificateData,
  template?: CertificateTemplate,
): Promise<string> {
  try {
    // Generate the PDF blob
    const pdfBlob = await generateCertificatePDF(certificateData, template)

    // Create a File object from the blob
    const fileName = `${certificateNumber}.pdf`
    const filePath = fileName // Just the file name, not with bucket prefix
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

    // Upload to Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from('certificates')
      .upload(filePath, file, {
        cacheControl: '0', // No caching to ensure regenerated certificates are fetched fresh
        upsert: true, // Allow overwriting if certificate is regenerated
      })

    if (error) {
      throw new Error(`PDF upload failed: ${error.message}`)
    }

    // Get public URL with cache-busting timestamp
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('certificates')
      .getPublicUrl(data.path)

    // Add cache-busting parameter to force fresh fetch after regeneration
    const urlWithCacheBust = `${publicUrlData.publicUrl}?t=${Date.now()}`
    return urlWithCacheBust
  } catch (error) {
    console.error('Error generating/uploading certificate PDF:', error)
    throw error
  }
}

/**
 * Download or generate certificate PDF
 * If the certificate URL doesn't work, generates PDF on-demand
 */
export async function downloadCertificatePDF(
  certificate: Certificate,
  template?: CertificateTemplate,
): Promise<Blob> {
  try {
    // First, try to fetch the existing PDF from storage URL
    if (certificate.file_url) {
      console.log('Attempting to download certificate from URL:', certificate.file_url)
      try {
        const response = await fetch(certificate.file_url)
        if (response.ok) {
          console.log('Successfully downloaded certificate PDF')
          return await response.blob()
        } else {
          console.warn('Certificate URL returned status:', response.status)
        }
      } catch (fetchError) {
        console.warn(
          'Failed to download certificate from URL, will generate on-demand:',
          fetchError,
        )
      }
    }

    // Fallback: Generate PDF on-demand
    console.log('Generating certificate PDF on-demand')
    const certData = certificate.certificate_data as any
    const certificateData: CertificateData = {
      studentName: certData?.student_name || certificate.student?.full_name || 'Student',
      studentId: certificate.student?.student_id || certificate.student_id, // Use human-readable student_id from profile
      courseName: certData?.course_title || certificate.course?.title || 'Course',
      courseId: certificate.course?.course_number || certificate.course_id, // Use course_number instead of UUID
      gurukulName: 'eYogi Gurukul',
      completionDate:
        certData?.completion_date || certificate.completion_date || new Date().toISOString(),
      certificateNumber: certificate.certificate_number,
      verificationCode: certificate.verification_code || '',
    }

    const pdfBlob = await generateCertificatePDF(certificateData, template)
    console.log('Successfully generated certificate PDF on-demand')
    return pdfBlob
  } catch (error) {
    console.error('Error downloading/generating certificate PDF:', error)
    throw new Error('Failed to download certificate. Please try again.')
  }
}

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
      console.error('Error creating certificate:', { error, certificateData })
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

    // Transform data to match interface and decrypt profiles
    return (data || []).map((cert) => ({
      ...cert,
      issued_at: cert.issue_date, // Alias for backward compatibility
      issued_by: cert.teacher_id || 'system', // For backward compatibility
      course: cert.courses,
      student: cert.student ? decryptProfileFields(cert.student) : cert.student,
      teacher: cert.teacher ? decryptProfileFields(cert.teacher) : cert.teacher,
    })) as Certificate[]
  } catch (error) {
    console.error('Error fetching certificates from table:', error)
    return []
  }
}

/**
 * Get certificate lookup map for fast checking - returns only essential IDs
 * This is much faster than fetching full certificate objects when you just need to check existence
 */
export async function getCertificateLookupMap(): Promise<Map<string, Set<string>>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('student_id, course_id')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching certificate lookup:', error)
      return new Map()
    }

    // Build a map for O(1) lookup: student_id -> Set<course_id>
    const lookupMap = new Map<string, Set<string>>()
    for (const cert of data || []) {
      if (!lookupMap.has(cert.student_id)) {
        lookupMap.set(cert.student_id, new Set())
      }
      lookupMap.get(cert.student_id)!.add(cert.course_id)
    }
    return lookupMap
  } catch (error) {
    console.error('Error building certificate lookup map:', error)
    return new Map()
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
      certificatesFromTable.map((c) => ({
        id: c.id,
        studentId: c.student_id,
        courseId: c.course_id,
        title: c.title,
        isActive: c.is_active,
      })),
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
  // Get enrollment details with parent email (via parent_id relationship)
  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('enrollments')
    .select(
      `
        *,
        courses (*),
        profiles!enrollments_student_id_fkey (
          *,
          parent:profiles!profiles_parent_id_fkey(email, full_name)
        )
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

  // Fetch teacher from course_assignments
  let teacherId = null
  const { data: courseAssignment } = await supabaseAdmin
    .from('course_assignments')
    .select('teacher_id')
    .eq('course_id', enrollment.course_id)
    .eq('is_active', true)
    .maybeSingle()

  if (courseAssignment) {
    teacherId = courseAssignment.teacher_id
  }

  // Create certificate in the certificates table
  const certificate = await createCertificate({
    student_id: enrollment.student_id,
    course_id: enrollment.course_id,
    template_id: templateId,
    teacher_id: teacherId, // Use the teacher ID from course assignment
    title: `Certificate of Completion - ${enrollment.courses?.title || 'Course'}`,
    completion_date: enrollment.completed_at || new Date().toISOString(),
    certificate_data: {
      student_name: enrollment.profiles?.full_name || 'Student',
      course_title: enrollment.courses?.title || 'Course',
      completion_date: enrollment.completed_at || new Date().toISOString(),
      enrollment_id: enrollmentId, // Keep reference to original enrollment
    },
  })

  // Generate and upload PDF after certificate is created
  try {
    const { data: template } = await supabaseAdmin
      .from('certificate_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    const certificateData: CertificateData = {
      studentName: enrollment.profiles?.full_name || 'Student',
      studentId: enrollment.profiles?.student_id || enrollment.student_id, // Use human-readable student_id from profile
      courseName: enrollment.courses?.title || 'Course',
      courseId: enrollment.courses?.course_number || enrollment.course_id, // Use course_number instead of UUID
      gurukulName: 'eYogi Gurukul',
      completionDate: enrollment.completed_at || new Date().toISOString(),
      certificateNumber: certificate.certificate_number,
      verificationCode: certificate.verification_code || '',
    }

    const pdfUrl = await generateAndUploadCertificatePDF(
      certificate.certificate_number,
      certificateData,
      template as CertificateTemplate,
    )

    // Update certificate with the PDF URL
    const { data: updatedCert, error: updateError } = await supabaseAdmin
      .from('certificates')
      .update({ file_url: pdfUrl })
      .eq('id', certificate.id)
      .select(
        `
        *,
        courses(*),
        student:profiles!certificates_student_id_fkey(*),
        teacher:profiles!certificates_teacher_id_fkey(*)
      `,
      )
      .single()

    if (updateError) {
      console.error('Error updating certificate with PDF URL:', updateError)
      return certificate
    }

    // Send email notification to parent if available, otherwise to student
    const recipientEmail = enrollment.profiles?.parent?.email || enrollment.profiles?.email

    // Decrypt the recipient email since profiles table stores encrypted emails
    const decryptedRecipientEmail = recipientEmail ? decryptField(recipientEmail) : null

    if (decryptedRecipientEmail) {
      await sendCertificateEmailNotification(
        enrollment.profiles?.full_name || 'Student',
        enrollment.courses?.title || 'Course',
        pdfUrl,
        decryptedRecipientEmail,
      )
    }

    return {
      ...updatedCert,
      issued_at: updatedCert.issue_date,
      issued_by: updatedCert.teacher_id || 'system',
      course: updatedCert.courses,
      student: updatedCert.student,
      teacher: updatedCert.teacher,
    } as Certificate
  } catch (pdfError) {
    console.error('Error generating/uploading PDF:', pdfError)
    return certificate
  }
}

export async function issueCertificateWithTemplate(
  enrollmentId: string,
  templateId: string,
  forceReissue = false,
): Promise<Certificate> {
  console.log('issueCertificateWithTemplate called with:', {
    enrollmentId,
    templateId,
    forceReissue,
  })

  // First, get the basic enrollment data
  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .single()

  if (enrollmentError || !enrollment) {
    console.error('Enrollment not found:', { enrollmentId, enrollmentError })
    console.error('Full enrollment error details:', JSON.stringify(enrollmentError, null, 2))
    throw new Error(`Enrollment not found: ${enrollmentError?.message || 'Unknown error'}`)
  }

  // Fetch course data separately
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', enrollment.course_id)
    .single()

  // Fetch teacher from course_assignments
  let teacherId = null
  const { data: courseAssignment } = await supabaseAdmin
    .from('course_assignments')
    .select('teacher_id')
    .eq('course_id', enrollment.course_id)
    .eq('is_active', true)
    .maybeSingle()

  if (courseAssignment) {
    teacherId = courseAssignment.teacher_id
  }

  // Fetch student profile separately
  const { data: studentProfile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', enrollment.student_id)
    .single()

  // Fetch parent profile if exists
  let parentProfile = null
  if (studentProfile?.parent_id) {
    const { data: parent } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', studentProfile.parent_id)
      .single()
    parentProfile = parent
  }

  // Decrypt student name and parent info before using them
  const decryptedStudentName = decryptField(studentProfile?.full_name) || 'Student'
  const decryptedParentName = parentProfile?.full_name
    ? decryptField(parentProfile.full_name)
    : null
  const decryptedParentEmail = parentProfile?.email ? decryptField(parentProfile.email) : null

  // Combine data in the format expected by the rest of the function
  const enrichedEnrollment = {
    ...enrollment,
    courses: course,
    profiles: {
      ...studentProfile,
      full_name: decryptedStudentName, // Use decrypted name
      parent: parentProfile
        ? {
            ...parentProfile,
            full_name: decryptedParentName,
            email: decryptedParentEmail, // Use decrypted email for notifications
          }
        : null,
    },
  }

  if (enrichedEnrollment.status !== 'completed') {
    console.error('Enrollment status is not completed:', { status: enrichedEnrollment.status })
    throw new Error('Can only issue certificates for completed courses')
  }

  // Check if certificate already exists in certificates table (skip if forcing re-issue)
  if (!forceReissue) {
    const existingCertificate = await getCertificatesFromTable({
      student_id: enrichedEnrollment.student_id,
      course_id: enrichedEnrollment.course_id,
      is_active: true,
    })

    if (existingCertificate.length > 0) {
      const error = new Error('CERTIFICATE_ALREADY_ISSUED')
      error.name = 'CertificateAlreadyIssued'
      throw error
    }
  } else {
    // When forcing re-issue, fetch existing certificates and delete their PDFs from storage
    const { data: existingCertificates, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select('id, file_url')
      .eq('student_id', enrichedEnrollment.student_id)
      .eq('course_id', enrichedEnrollment.course_id)
      .eq('is_active', true)

    console.log('Force reissue: checking for existing certificates', {
      student_id: enrichedEnrollment.student_id,
      course_id: enrichedEnrollment.course_id,
      existingCount: existingCertificates?.length || 0,
      fetchError,
    })

    if (!fetchError && existingCertificates && existingCertificates.length > 0) {
      // Delete PDFs from storage for all existing active certificates
      for (const cert of existingCertificates) {
        console.log('Processing certificate for deletion:', {
          id: cert.id,
          has_file_url: !!cert.file_url,
          file_url: cert.file_url,
        })

        if (cert.file_url) {
          try {
            console.log('Deleting inactive certificate PDF from storage:', cert.id, cert.file_url)
            const deleted = await deleteFromSupabaseStorage(cert.file_url)
            console.log(`Delete result for ${cert.id}:`, deleted)
            if (!deleted) {
              console.warn(`Failed to delete PDF for certificate ${cert.id}, but continuing`)
            }
          } catch (error) {
            console.warn(`Error deleting certificate PDF for ${cert.id}:`, error)
            // Continue with deactivation even if PDF deletion fails
          }
        } else {
          console.warn(
            `Certificate ${cert.id} has no file_url, skipping storage deletion but will deactivate in DB`,
          )
        }
      }
    } else {
      console.log('No existing certificates found to delete')
    }

    // Deactivate existing certificates after deleting their PDFs
    const { error: deactivateError } = await supabaseAdmin
      .from('certificates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('student_id', enrichedEnrollment.student_id)
      .eq('course_id', enrichedEnrollment.course_id)
      .eq('is_active', true)

    if (deactivateError) {
      console.warn('Error deactivating certificates:', deactivateError)
    } else {
      console.log('Successfully deactivated existing certificates')
    }
  }

  // Get the certificate template
  const { data: template, error: templateError } = await supabaseAdmin
    .from('certificate_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (templateError || !template) {
    console.error('Certificate template not found:', { templateId, templateError })
    throw new Error('Certificate template not found')
  }

  // Create certificate in the certificates table (without file_url initially)
  const certificate = await createCertificate({
    student_id: enrichedEnrollment.student_id,
    course_id: enrichedEnrollment.course_id,
    template_id: templateId,
    teacher_id: teacherId, // Use the teacher ID from course assignment
    title: `Certificate of Completion - ${enrichedEnrollment.courses?.title || 'Course'}`,
    completion_date: enrichedEnrollment.completed_at || new Date().toISOString(),
    certificate_data: {
      student_name: enrichedEnrollment.profiles?.full_name || 'Student',
      course_title: enrichedEnrollment.courses?.title || 'Course',
      completion_date: enrichedEnrollment.completed_at || new Date().toISOString(),
      enrollment_id: enrollmentId, // Keep reference to original enrollment
    },
  })

  // Generate and upload PDF after certificate is created
  try {
    const certificateData: CertificateData = {
      studentName: enrichedEnrollment.profiles?.full_name || 'Student',
      studentId: enrichedEnrollment.profiles?.student_id || enrichedEnrollment.student_id, // Use human-readable student_id from profile
      courseName: enrichedEnrollment.courses?.title || 'Course',
      courseId: enrichedEnrollment.courses?.course_number || enrichedEnrollment.course_id, // Use course_number instead of UUID
      gurukulName: 'eYogi Gurukul',
      completionDate: enrichedEnrollment.completed_at || new Date().toISOString(),
      certificateNumber: certificate.certificate_number,
      verificationCode: certificate.verification_code || '',
    }

    const pdfUrl = await generateAndUploadCertificatePDF(
      certificate.certificate_number,
      certificateData,
      template as CertificateTemplate,
    )

    // Update certificate with the PDF URL
    const { data: updatedCert, error: updateError } = await supabaseAdmin
      .from('certificates')
      .update({ file_url: pdfUrl })
      .eq('id', certificate.id)
      .select(
        `
        *,
        courses(*),
        student:profiles!certificates_student_id_fkey(*),
        teacher:profiles!certificates_teacher_id_fkey(*)
      `,
      )
      .single()

    if (updateError) {
      console.error('Error updating certificate with PDF URL:', updateError)
      // Still return the certificate even if PDF upload failed
      return certificate
    }

    // Send email notification to parent if available, otherwise to student
    const recipientEmail =
      enrichedEnrollment.profiles?.parent?.email || enrichedEnrollment.profiles?.email

    console.log('Certificate email notification check:', {
      studentId: enrichedEnrollment.student_id,
      hasParentId: !!studentProfile?.parent_id,
      parentId: studentProfile?.parent_id,
      hasParentEmail: !!enrichedEnrollment.profiles?.parent?.email,
      parentEmail: enrichedEnrollment.profiles?.parent?.email,
      studentEmail: enrichedEnrollment.profiles?.email,
      recipientEmail,
    })

    if (recipientEmail) {
      await sendCertificateEmailNotification(
        enrichedEnrollment.profiles?.full_name || 'Student',
        enrichedEnrollment.courses?.title || 'Course',
        pdfUrl,
        recipientEmail,
      )
    } else {
      console.warn('No recipient email found for certificate notification', {
        studentId: enrichedEnrollment.student_id,
        courseId: enrichedEnrollment.course_id,
      })
    }

    return {
      ...updatedCert,
      issued_at: updatedCert.issue_date,
      issued_by: updatedCert.teacher_id || 'system',
      course: updatedCert.courses,
      student: updatedCert.student,
      teacher: updatedCert.teacher,
    } as Certificate
  } catch (pdfError) {
    console.error('Error generating/uploading PDF:', pdfError)
    // Still return the certificate even if PDF generation failed
    // The PDF can be generated on-demand when the student tries to view it
    return certificate
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
  forceReissue = false,
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
      .select(
        `
        *,
        batch_courses!inner (
          course:courses (
            id,
            title
          )
        )
      `,
      )
      .eq('id', batchId)
      .single()

    if (batchError || !batchDetails) {
      throw new Error('Failed to fetch batch details')
    }

    // Get the course_id from batch_courses
    const courseId = (batchDetails as any).batch_courses?.[0]?.course?.id
    if (!courseId) {
      throw new Error('No course associated with this batch')
    }

    // For each student, check if they have a completed enrollment and issue certificate
    const certificatePromises = batchStudents.map(async (batchStudent) => {
      try {
        // Get student name from the student profile
        const studentName = (batchStudent as any).student?.full_name || 'Unknown Student'

        // Check if enrollment exists for this student
        const { data: existingEnrollment, error: enrollmentError } = await supabaseAdmin
          .from('enrollments')
          .select('*')
          .eq('student_id', batchStudent.student_id)
          .eq('course_id', courseId)
          .maybeSingle()

        if (!existingEnrollment) {
          // Student is in batch but not enrolled in the course
          throw new Error(
            `Student "${studentName}" is not enrolled in the course. Please enroll the student first before issuing certificates.`,
          )
        }

        // Check if enrollment is completed
        if (existingEnrollment.status !== 'completed') {
          throw new Error(
            `Student "${studentName}" has not completed the course (status: ${existingEnrollment.status}). Only completed enrollments can receive certificates.`,
          )
        }

        // If forceReissue is true, delete existing certificate first
        if (forceReissue) {
          await supabaseAdmin
            .from('certificates')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('student_id', batchStudent.student_id)
            .eq('course_id', courseId)
            .eq('is_active', true)
        }

        // Issue certificate
        if (templateId) {
          await issueCertificateWithTemplate(existingEnrollment.id, templateId, forceReissue)
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

/**
 * Regenerate certificate PDF with the latest template
 */
export async function regenerateCertificate(certificateId: string): Promise<Certificate> {
  // Get certificate details with all relations
  const { data: certificate, error: certError } = await supabaseAdmin
    .from('certificates')
    .select(
      `
      *,
      courses(*),
      student:profiles!certificates_student_id_fkey(*),
      teacher:profiles!certificates_teacher_id_fkey(*)
    `,
    )
    .eq('id', certificateId)
    .single()

  if (certError || !certificate) {
    console.error('Certificate not found:', { certificateId, certError })
    throw new Error('Certificate not found')
  }

  // Get the template
  const { data: template, error: templateError } = await supabaseAdmin
    .from('certificate_templates')
    .select('*')
    .eq('id', certificate.template_id)
    .single()

  if (templateError || !template) {
    console.error('Certificate template not found:', {
      templateId: certificate.template_id,
      templateError,
    })
    throw new Error('Certificate template not found')
  }

  // Generate and upload new PDF
  try {
    // Decrypt student name if encrypted
    const decryptedStudentName = certificate.student?.full_name
      ? decryptField(certificate.student.full_name) || 'Student'
      : 'Student'

    const certificateData: CertificateData = {
      studentName: decryptedStudentName,
      studentId: certificate.student?.student_id || certificate.student_id, // Use human-readable student_id from profile, fallback to UUID
      courseName: certificate.courses?.title || 'Course',
      courseId: certificate.courses?.course_number || certificate.course_id, // Use course_number instead of UUID
      gurukulName: certificate.courses?.gurukul?.name || 'eYogi Gurukul',
      completionDate: certificate.completion_date || new Date().toISOString(),
      certificateNumber: certificate.certificate_number,
      verificationCode: certificate.verification_code || '',
    }

    const pdfUrl = await generateAndUploadCertificatePDF(
      certificate.certificate_number,
      certificateData,
      template as CertificateTemplate,
    )

    // Update certificate with the new PDF URL
    const { data: updatedCert, error: updateError } = await supabaseAdmin
      .from('certificates')
      .update({
        file_url: pdfUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificate.id)
      .select(
        `
        *,
        courses(*),
        student:profiles!certificates_student_id_fkey(*),
        teacher:profiles!certificates_teacher_id_fkey(*)
      `,
      )
      .single()

    if (updateError) {
      console.error('Error updating certificate with new PDF URL:', updateError)
      throw new Error('Failed to update certificate')
    }

    return {
      ...updatedCert,
      issued_at: updatedCert.issue_date,
      issued_by: updatedCert.teacher_id || 'system',
      course: updatedCert.courses,
      student: updatedCert.student,
      teacher: updatedCert.teacher,
    } as Certificate
  } catch (pdfError) {
    console.error('Error regenerating certificate PDF:', pdfError)
    throw new Error('Failed to regenerate certificate PDF')
  }
}

/**
 * Delete a single certificate and its associated PDF from storage
 */
export async function deleteCertificate(certificateId: string): Promise<void> {
  try {
    // First, get the certificate to retrieve the file URL for cleanup
    const { data: certificate, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select('id, file_url, certificate_number')
      .eq('id', certificateId)
      .single()

    if (fetchError) {
      console.error('Error fetching certificate for deletion:', fetchError)
      throw new Error(`Failed to fetch certificate: ${fetchError.message}`)
    }

    if (!certificate) {
      throw new Error('Certificate not found')
    }

    // Delete the PDF from certificates bucket if it exists
    if (certificate.file_url) {
      console.log(
        'Deleting certificate PDF from certificates bucket:',
        certificate.certificate_number,
      )
      const deleted = await deleteFromSupabaseStorage(certificate.file_url)
      if (!deleted) {
        console.warn(
          'Failed to delete certificate PDF from storage, but continuing with database deletion',
        )
      }
    }

    // Delete the certificate from database
    const { error: deleteError } = await supabaseAdmin
      .from('certificates')
      .delete()
      .eq('id', certificateId)

    if (deleteError) {
      console.error('Error deleting certificate from database:', deleteError)
      throw new Error(`Failed to delete certificate: ${deleteError.message}`)
    }

    console.log('Successfully deleted certificate:', certificate.certificate_number)
  } catch (error) {
    console.error('Error deleting certificate:', error)
    throw error
  }
}

/**
 * Bulk delete certificates and their associated PDFs from storage
 */
export async function bulkDeleteCertificates(certificateIds: string[]): Promise<void> {
  try {
    // First, get all certificates to retrieve file URLs for cleanup
    const { data: certificates, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select('id, file_url, certificate_number')
      .in('id', certificateIds)

    if (fetchError) {
      console.error('Error fetching certificates for bulk deletion:', fetchError)
      throw new Error(`Failed to fetch certificates: ${fetchError.message}`)
    }

    if (!certificates || certificates.length === 0) {
      throw new Error('No certificates found for deletion')
    }

    // Delete all PDFs from certificates bucket
    const fileUrls = certificates.filter((cert) => cert.file_url).map((cert) => cert.file_url)

    if (fileUrls.length > 0) {
      console.log(`Deleting ${fileUrls.length} certificate PDFs from certificates bucket`)
      const storageResult = await bulkDeleteFromSupabaseStorage(fileUrls)
      if (storageResult.failed.length > 0) {
        console.warn(
          `Failed to delete ${storageResult.failed.length} certificate PDFs from storage, but continuing with database deletion`,
        )
      }
    }

    // Delete all certificates from database
    const { error: deleteError } = await supabaseAdmin
      .from('certificates')
      .delete()
      .in('id', certificateIds)

    if (deleteError) {
      console.error('Error bulk deleting certificates:', deleteError)
      throw new Error(`Failed to delete certificates: ${deleteError.message}`)
    }

    console.log(`Successfully deleted ${certificates.length} certificates`)
  } catch (error) {
    console.error('Error bulk deleting certificates:', error)
    throw error
  }
}

/**
 * Clean up inactive certificates by deleting their stored files from storage
 * This ensures only active certificates have PDFs in the storage bucket
 */
export async function cleanupInactiveCertificates(): Promise<{
  count: number
  deleted: number
  failed: string[]
}> {
  try {
    // Get all inactive certificates with stored files
    const { data: inactiveCerts, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select('id, file_url, certificate_number')
      .eq('is_active', false)
      .not('file_url', 'is', null)

    if (fetchError) {
      console.error('Error fetching inactive certificates:', fetchError)
      throw new Error(`Failed to fetch inactive certificates: ${fetchError.message}`)
    }

    if (!inactiveCerts || inactiveCerts.length === 0) {
      console.log('No inactive certificates with stored files found')
      return { count: 0, deleted: 0, failed: [] }
    }

    const result = {
      count: inactiveCerts.length,
      deleted: 0,
      failed: [] as string[],
    }

    console.log(`Found ${inactiveCerts.length} inactive certificates with stored files`)

    // Delete files for all inactive certificates
    for (const cert of inactiveCerts) {
      if (cert.file_url) {
        const deleted = await deleteFromSupabaseStorage(cert.file_url)

        if (deleted) {
          result.deleted++
          console.log(`✅ Deleted file for inactive certificate: ${cert.certificate_number}`)
        } else {
          result.failed.push(cert.certificate_number)
          console.log(
            `❌ Failed to delete file for inactive certificate: ${cert.certificate_number}`,
          )
        }
      }
    }

    return result
  } catch (error) {
    console.error('Error cleaning up inactive certificates:', error)
    throw error
  }
}
