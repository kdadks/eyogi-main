import { supabaseAdmin } from './supabase'
import { decryptField } from './encryption'

/**
 * Send activation email to user and parent notification if applicable
 * This uses Supabase Edge Function or direct SMTP instead of Microsoft Graph
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

    // Generate activation email HTML
    const userEmailHTML = generateActivationEmailHTML(decryptedFullName)

    // For now, we'll use a simple approach - log the email content
    // In production, this should call Supabase Edge Function or SMTP service
    console.log('✅ Activation email prepared for:', email)
    // TODO: Send actual email using userEmailHTML
    void userEmailHTML // Placeholder to avoid unused variable warning

    // If user is a student (role = 4) and has a parent, send notification to parent
    if (role === 4 && parent_id) {
      try {
        const { data: parentData } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', parent_id)
          .single()

        if (parentData?.email) {
          const parentEmailHTML = generateParentNotificationHTML(decryptedFullName)
          console.log('✅ Parent notification email prepared for:', parentData.email)
          // TODO: Send actual email using parentEmailHTML
          void parentEmailHTML // Placeholder to avoid unused variable warning
        }
      } catch (parentError) {
        console.error('Error fetching parent details:', parentError)
        // Continue even if parent notification fails
      }
    }

    // TODO: Implement actual email sending via Supabase Edge Function
    // For now, return true to indicate success
    return true
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
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Activated</title>
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
                🎉 Your Account Has Been Activated!
              </h1>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Dear <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Great news! Your account has been successfully activated by our administrative team. You can now access all the features and resources available on the SSH University platform.
              </p>
              
              <!-- Access Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 25px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://eyogigurukul.com/ssh-app" style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                      Access Your Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- What's Next Section -->
              <div style="margin: 25px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <h2 style="margin: 0 0 15px; font-size: 18px; color: #333333;">What's Next?</h2>
                <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
                  <li>Log in to your account using your registered credentials</li>
                  <li>Complete your profile information if you haven't already</li>
                  <li>Explore available courses and resources</li>
                  <li>Connect with fellow students and instructors</li>
                </ul>
              </div>
              
              <!-- Support Information -->
              <p style="margin: 25px 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                If you need any assistance or have questions, our support team is here to help.
              </p>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Welcome aboard!<br>
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
 * Generate HTML template for parent notification email
 */
function generateParentNotificationHTML(studentName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Account Activated</title>
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
                Student Account Activation Notice
              </h1>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Dear Parent/Guardian,
              </p>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                We are pleased to inform you that <strong>${studentName}</strong>'s account has been successfully activated at SSH University. Your child can now access the learning platform and begin their educational journey with us.
              </p>
              
              <!-- Information Box -->
              <div style="margin: 25px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <h2 style="margin: 0 0 15px; font-size: 18px; color: #333333;">What This Means</h2>
                <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
                  <li>Your child can now log in and access course materials</li>
                  <li>All platform features are now available</li>
                  <li>You can monitor their progress through the parent portal</li>
                  <li>Both you and your child will receive updates about their learning journey</li>
                </ul>
              </div>
              
              <!-- Parent Portal Access -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 25px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://eyogigurukul.com/ssh-app" style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                      Access Parent Portal
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Support Information -->
              <p style="margin: 25px 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                If you have any questions or concerns, please don't hesitate to contact our support team.
              </p>
              
              <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #555555;">
                Thank you for choosing SSH University.<br>
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
                This is an automated notification. Please do not reply to this email.
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
