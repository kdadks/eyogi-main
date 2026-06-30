/**
 * Email service for Member Portal
 * Handles password creation, reset, and welcome emails
 */

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
}

const FROM_EMAIL = 'noreply@eyogi.ie'
const FROM_NAME = 'eYogi'
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://eyogi.ie'

/**
 * Send email using configured email service
 * Note: Replace with actual email service (SendGrid, AWS SES, etc.)
 */
async function sendEmail({ to, subject, html, from }: SendEmailParams): Promise<boolean> {
  try {
    // TODO: Replace with actual email service
    // For now, just log to console
    console.log('📧 Email would be sent:', {
      from: from || `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html: html.substring(0, 100) + '...',
    })

    // In production, implement actual email sending:
    // Example with SendGrid:
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: to }] }],
    //     from: { email: FROM_EMAIL, name: FROM_NAME },
    //     subject,
    //     content: [{ type: 'text/html', value: html }],
    //   }),
    // })

    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

/**
 * Send password creation email to new member
 */
export async function sendPasswordCreationEmail(
  email: string,
  firstName: string,
  token: string,
): Promise<boolean> {
  const resetUrl = `${SITE_URL}/members/set-password?token=${token}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Create Your Password - eYogi</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to eYogi!</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                Hi ${firstName},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                Thank you for joining eYogi! Your membership registration has been successfully completed.
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px;">
                To access your member portal, you need to create a password. Click the button below to set up your account:
              </p>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Create My Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0 0 10px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #667eea; font-size: 14px; line-height: 20px; margin: 0 0 30px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin: 0 0 30px;">
                <p style="color: #333333; font-size: 14px; line-height: 20px; margin: 0;">
                  <strong>⚠️ Security Note:</strong> This link will expire in 24 hours for your security.
                </p>
              </div>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                Once you've set your password, you'll have access to:
              </p>
              
              <ul style="color: #333333; font-size: 16px; line-height: 28px; margin: 0 0 30px; padding-left: 20px;">
                <li>View your donation history</li>
                <li>Download membership receipts</li>
                <li>Access Gurukul financial reports</li>
                <li>Manage your profile</li>
              </ul>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0;">
                If you didn't register for an eYogi membership, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0 0 10px;">
                Questions? Contact us at <a href="mailto:support@eyogi.ie" style="color: #667eea; text-decoration: none;">support@eyogi.ie</a>
              </p>
              <p style="color: #999999; font-size: 12px; line-height: 18px; margin: 0;">
                © 2026 eYogi. All rights reserved.
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

  return sendEmail({
    to: email,
    subject: 'Create Your Password - eYogi Member Portal',
    html,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string,
): Promise<boolean> {
  const resetUrl = `${SITE_URL}/members/reset-password?token=${token}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - eYogi</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                Hi ${firstName},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px;">
                We received a request to reset your password for your eYogi member portal account. Click the button below to create a new password:
              </p>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0 0 10px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #667eea; font-size: 14px; line-height: 20px; margin: 0 0 30px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 0 0 30px;">
                <p style="color: #856404; font-size: 14px; line-height: 20px; margin: 0;">
                  <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                </p>
              </div>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0;">
                For security reasons, this password reset link can only be used once.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0 0 10px;">
                Questions? Contact us at <a href="mailto:support@eyogi.ie" style="color: #667eea; text-decoration: none;">support@eyogi.ie</a>
              </p>
              <p style="color: #999999; font-size: 12px; line-height: 18px; margin: 0;">
                © 2026 eYogi. All rights reserved.
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

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - eYogi Member Portal',
    html,
  })
}

/**
 * Send welcome email after password is set
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  memberNumber: string,
): Promise<boolean> {
  const portalUrl = `${SITE_URL}/members/portal`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to eYogi - Account Activated</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 Welcome to eYogi!</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                Hi ${firstName},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px;">
                Your eYogi member account is now active! You can now access your personal member portal.
              </p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 0 0 30px;">
                <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0 0 10px;">
                  <strong>Your Member Number:</strong>
                </p>
                <p style="color: #667eea; font-size: 24px; font-weight: bold; margin: 0; font-family: 'Courier New', monospace;">
                  ${memberNumber}
                </p>
              </div>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${portalUrl}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Access Member Portal
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                <strong>Your portal includes:</strong>
              </p>
              
              <ul style="color: #333333; font-size: 16px; line-height: 28px; margin: 0 0 30px; padding-left: 20px;">
                <li>📊 Personal dashboard with membership overview</li>
                <li>💰 Complete donation history</li>
                <li>📄 Downloadable receipts for all payments</li>
                <li>📈 Access to Gurukul financial reports</li>
                <li>👤 Profile management</li>
              </ul>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0;">
                We're excited to have you as part of our community!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0 0 10px;">
                Need help? Contact us at <a href="mailto:support@eyogi.ie" style="color: #667eea; text-decoration: none;">support@eyogi.ie</a>
              </p>
              <p style="color: #999999; font-size: 12px; line-height: 18px; margin: 0;">
                © 2026 eYogi. All rights reserved.
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

  return sendEmail({
    to: email,
    subject: 'Welcome to eYogi - Your Account is Active!',
    html,
  })
}
