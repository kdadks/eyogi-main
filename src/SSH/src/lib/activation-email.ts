import { supabaseAdmin } from './supabase'
import { decryptField } from './encryption'
import { sendEmailViaAPI } from './email-service'
import { sendChildActivationNotificationToParent } from './parent-child-email'

/**
 * Send activation email to user and parent notification if applicable
 */
export async function sendActivationEmail(userId: string): Promise<boolean> {
  try {
    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, role, parent_id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Failed to fetch user details:', userError)
      return false
    }

    const { email, full_name, role, parent_id } = user

    // Decrypt the full name
    const decryptedFullName = decryptField(full_name) || 'User'

    // If user is a student (role = 4 or role = 'student') and has a parent
    // Send activation notification ONLY to parent, not to the student
    if ((role === 4 || role === 'student') && parent_id) {
      // Use the dedicated function for child activation notifications to parent
      const parentEmailSent = await sendChildActivationNotificationToParent(userId).catch((err) => {
        console.error('Failed to send child activation notification to parent:', err)
        return false
      })
      return parentEmailSent
    }

    // For users WITHOUT a parent (direct registrations, teachers, admins, etc.)
    // Send activation email directly to the user
    const userEmailHTML = generateActivationEmailHTML(decryptedFullName)

    const emailSent = await sendEmailViaAPI({
      to: email,
      subject: 'Your Account Has Been Activated',
      htmlBody: userEmailHTML,
    })

    if (!emailSent) {
      console.error('Failed to send activation email to:', email)
    }

    return emailSent
  } catch (error) {
    console.error('Error sending activation email:', error)
    return false
  }
}

/**
 * Generate HTML template for account activation email
 */
function generateActivationEmailHTML(userName: string): string {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Account Activated</title>
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
              <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">🎉 Your Account Has Been Activated!</h2>
              <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Dear <strong>${userName}</strong>,</p>
              <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Great news! Your account has been successfully activated by our administrative team. You can now access all the features and resources available on the eYogi Gurukul platform.
              </p>
              
              <!-- Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://eyogigurukul.com/ssh-app" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="13%" strokecolor="#2c5f2d" fillcolor="#2c5f2d">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">Access Your Dashboard</center>
                    </v:roundrect>
                    <![endif]-->
                    <![if !mso]>
                    <a href="https://eyogigurukul.com/ssh-app" target="_blank" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; border: 2px solid #2c5f2d;">Access Your Dashboard</a>
                    <![endif]>
                  </td>
                </tr>
              </table>
              
              <!-- What's Next Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td style="padding: 15px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                    <h3 style="margin: 0; padding: 0 0 10px 0; font-size: 18px; color: #2c5f2d; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">What's Next?</h3>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 4px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">• Log in to your account using your registered credentials</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">• Complete your profile information if you haven't already</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">• Explore available courses and resources</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">• Connect with fellow students and instructors</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; padding: 25px 0 10px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                If you need any assistance or have questions, our support team is here to help at
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
 * Generate HTML template for parent notification email
 */
function generateParentNotificationHTML(studentName: string): string {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Student Account Activated</title>
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
              <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">Student Account Activation Notice</h2>
              <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Dear Parent/Guardian,</p>
              <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                We are pleased to inform you that <strong>${studentName}</strong>'s account has been successfully activated at eYogi Gurukul. Your child can now access the learning platform and begin their educational journey with us.
              </p>
              
              <!-- Info Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td style="padding: 15px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                    <h3 style="margin: 0; padding: 0 0 10px 0; font-size: 18px; color: #2c5f2d; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">What This Means</h3>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 4px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">• Your child can now log in and access course materials</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">• All platform features are now available</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">• You can monitor their progress through the parent portal</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">• Both you and your child will receive updates about their learning journey</td>
                      </tr>
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
                      <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">Access Parent Portal</center>
                    </v:roundrect>
                    <![endif]-->
                    <![if !mso]>
                    <a href="https://eyogigurukul.com/ssh-app" target="_blank" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; border: 2px solid #2c5f2d;">Access Parent Portal</a>
                    <![endif]>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; padding: 25px 0 10px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                If you have any questions or concerns, contact us at
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
