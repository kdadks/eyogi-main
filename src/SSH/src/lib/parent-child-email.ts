import { supabaseAdmin } from './supabase'
import { decryptField } from './encryption'
import { sendEmailViaAPI } from './email-service'

const ADMIN_EMAIL = 'office@eyogigurukul.com'

/**
 * Send email notification when parent adds a new child
 * Sends to both admin and parent
 */
export async function sendChildAddedNotifications(
  childId: string,
  parentId: string,
): Promise<{ adminEmailSent: boolean; parentEmailSent: boolean }> {
  try {
    // Get child and parent details
    const { data: child, error: childError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, student_id, email')
      .eq('id', childId)
      .single()

    if (childError || !child) {
      console.error('Failed to fetch child details:', childError)
      return { adminEmailSent: false, parentEmailSent: false }
    }

    const { data: parent, error: parentError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', parentId)
      .single()

    if (parentError || !parent) {
      console.error('Failed to fetch parent details:', parentError)
      return { adminEmailSent: false, parentEmailSent: false }
    }

    // Decrypt names
    const childName = decryptField(child.full_name) || 'Student'
    const parentName = decryptField(parent.full_name) || 'Parent'
    const studentId = child.student_id || 'N/A'

    // Send email to admin
    const adminEmailHTML = generateAdminChildAddedHTML(childName, parentName, studentId)
    const adminEmailSent = await sendEmailViaAPI({
      to: ADMIN_EMAIL,
      subject: `New Student Added by Parent: ${childName}`,
      htmlBody: adminEmailHTML,
    })

    if (!adminEmailSent) {
      console.error('Failed to send admin notification for new child:', childName)
    }

    // Send confirmation email to parent
    const parentEmailHTML = generateParentChildAddedHTML(parentName, childName, studentId)
    const parentEmailSent = await sendEmailViaAPI({
      to: parent.email,
      subject: 'Child Successfully Added to Your Account',
      htmlBody: parentEmailHTML,
    })

    if (!parentEmailSent) {
      console.error('Failed to send parent confirmation for new child:', parent.email)
    }

    return { adminEmailSent, parentEmailSent }
  } catch (error) {
    console.error('Error sending child added notifications:', error)
    return { adminEmailSent: false, parentEmailSent: false }
  }
}

/**
 * Send email to parent when their child's account is activated
 */
export async function sendChildActivationNotificationToParent(childId: string): Promise<boolean> {
  try {
    // Get child details including parent_id
    const { data: child, error: childError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, student_id, parent_id')
      .eq('id', childId)
      .single()

    if (childError || !child || !child.parent_id) {
      console.error('Failed to fetch child details or no parent linked:', childError)
      return false
    }

    // Get parent email
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', child.parent_id)
      .single()

    if (parentError || !parent) {
      console.error('Failed to fetch parent details:', parentError)
      return false
    }

    // Decrypt names
    const childName = decryptField(child.full_name) || 'Student'
    const parentName = decryptField(parent.full_name) || 'Parent'
    const studentId = child.student_id || 'N/A'

    // Generate and send email
    const emailHTML = generateChildActivationParentNotificationHTML(
      parentName,
      childName,
      studentId,
    )
    const emailSent = await sendEmailViaAPI({
      to: parent.email,
      subject: `${childName}'s Account Has Been Activated`,
      htmlBody: emailHTML,
    })

    if (!emailSent) {
      console.error('Failed to send activation notification to parent:', parent.email)
    }

    return emailSent
  } catch (error) {
    console.error('Error sending child activation notification to parent:', error)
    return false
  }
}

/**
 * Send enrollment confirmation email to parent
 */
export async function sendParentEnrollmentConfirmation(
  enrollmentId: string,
  parentId: string,
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
      .select('full_name, student_id')
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

    // Get parent details
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', parentId)
      .single()

    if (parentError || !parent) {
      console.error('Failed to fetch parent details:', parentError)
      return false
    }

    // Decrypt names
    const parentName = decryptField(parent.full_name) || 'Parent'
    const childName = decryptField(student.full_name) || 'Student'
    const studentId = student.student_id || 'N/A'

    // Generate and send email
    const emailHTML = generateParentEnrollmentConfirmationHTML(
      parentName,
      childName,
      course.title,
      studentId,
    )
    const emailSent = await sendEmailViaAPI({
      to: parent.email,
      subject: `Enrollment Confirmation: ${childName} in ${course.title}`,
      htmlBody: emailHTML,
    })

    if (!emailSent) {
      console.error('Failed to send enrollment confirmation to parent:', parent.email)
    }

    return emailSent
  } catch (error) {
    console.error('Error sending parent enrollment confirmation:', error)
    return false
  }
}

/**
 * Send admin notification about new enrollment request
 */
export async function sendAdminEnrollmentNotification(enrollmentId: string): Promise<boolean> {
  try {
    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id, student_id, course_id, created_at')
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError || !enrollment) {
      console.error('Failed to fetch enrollment details:', enrollmentError)
      return false
    }

    // Get student details separately
    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, student_id, email, parent_id')
      .eq('id', enrollment.student_id)
      .single()

    if (studentError || !student) {
      console.error('Failed to fetch student details:', studentError)
      return false
    }

    // Get course details - try gurukul_courses first, then fallback to courses
    let course = null
    let courseError = null

    // Try gurukul_courses first
    const { data: gurukulCourse, error: gurukulError } = await supabaseAdmin
      .from('gurukul_courses')
      .select('title, subject')
      .eq('id', enrollment.course_id)
      .single()

    if (gurukulCourse) {
      course = gurukulCourse
    } else {
      // Fallback to courses table
      const { data: regularCourse, error: regularError } = await supabaseAdmin
        .from('courses')
        .select('title, subject')
        .eq('id', enrollment.course_id)
        .single()

      course = regularCourse
      courseError = regularError
    }

    if (!course) {
      console.error('Failed to fetch course details from both tables:', {
        gurukulError,
        courseError,
        courseId: enrollment.course_id,
      })
      return false
    }

    // Decrypt student name
    const studentName = decryptField(student.full_name) || 'Student'
    const studentId = student.student_id || 'N/A'

    // Check if this is a parent-initiated enrollment (student has parent_id)
    let enrollmentType = 'Direct Student Enrollment'
    let parentInfo = ''

    if (student.parent_id) {
      enrollmentType = 'Parent-Initiated Enrollment'
      // Get parent details
      const { data: parent } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('id', student.parent_id)
        .single()

      if (parent) {
        const parentName = decryptField(parent.full_name) || 'Parent'
        parentInfo = `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: 600; color: #555;">Parent:</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; color: #333;">${parentName} (${parent.email})</td>
        </tr>
        `
      }
    }

    // Generate and send email
    const emailHTML = generateAdminEnrollmentNotificationHTML(
      studentName,
      studentId,
      student.email,
      course.title,
      course.subject || '',
      enrollmentType,
      parentInfo,
      enrollment.created_at,
    )
    const emailSent = await sendEmailViaAPI({
      to: ADMIN_EMAIL,
      subject: `New Course Enrollment Request: ${studentName} - ${course.title}`,
      htmlBody: emailHTML,
    })

    if (!emailSent) {
      console.error('❌ Failed to send admin enrollment notification', {
        adminEmail: ADMIN_EMAIL,
        enrollmentId,
        studentName,
        courseTitle: course.title,
      })
    } else {
      console.log('✅ Admin enrollment notification sent successfully', {
        adminEmail: ADMIN_EMAIL,
        enrollmentId,
        studentName,
        courseTitle: course.title,
      })
    }

    return emailSent
  } catch (error) {
    console.error('❌ Error sending admin enrollment notification:', {
      enrollmentId,
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    return false
  }
}

// ============================================================================
// HTML EMAIL TEMPLATES
// ============================================================================

/**
 * Admin notification when parent adds a child
 */
function generateAdminChildAddedHTML(
  childName: string,
  parentName: string,
  studentId: string,
): string {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>New Student Added by Parent</title>
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
              <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">👨‍👩‍👧 New Student Added by Parent</h2>
              
              <p style="margin: 0; padding: 0 0 25px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                A parent has added a new child to their account. Please review and activate the student account.
              </p>
              
              <!-- Student Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                    <p style="margin: 0; padding: 0 0 15px 0; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #2c5f2d;">Student Information</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Student Name:</strong> ${childName}</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Student ID:</strong> ${studentId}</p>
                    <p style="margin: 0; padding: 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Added by Parent:</strong> ${parentName}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Action Required -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; padding: 0 0 10px 0; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #856404;">⚠️ Action Required</p>
                    <p style="margin: 0; padding: 0; line-height: 21px; color: #856404; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                      Please log in to the admin dashboard to review and activate this student account. The account must be activated before the student can enroll in courses.
                    </p>
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
                      <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">Go to Admin Dashboard</center>
                    </v:roundrect>
                    <![endif]-->
                    <![if !mso]>
                    <a href="https://eyogigurukul.com/ssh-app" target="_blank" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; border: 2px solid #2c5f2d;">Go to Admin Dashboard</a>
                    <![endif]>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0 0; font-size: 14px; line-height: 1.6; color: #888888;">
                This is an automated notification from SSH University Portal.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #666666;">
                SSH University &copy; ${new Date().getFullYear()}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Parent confirmation when they add a child
 */
function generateParentChildAddedHTML(
  parentName: string,
  childName: string,
  studentId: string,
): string {
  const firstName = parentName.split(' ')[0]

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Child Successfully Added</title>
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
              <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">✅ Child Successfully Added</h2>
              <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Hello ${firstName},</p>
              <p style="margin: 0; padding: 0 0 25px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                You have successfully added <strong>${childName}</strong> to your account at eYogi Gurukul. A student account has been created with the following details:
              </p>
              
              <!-- Student Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                    <p style="margin: 0; padding: 0 0 15px 0; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #2c5f2d;">Student Information</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Student Name:</strong> ${childName}</p>
                    <p style="margin: 0; padding: 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Student ID:</strong> ${studentId}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Next Steps -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #e7f3ff; border-left: 4px solid #2196f3;">
                    <p style="margin: 0; padding: 0 0 15px 0; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #1976d2;">📋 Next Steps</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">&bull; The account needs to be <strong>activated by our Gurukul admin</strong> team</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">&bull; You will receive an email notification once the account is activated</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">&bull; After activation, your child can enroll in courses through your parent dashboard</p>
                    <p style="margin: 0; padding: 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">&bull; You can track your child's progress and manage their enrollments</p>
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
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; padding: 0; font-size: 12px; color: #6c757d; line-height: 18px; font-family: Arial, Helvetica, sans-serif; text-align: center;">
                &copy; ${new Date().getFullYear()} eYogi Gurukul. All rights reserved.
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
}

/**
 * Parent notification when child account is activated
 */
function generateChildActivationParentNotificationHTML(
  parentName: string,
  childName: string,
  studentId: string,
): string {
  const firstName = parentName.split(' ')[0]

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Child Account Activated</title>
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
              <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">🎉 Child Account Activated!</h2>
              <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Hello ${firstName},</p>
              <p style="margin: 0; padding: 0 0 25px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Great news! Your child <strong>${childName}</strong>'s account has been activated by our Gurukul admin team. They can now enroll in courses and begin their learning journey.
              </p>
              
              <!-- Student Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                    <p style="margin: 0; padding: 0 0 15px 0; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #2c5f2d;">✅ Account Activated</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Student Name:</strong> ${childName}</p>
                    <p style="margin: 0; padding: 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Student ID:</strong> ${studentId}</p>
                  </td>
                </tr>
              </table>
              
              <!-- What You Can Do Now -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #e7f3ff; border-left: 4px solid #2196f3;">
                    <p style="margin: 0; padding: 0 0 15px 0; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #1976d2;">🎓 What You Can Do Now</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">&bull; <strong>Enroll in Courses:</strong> Browse available courses and enroll your child</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">&bull; <strong>Track Progress:</strong> Monitor your child's learning progress and achievements</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">&bull; <strong>View Assignments:</strong> Stay updated on upcoming assignments and deadlines</p>
                    <p style="margin: 0; padding: 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">&bull; <strong>Access Dashboard:</strong> Manage your child's education through your parent dashboard</p>
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
                      <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">Go to Parent Dashboard</center>
                    </v:roundrect>
                    <![endif]-->
                    <![if !mso]>
                    <a href="https://eyogigurukul.com/ssh-app" target="_blank" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; border: 2px solid #2c5f2d;">Go to Parent Dashboard</a>
                    <![endif]>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; padding: 25px 0 10px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Need help? Contact us at
                <a href="mailto:office@eyogigurukul.com" style="color: #2c5f2d; text-decoration: underline;">office@eyogigurukul.com</a>
              </p>
              <p style="margin: 0; padding: 20px 0 0 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">&mdash; Team eYogi Gurukul</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; padding: 0; font-size: 12px; color: #6c757d; line-height: 18px; font-family: Arial, Helvetica, sans-serif; text-align: center;">
                &copy; ${new Date().getFullYear()} eYogi Gurukul. All rights reserved.
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
}

/**
 * Parent enrollment confirmation email
 */
function generateParentEnrollmentConfirmationHTML(
  parentName: string,
  childName: string,
  courseTitle: string,
  studentId: string,
): string {
  const firstName = parentName.split(' ')[0]

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Enrollment Confirmation</title>
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
              <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">📚 Course Enrollment Successful!</h2>
              <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Hello ${firstName},</p>
              <p style="margin: 0; padding: 0 0 25px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                You have successfully enrolled <strong>${childName}</strong> in the course <strong>${courseTitle}</strong>.
              </p>
              
              <!-- Enrollment Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                    <p style="margin: 0; padding: 0 0 15px 0; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #2c5f2d;">Enrollment Details</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Student:</strong> ${childName}</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Student ID:</strong> ${studentId}</p>
                    <p style="margin: 0; padding: 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Course:</strong> ${courseTitle}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Status Info -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; padding: 0 0 10px 0; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #856404;">⏳ Pending Admin Approval</p>
                    <p style="margin: 0; padding: 0; line-height: 21px; color: #856404; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                      The enrollment request has been submitted and is pending review by our Gurukul admin team. They will check the eligibility requirements and approve the enrollment. You will receive an email notification once approved.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- What Happens Next -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #e7f3ff; border-left: 4px solid #2196f3;">
                    <p style="margin: 0; padding: 0 0 15px 0; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #1976d2;">📋 What Happens Next?</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">&bull; Our admin team will review the enrollment request</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">&bull; Eligibility and prerequisites will be verified</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">&bull; You'll receive an email notification with the approval status</p>
                    <p style="margin: 0; padding: 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">&bull; Once approved, your child can start the course immediately</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; padding: 25px 0 10px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Questions? Contact us at
                <a href="mailto:office@eyogigurukul.com" style="color: #2c5f2d; text-decoration: underline;">office@eyogigurukul.com</a>
              </p>
              <p style="margin: 0; padding: 20px 0 0 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">&mdash; Team eYogi Gurukul</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; padding: 0; font-size: 12px; color: #6c757d; line-height: 18px; font-family: Arial, Helvetica, sans-serif; text-align: center;">
                &copy; ${new Date().getFullYear()} eYogi Gurukul. All rights reserved.
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
}

/**
 * Admin notification for new enrollment request
 */
function generateAdminEnrollmentNotificationHTML(
  studentName: string,
  studentId: string,
  studentEmail: string,
  courseTitle: string,
  courseSubject: string,
  enrollmentType: string,
  parentInfo: string,
  createdAt: string,
): string {
  const formattedDate = new Date(createdAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>New Enrollment Request</title>
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
              <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">📚 New Course Enrollment Request</h2>
              <p style="margin: 0; padding: 0 0 25px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                A new course enrollment request has been submitted and requires your review and approval.
              </p>
              
              <!-- Enrollment Type Badge -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td style="padding: 12px 20px; background-color: #e7f3ff; border-left: 4px solid #2196f3;">
                    <p style="margin: 0; padding: 0; font-size: 14px; color: #1976d2; font-weight: 600; font-family: Arial, Helvetica, sans-serif;">
                      Type: ${enrollmentType}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Course Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                    <p style="margin: 0; padding: 0 0 15px 0; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #2c5f2d;">Course Information</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Course:</strong> ${courseTitle}</p>
                    <p style="margin: 0; padding: 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Subject:</strong> ${courseSubject}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Student Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #f8f9fa; border-left: 4px solid #6c757d;">
                    <p style="margin: 0; padding: 0 0 15px 0; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #333333;">Student Information</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Student Name:</strong> ${studentName}</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Student ID:</strong> ${studentId}</p>
                    <p style="margin: 0; padding: 0 0 8px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Email:</strong> ${studentEmail}</p>
                    ${parentInfo}
                    <p style="margin: 0; padding: 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Request Date:</strong> ${formattedDate}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Action Required -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; padding: 0 0 10px 0; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #856404;">⚠️ Action Required</p>
                    <p style="margin: 0; padding: 0; line-height: 21px; color: #856404; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                      Please review the enrollment request, verify eligibility and prerequisites, and approve or reject accordingly.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://eyogigurukul.com/ssh-app" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="13%" strokecolor="#2c5f2d" fillcolor="#2c5f2d">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">Review Enrollment Request</center>
                    </v:roundrect>
                    <![endif]-->
                    <![if !mso]>
                    <a href="https://eyogigurukul.com/ssh-app" target="_blank" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; border: 2px solid #2c5f2d;">Review Enrollment Request</a>
                    <![endif]>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; padding: 20px 0 0 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">&mdash; Team eYogi Gurukul</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; padding: 0; font-size: 12px; color: #6c757d; line-height: 18px; font-family: Arial, Helvetica, sans-serif; text-align: center;">
                This is an automated notification. &copy; ${new Date().getFullYear()} eYogi Gurukul. All rights reserved.
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
}
