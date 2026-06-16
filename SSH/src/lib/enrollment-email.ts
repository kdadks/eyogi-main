import { supabaseAdmin } from './supabase'
import { decryptField } from './encryption'
import { sendEmailViaAPI } from './email-service'

/**
 * Send enrollment submission confirmation email
 */
export async function sendEnrollmentSubmissionEmail(enrollmentId: string): Promise<boolean> {
  try {
    // Get enrollment details with student and course info
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select(
        `
        id,
        student_id,
        course_id,
        status,
        student:student_id (email, full_name, role),
        course:course_id (title, description)
      `,
      )
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError || !enrollment) {
      console.error('Failed to fetch enrollment details:', enrollmentError)
      return false
    }

    const student = enrollment.student as unknown as {
      email: string
      full_name: string
      role: number
    } | null
    const course = enrollment.course as unknown as { title: string; description?: string } | null

    if (!student?.email || !course?.title) {
      console.error('Missing required enrollment data')
      return false
    }

    // Decrypt student name
    const decryptedFullName = decryptField(student.full_name) || 'Student'

    // Generate email HTML
    const emailHTML = generateEnrollmentSubmissionHTML(decryptedFullName, course.title)

    // Send enrollment submission confirmation email
    const emailSent = await sendEmailViaAPI({
      to: student.email,
      subject: 'Enrollment Request Received',
      htmlBody: emailHTML,
    })

    if (!emailSent) {
      console.error('Failed to send enrollment submission email to:', student.email)
    }

    return emailSent
  } catch (error) {
    console.error('Error sending enrollment submission email:', error)
    return false
  }
}

/**
 * Send enrollment approval/rejection notification email
 */
export async function sendEnrollmentStatusEmail(
  enrollmentId: string,
  status: 'approved' | 'rejected',
): Promise<boolean> {
  try {
    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id, student_id, course_id, status')
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError || !enrollment) {
      console.error('Failed to fetch enrollment details:', enrollmentError)
      return false
    }

    // Get student details separately
    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, role, parent_id')
      .eq('id', enrollment.student_id)
      .single()

    if (studentError || !student) {
      console.error('Failed to fetch student details:', studentError)
      return false
    }

    // Get course details separately
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('title, description')
      .eq('id', enrollment.course_id)
      .single()

    if (courseError || !course) {
      console.error('Failed to fetch course details:', courseError)
      return false
    }

    // Decrypt student name
    const decryptedFullName = decryptField(student.full_name) || 'Student'

    // Check if student has a parent - if so, send email to parent instead
    let recipientEmail = student.email
    let recipientName = decryptedFullName

    if (student.parent_id) {
      // This is a parent-initiated enrollment, send email to parent
      const { data: parent, error: parentError } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', student.parent_id)
        .single()

      if (!parentError && parent) {
        recipientEmail = parent.email
        recipientName = decryptField(parent.full_name) || 'Parent'
      }
    }

    // Generate appropriate email HTML based on status
    const emailHTML =
      status === 'approved'
        ? generateEnrollmentApprovalHTML(
            recipientName,
            course.title,
            course.description,
            decryptedFullName,
            student.parent_id ? true : false,
          )
        : generateEnrollmentRejectionHTML(
            recipientName,
            course.title,
            decryptedFullName,
            student.parent_id ? true : false,
          )

    const emailSubject =
      status === 'approved'
        ? student.parent_id
          ? `Enrollment Approved: ${decryptedFullName} - ${course.title}`
          : 'Enrollment Approved!'
        : student.parent_id
          ? `Enrollment Status: ${decryptedFullName} - ${course.title}`
          : 'Enrollment Status Update'

    // Send enrollment status email
    const emailSent = await sendEmailViaAPI({
      to: recipientEmail,
      subject: emailSubject,
      htmlBody: emailHTML,
    })

    if (!emailSent) {
      console.error(`Failed to send enrollment ${status} email to:`, recipientEmail)
    }

    return emailSent
  } catch (error) {
    console.error('Error sending enrollment status email:', error)
    return false
  }
}

/**
 * Generate HTML template for enrollment submission confirmation
 */
function generateEnrollmentSubmissionHTML(studentName: string, courseTitle: string): string {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Enrollment Request Received</title>
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
              <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">📚 Enrollment Request Received</h2>
              <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Dear <strong>${studentName}</strong>,</p>
              <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Thank you for your interest in enrolling in <strong>${courseTitle}</strong>. We have successfully received your enrollment request.
              </p>
              
              <!-- Status Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td style="padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
                    <h3 style="margin: 0; padding: 0 0 10px 0; font-size: 18px; color: #856404; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">⏳ Under Review</h3>
                    <p style="margin: 0; font-size: 15px; color: #856404; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                      Your enrollment request is currently being reviewed by our Gurukul team. We will notify you once a decision has been made.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- What Happens Next -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td style="padding: 15px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                    <h3 style="margin: 0; padding: 0 0 10px 0; font-size: 18px; color: #2c5f2d; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">What Happens Next?</h3>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 4px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">• Our team will review your enrollment request</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">• You will receive an email notification with the decision</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">• If approved, you'll get immediate access to the course</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">• If you have questions, feel free to contact our support team</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
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
  `.trim()
}

/**
 * Generate HTML template for enrollment approval
 */
function generateEnrollmentApprovalHTML(
  recipientName: string,
  courseTitle: string,
  courseDescription?: string,
  studentName?: string,
  isParentEmail?: boolean,
): string {
  const greeting = isParentEmail ? recipientName.split(' ')[0] : recipientName
  const enrollmentMessage = isParentEmail
    ? `Great news! ${studentName}'s enrollment in <strong>${courseTitle}</strong> has been approved by our admin team.`
    : `Great news! Your enrollment in <strong>${courseTitle}</strong> has been approved.`
  const nextStepsMessage = isParentEmail
    ? `${studentName} can now access the course materials and begin learning. You can track their progress through your parent dashboard.`
    : 'You can now access the course materials and begin your learning journey.'

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>Enrollment Approved</title>
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
                  <img src="https://eyogigurukul.com/ssh-app/Images/SSH_Logo.png" width="180" height="auto" alt="SSH University Logo" style="display: block; border: 0; max-width: 100%; height: auto;" />
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">🎉 Enrollment Approved!</h2>
                  <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Dear <strong>${greeting}</strong>,</p>
                  <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    ${enrollmentMessage}
                  </p>
                  
                  ${
                    courseDescription
                      ? `
                  <!-- Course Info Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                    <tr>
                      <td style="padding: 15px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                        <p style="margin: 0; padding: 0 0 10px 0; font-size: 18px; color: #2c5f2d; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">About This Course</p>
                        <p style="margin: 0; padding: 0; font-size: 15px; color: #333333; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">
                          ${courseDescription}
                        </p>
                      </td>
                    </tr>
                  </table>
                  `
                      : ''
                  }
                  
                  <p style="margin: 0; padding: 15px 0 25px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    ${nextStepsMessage}
                  </p>
                  
                  <!-- Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://eyogigurukul.com/ssh-app" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="13%" strokecolor="#2c5f2d" fillcolor="#2c5f2d">
                          <w:anchorlock/>
                          <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">${isParentEmail ? 'View Dashboard' : 'Start Learning Now'}</center>
                        </v:roundrect>
                        <![endif]-->
                        <![if !mso]>
                        <a href="https://eyogigurukul.com/ssh-app" target="_blank" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; border: 2px solid #2c5f2d;">${isParentEmail ? 'View Dashboard' : 'Start Learning Now'}</a>
                        <![endif]>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Getting Started -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                    <tr>
                      <td style="padding: 20px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                        <p style="margin: 0; padding: 0 0 15px 0; font-size: 18px; color: #2c5f2d; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">${isParentEmail ? 'What Happens Next' : 'Getting Started'}</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          ${
                            isParentEmail
                              ? `<tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; ${studentName} can access the course from their student dashboard</td></tr>
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; You can track their progress through your parent dashboard</td></tr>
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Course materials and resources are now available</td></tr>
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; You'll receive progress updates as ${studentName} advances</td></tr>`
                              : `<tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Access your course from your dashboard</td></tr>
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Review the course syllabus and materials</td></tr>
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Complete lessons at your own pace</td></tr>
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Engage with instructors and fellow students</td></tr>`
                          }
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Track your progress and earn certificates</td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; padding: 25px 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    If you have any questions or need assistance, our support team is here to help.
                  </p>
                  
                  <p style="margin: 0; padding: 25px 0 10px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    For help, contact us at
                    <a href="mailto:office@eyogigurukul.com" style="color: #2c5f2d; text-decoration: underline;">office@eyogigurukul.com</a>
                  </p>
                  <p style="margin: 0; padding: 20px 0 0 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">&mdash; The SSH University Team</p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0; padding: 0; text-align: center; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif; line-height: 18px;">
                    This is an automated message from SSH University.<br />
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
  `.trim()
}

/**
 * Generate HTML template for enrollment rejection
 */
function generateEnrollmentRejectionHTML(
  recipientName: string,
  courseTitle: string,
  studentName?: string,
  isParentEmail?: boolean,
): string {
  const greeting = isParentEmail ? recipientName.split(' ')[0] : recipientName
  const rejectionMessage = isParentEmail
    ? `Thank you for your interest in enrolling ${studentName} in <strong>${courseTitle}</strong>. After careful review, we regret to inform you that we are unable to approve this enrollment request at this time.`
    : `Thank you for your interest in <strong>${courseTitle}</strong>. After careful review, we regret to inform you that we are unable to approve your enrollment request at this time.`

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>Enrollment Status Update</title>
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
                  <img src="https://eyogigurukul.com/ssh-app/Images/SSH_Logo.png" width="180" height="auto" alt="SSH University Logo" style="display: block; border: 0; max-width: 100%; height: auto;" />
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">Enrollment Status Update</h2>
                  <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Dear <strong>${greeting}</strong>,</p>
                  <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    ${rejectionMessage}
                  </p>
                  
                  <!-- Info Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                    <tr>
                      <td style="padding: 20px; background-color: #fff3cd; border-left: 4px solid #f39c12;">
                        <p style="margin: 0; padding: 0 0 10px 0; font-size: 18px; color: #856404; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">Possible Reasons</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Course prerequisites not met</td></tr>
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Course capacity has been reached</td></tr>
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Administrative requirements pending</td></tr>
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Other eligibility criteria</td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Next Steps -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                    <tr>
                      <td style="padding: 20px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                        <p style="margin: 0; padding: 0 0 15px 0; font-size: 18px; color: #2c5f2d; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">What You Can Do</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Contact our support team for more information</td></tr>
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Review prerequisite requirements for the course</td></tr>
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Explore alternative courses that match your profile</td></tr>
                          <tr><td style="padding: 3px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">&#8226; Reapply once you meet the requirements</td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://eyogigurukul.com/ssh-app" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="13%" strokecolor="#2c5f2d" fillcolor="#2c5f2d">
                          <w:anchorlock/>
                          <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">Browse Other Courses</center>
                        </v:roundrect>
                        <![endif]-->
                        <![if !mso]>
                        <a href="https://eyogigurukul.com/ssh-app" target="_blank" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; border: 2px solid #2c5f2d;">Browse Other Courses</a>
                        <![endif]>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; padding: 25px 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    We appreciate your interest in SSH University and encourage you to explore our other learning opportunities.
                  </p>
                  
                  <p style="margin: 0; padding: 25px 0 10px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    For help, contact us at
                    <a href="mailto:office@eyogigurukul.com" style="color: #2c5f2d; text-decoration: underline;">office@eyogigurukul.com</a>
                  </p>
                  <p style="margin: 0; padding: 20px 0 0 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">&mdash; The SSH University Team</p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0; padding: 0; text-align: center; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif; line-height: 18px;">
                    This is an automated message from SSH University.<br />
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
  `.trim()
}
