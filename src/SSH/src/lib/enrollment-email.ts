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
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enrollment Request Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <img src="https://eyogigurukul.com/ssh-app/Images/SSH_Logo.png" alt="SSH University Logo" style="max-width: 150px; height: auto; display: block; margin: 0 auto;">
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; color: #333333; font-weight: bold;">
                📚 Enrollment Request Received
              </h1>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Dear <strong>${studentName}</strong>,
              </p>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Thank you for your interest in enrolling in <strong>${courseTitle}</strong>. We have successfully received your enrollment request.
              </p>
              
              <!-- Status Box -->
              <div style="margin: 25px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <h2 style="margin: 0 0 10px; font-size: 18px; color: #856404;">⏳ Under Review</h2>
                <p style="margin: 0; font-size: 15px; color: #856404; line-height: 1.6;">
                  Your enrollment request is currently being reviewed by our Gurukul team. We will notify you once a decision has been made.
                </p>
              </div>
              
              <!-- What Happens Next -->
              <div style="margin: 25px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <h2 style="margin: 0 0 15px; font-size: 18px; color: #333333;">What Happens Next?</h2>
                <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
                  <li>Our team will review your enrollment request</li>
                  <li>You will receive an email notification with the decision</li>
                  <li>If approved, you'll get immediate access to the course</li>
                  <li>If you have questions, feel free to contact our support team</li>
                </ul>
              </div>
              
              <p style="margin: 25px 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Thank you for choosing SSH University for your learning journey.
              </p>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Best regards,<br>
                <strong>The SSH University Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                <strong>SSH University</strong><br>
                Excellence in Education
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
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
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enrollment Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <img src="https://eyogigurukul.com/ssh-app/Images/SSH_Logo.png" alt="SSH University Logo" style="max-width: 150px; height: auto; display: block; margin: 0 auto;">
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; color: #333333; font-weight: bold;">
                🎉 Enrollment Approved!
              </h1>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Dear <strong>${greeting}</strong>,
              </p>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                ${enrollmentMessage}
              </p>
              
              ${
                courseDescription
                  ? `
              <div style="margin: 25px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <h2 style="margin: 0 0 10px; font-size: 18px; color: #333333;">About This Course</h2>
                <p style="margin: 0; font-size: 15px; color: #555555; line-height: 1.6;">
                  ${courseDescription}
                </p>
              </div>
              `
                  : ''
              }
              
              <!-- Access Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 25px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://eyogigurukul.com/ssh-app" style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                      ${isParentEmail ? 'View Dashboard' : 'Start Learning Now'}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Getting Started -->
              <div style="margin: 25px 0; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
                <h2 style="margin: 0 0 15px; font-size: 18px; color: #155724;">${isParentEmail ? 'What Happens Next' : 'Getting Started'}</h2>
                <ul style="margin: 0; padding-left: 20px; color: #155724; line-height: 1.8;">
                  ${
                    isParentEmail
                      ? `<li>${studentName} can access the course from their student dashboard</li>
                  <li>You can track their progress through your parent dashboard</li>
                  <li>Course materials and resources are now available</li>
                  <li>You'll receive progress updates as ${studentName} advances</li>`
                      : `<li>Access your course from your dashboard</li>
                  <li>Review the course syllabus and materials</li>
                  <li>Complete lessons at your own pace</li>
                  <li>Engage with instructors and fellow students</li>`
                  }
                  <li>Track your progress and earn certificates</li>
                </ul>
              </div>
              
              <p style="margin: 25px 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                If you have any questions or need assistance, our support team is here to help.
              </p>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Happy learning!<br>
                <strong>The SSH University Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                <strong>SSH University</strong><br>
                Excellence in Education
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
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
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enrollment Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <img src="https://eyogigurukul.com/ssh-app/Images/SSH_Logo.png" alt="SSH University Logo" style="max-width: 150px; height: auto; display: block; margin: 0 auto;">
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; color: #333333; font-weight: bold;">
                Enrollment Status Update
              </h1>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Dear <strong>${greeting}</strong>,
              </p>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                ${rejectionMessage}
              </p>
              
              <!-- Info Box -->
              <div style="margin: 25px 0; padding: 20px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
                <h2 style="margin: 0 0 10px; font-size: 18px; color: #721c24;">Possible Reasons</h2>
                <ul style="margin: 0; padding-left: 20px; color: #721c24; line-height: 1.8;">
                  <li>Course prerequisites not met</li>
                  <li>Course capacity has been reached</li>
                  <li>Administrative requirements pending</li>
                  <li>Other eligibility criteria</li>
                </ul>
              </div>
              
              <!-- Next Steps -->
              <div style="margin: 25px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <h2 style="margin: 0 0 15px; font-size: 18px; color: #333333;">What You Can Do</h2>
                <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
                  <li>Contact our support team for more information</li>
                  <li>Review prerequisite requirements for the course</li>
                  <li>Explore alternative courses that match your profile</li>
                  <li>Reapply once you meet the requirements</li>
                </ul>
              </div>
              
              <!-- Browse Courses Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 25px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://eyogigurukul.com/ssh-app" style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                      Browse Other Courses
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                We appreciate your interest in SSH University and encourage you to explore our other learning opportunities.
              </p>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Best regards,<br>
                <strong>The SSH University Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                <strong>SSH University</strong><br>
                Excellence in Education
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
