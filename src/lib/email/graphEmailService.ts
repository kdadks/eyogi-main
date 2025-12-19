import { Client } from '@microsoft/microsoft-graph-client'
import { ClientSecretCredential } from '@azure/identity'
import 'isomorphic-fetch'

interface GraphEmailOptions {
  to: string | string[]
  subject: string
  body: string
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
}

// Create Microsoft Graph client
function getGraphClient() {
  const tenantId = process.env.MICROSOFT_TENANT_ID
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret) {
    console.warn('Microsoft Graph API configuration is incomplete. Email sending will be disabled.')
    return null
  }

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)

  const client = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken('https://graph.microsoft.com/.default')
        return token.token
      },
    },
  })

  return client
}

export async function sendEmail(options: GraphEmailOptions): Promise<boolean> {
  try {
    const client = getGraphClient()

    if (!client) {
      console.error('Microsoft Graph API is not configured')
      return false
    }

    const fromEmail =
      options.from || process.env.MICROSOFT_FROM_EMAIL || process.env.MICROSOFT_USER_EMAIL

    if (!fromEmail) {
      console.error('From email address not configured')
      return false
    }

    // Prepare recipients
    const toRecipients = Array.isArray(options.to)
      ? options.to.map((email) => ({ emailAddress: { address: email } }))
      : [{ emailAddress: { address: options.to } }]

    const ccRecipients = options.cc
      ? Array.isArray(options.cc)
        ? options.cc.map((email) => ({ emailAddress: { address: email } }))
        : [{ emailAddress: { address: options.cc } }]
      : []

    const bccRecipients = options.bcc
      ? Array.isArray(options.bcc)
        ? options.bcc.map((email) => ({ emailAddress: { address: email } }))
        : [{ emailAddress: { address: options.bcc } }]
      : []

    const message = {
      message: {
        subject: options.subject,
        body: {
          contentType: 'HTML',
          content: options.body,
        },
        toRecipients,
        ...(ccRecipients.length > 0 && { ccRecipients }),
        ...(bccRecipients.length > 0 && { bccRecipients }),
      },
      saveToSentItems: true,
    }

    await client.api(`/users/${fromEmail}/sendMail`).post(message)

    console.log('Email sent successfully via Microsoft Graph API:', {
      to: options.to,
      subject: options.subject,
      timestamp: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error('Error sending email via Microsoft Graph API:', error)
    return false
  }
}

interface RegistrationEmailData {
  email: string
  fullName: string
  role: 'student' | 'teacher' | 'parent' | 'admin' | 'business_admin' | 'super_admin'
  registrationDate: string
  status: string
}

interface PasswordResetEmailData {
  email: string
  resetUrl: string
  fullName?: string
}

export async function sendRegistrationEmail(data: RegistrationEmailData): Promise<boolean> {
  try {
    const recipientEmail = process.env.REGISTRATION_EMAIL_TO || process.env.MICROSOFT_FROM_EMAIL

    if (!recipientEmail) {
      console.error('REGISTRATION_EMAIL_TO or MICROSOFT_FROM_EMAIL not configured')
      return false
    }

    const htmlContent = generateRegistrationEmailHTML(data)

    return await sendEmail({
      to: recipientEmail,
      subject: `New User Registration - ${data.role.replace(/_/g, ' ')}`,
      body: htmlContent,
    })
  } catch (error) {
    console.error('Error sending registration email:', error)
    return false
  }
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
  try {
    const htmlContent = generatePasswordResetEmailHTML(data)

    return await sendEmail({
      to: data.email,
      subject: 'Password Reset Request - eYogi Gurukul',
      body: htmlContent,
    })
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}

export async function sendPasswordResetConfirmationEmail(
  email: string,
  fullName: string,
): Promise<boolean> {
  try {
    const htmlContent = generatePasswordResetConfirmationHTML(fullName)

    return await sendEmail({
      to: email,
      subject: 'Password Successfully Reset - eYogi Gurukul',
      body: htmlContent,
    })
  } catch (error) {
    console.error('Error sending password reset confirmation email:', error)
    return false
  }
}

function generateRegistrationEmailHTML(data: RegistrationEmailData): string {
  const roleDisplay =
    data.role.replace(/_/g, ' ').charAt(0).toUpperCase() + data.role.replace(/_/g, ' ').slice(1)

  const registrationDateTime = new Date(data.registrationDate).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>New User Registration</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td {font-family: Arial, sans-serif !important;}
        </style>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 10px;">
              <!--[if mso]>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
              <tr>
              <td>
              <![endif]-->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff;">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px 40px; background-color: #FB7E3F;">
                    <h1 style="margin: 0; padding: 0; color: #ffffff; font-size: 28px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">New User Registration</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 40px 40px 40px;">
                    <p style="margin: 0; padding: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333; font-family: Arial, Helvetica, sans-serif;">
                      A new user has registered on the eYogi Gurukul platform.
                    </p>
                    
                    <!-- User Details Table -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef; font-family: Arial, Helvetica, sans-serif;">
                          <strong style="color: #495057; font-size: 14px;">Full Name:</strong>
                        </td>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e9ecef; font-family: Arial, Helvetica, sans-serif; color: #333333; font-size: 14px;">
                          ${data.fullName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef; font-family: Arial, Helvetica, sans-serif;">
                          <strong style="color: #495057; font-size: 14px;">Email:</strong>
                        </td>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e9ecef; font-family: Arial, Helvetica, sans-serif; color: #333333; font-size: 14px;">
                          ${data.email}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef; font-family: Arial, Helvetica, sans-serif;">
                          <strong style="color: #495057; font-size: 14px;">Role:</strong>
                        </td>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e9ecef; font-family: Arial, Helvetica, sans-serif; color: #333333; font-size: 14px;">
                          ${roleDisplay}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef; font-family: Arial, Helvetica, sans-serif;">
                          <strong style="color: #495057; font-size: 14px;">Registration Date:</strong>
                        </td>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e9ecef; font-family: Arial, Helvetica, sans-serif; color: #333333; font-size: 14px;">
                          ${registrationDateTime}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa; font-family: Arial, Helvetica, sans-serif;">
                          <strong style="color: #495057; font-size: 14px;">Status:</strong>
                        </td>
                        <td style="padding: 15px; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding: 8px 16px; background-color: #28a745; color: #ffffff; font-size: 14px; font-family: Arial, Helvetica, sans-serif; font-weight: bold;">
                                ${data.status}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0; padding: 30px 0 0 0; font-size: 14px; line-height: 21px; color: #6c757d; font-family: Arial, Helvetica, sans-serif;">
                      This is an automated notification from the eYogi Gurukul platform.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0; padding: 0; font-size: 14px; color: #6c757d; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">
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

function generatePasswordResetEmailHTML(data: PasswordResetEmailData): string {
  // fullName should be passed already decrypted from the calling context
  const fullName = data.fullName || 'User'
  const firstName = fullName ? fullName.split(' ')[0] : 'User'

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>Password Reset</title>
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
                  <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">Reset Your Password</h2>
                  <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Hello ${firstName},</p>
                  <p style="margin: 0; padding: 0 0 25px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    We received a request to reset your eYogi Gurukul account password. Click the button below to create a new password.
                  </p>
                  
                  <!-- Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${data.resetUrl}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="13%" strokecolor="#2c5f2d" fillcolor="#2c5f2d">
                          <w:anchorlock/>
                          <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">Reset Password</center>
                        </v:roundrect>
                        <![endif]-->
                        <![if !mso]>
                        <a href="${data.resetUrl}" target="_blank" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; border: 2px solid #2c5f2d;">Reset Password</a>
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
                          <a href="${data.resetUrl}" target="_blank" style="color: #2c5f2d; text-decoration: underline; word-break: break-all;">${data.resetUrl}</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; padding: 25px 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    <strong>This link will expire in 24 hours.</strong>
                  </p>
                  <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    If you did not request this password reset, please ignore this email. Your password will remain unchanged.
                  </p>
                  <p style="margin: 0; padding: 25px 0 10px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    For help, contact us at
                    <a href="mailto:office@eyogigurukul.com" style="color: #2c5f2d; text-decoration: underline;">office@eyogigurukul.com</a>
                  </p>
                  <p style="margin: 0; padding: 20px 0 0 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">&mdash; Team eYogi Gurukul</p>
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

function generatePasswordResetConfirmationHTML(fullName: string): string {
  // fullName should be passed already decrypted from the calling context
  const firstName = fullName ? fullName.split(' ')[0] : 'User'

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>Password Reset Successful</title>
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
                  <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">Password Successfully Reset</h2>
                  <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Hello ${firstName},</p>
                  <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    Your password has been successfully reset for your eYogi Gurukul account.
                  </p>
                  
                  <!-- Success Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                    <tr>
                      <td style="padding: 20px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                        <p style="margin: 0; padding: 0; line-height: 24px; color: #2c5f2d; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 16px;">
                          &#10003; Your password change was successful
                        </p>
                        <p style="margin: 0; padding: 10px 0 0 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                          Date: ${new Date().toLocaleString('en-US', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                            timeZone: 'Asia/Kolkata',
                          })} IST
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; padding: 25px 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    You can now use your new password to log in to your account.
                  </p>
                  
                  <!-- Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://eyogigurukul.com/ssh-app/signin" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="13%" strokecolor="#2c5f2d" fillcolor="#2c5f2d">
                          <w:anchorlock/>
                          <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">Go to Login</center>
                        </v:roundrect>
                        <![endif]-->
                        <![if !mso]>
                        <a href="https://eyogigurukul.com/ssh-app/signin" target="_blank" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; border: 2px solid #2c5f2d;">Go to Login</a>
                        <![endif]>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; padding: 25px 0 15px 0; line-height: 21px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                    <strong>Security Reminder:</strong>
                  </p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 0 0 8px 20px; line-height: 24px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                        &bull; If you did not request this password change, please contact us immediately
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 0 8px 20px; line-height: 24px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                        &bull; Never share your password with anyone
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 0 25px 20px; line-height: 24px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                        &bull; Use a strong, unique password for your account
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; padding: 25px 0 10px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    For help or to report suspicious activity, contact us at
                    <a href="mailto:office@eyogigurukul.com" style="color: #2c5f2d; text-decoration: underline;">office@eyogigurukul.com</a>
                  </p>
                  <p style="margin: 0; padding: 20px 0 0 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">&mdash; Team eYogi Gurukul</p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0; padding: 0; font-size: 12px; color: #6c757d; line-height: 18px; font-family: Arial, Helvetica, sans-serif; text-align: center;">
                    This is an automated security notification. If you believe you received this email in error, please contact our support team.
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

interface WelcomeEmailData {
  email: string
  fullName: string
  loginLink: string
  role: 'student' | 'teacher' | 'parent' | 'admin' | 'business_admin' | 'super_admin'
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const htmlContent = generateWelcomeEmailHTML(data)

    return await sendEmail({
      to: data.email,
      subject: 'Welcome to eYogi Gurukul - Your Learning Journey Begins!',
      body: htmlContent,
    })
  } catch (error) {
    console.error('Error sending welcome email via Graph API:', error)
    return false
  }
}

function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  const firstName = data.fullName.split(' ')[0]
  const currentYear = new Date().getFullYear()

  // Customize greeting and message based on role
  let roleGreeting = ''
  let roleMessage = ''

  switch (data.role) {
    case 'student':
      roleGreeting = 'Welcome to Your Learning Journey'
      roleMessage = `Thank you for joining <strong>eYogi Gurukul</strong> as a student. You are now part of a vibrant learning community rooted in ancient wisdom and modern understanding. Explore courses in Yoga, Meditation, Sanskrit, Indian Knowledge Systems, and more to enrich your knowledge and spiritual growth.`
      break
    case 'teacher':
      roleGreeting = 'Welcome to the Teaching Community'
      roleMessage = `Thank you for joining <strong>eYogi Gurukul</strong> as a teacher. We are honored to have you as part of our esteemed faculty. Your expertise and dedication will help shape the minds of students seeking knowledge in Yoga, Meditation, Sanskrit, and Indian Knowledge Systems. Once your account is approved by an admin, you can start creating and managing courses.`
      break
    case 'parent':
      roleGreeting = 'Welcome to the eYogi Gurukul Family'
      roleMessage = `Thank you for joining <strong>eYogi Gurukul</strong> as a parent. You are now part of a caring community dedicated to nurturing young minds with ancient wisdom and modern education. Monitor your child's learning journey, track their progress in courses like Yoga, Meditation, Sanskrit, and Indian Knowledge Systems, and be an active part of their educational growth.`
      break
    case 'admin':
    case 'business_admin':
    case 'super_admin':
      roleGreeting = 'Welcome to the Admin Team'
      roleMessage = `Thank you for joining <strong>eYogi Gurukul</strong> as an administrator. You now have access to manage and oversee the platform, ensuring a smooth learning experience for all users. Your role is crucial in maintaining the quality and integrity of our educational community.`
      break
    default:
      roleGreeting = 'Welcome to eYogi Gurukul'
      roleMessage = `Thank you for signing up with <strong>eYogi Gurukul</strong>. You are now part of a learning community rooted in ancient wisdom and modern understanding.`
  }

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Welcome to eYogi Gurukul</title>
      <!--[if mso]>
      <style type="text/css">
        .button { padding: 16px 32px !important; }
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <!--[if mso]>
            <table cellpadding="0" cellspacing="0" border="0" width="600">
            <tr>
            <td>
            <![endif]-->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
              <!-- Logo Header -->
              <tr>
                <td align="center" style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #2c5f2d 0%, #3d7f3e 100%);">
                  <img src="https://eyogigurukul.com/logo.png" alt="eYogi Gurukul" width="150" style="display: block; max-width: 150px; height: auto;" />
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 40px 20px 40px;">
                  <h2 style="margin: 0 0 20px 0; padding: 0; color: #2c5f2d; font-size: 24px; font-weight: 600; line-height: 32px; font-family: Arial, Helvetica, sans-serif;">
                    ${roleGreeting}, ${firstName}!
                  </h2>
                  <p style="margin: 0 0 20px 0; padding: 0; color: #333333; font-size: 16px; line-height: 24px; font-family: Arial, Helvetica, sans-serif;">
                    ${roleMessage}
                  </p>
                </td>
              </tr>

              <!-- Call to Action Button -->
              <tr>
                <td align="center" style="padding: 0 40px 40px 40px;">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${data.loginLink}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="10%" strokecolor="#2c5f2d" fillcolor="#2c5f2d">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Go to Dashboard</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-->
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="border-radius: 6px; background-color: #2c5f2d;">
                        <a href="${data.loginLink}" target="_blank" class="button" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; font-family: Arial, Helvetica, sans-serif;">
                          Go to Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
                  <!--<![endif]-->
                </td>
              </tr>

              <!-- Support Information -->
              <tr>
                <td style="padding: 0 40px 40px 40px;">
                  <p style="margin: 0 0 10px 0; padding: 0; color: #666666; font-size: 14px; line-height: 21px; font-family: Arial, Helvetica, sans-serif;">
                    If you need any help, contact us at <a href="mailto:eyogigurukul@gmail.com" style="color: #2c5f2d; text-decoration: none;">eyogigurukul@gmail.com</a>.
                  </p>
                  <p style="margin: 0; padding: 0; color: #333333; font-size: 14px; line-height: 21px; font-family: Arial, Helvetica, sans-serif;">
                    Warm regards,<br />
                    <strong>Team eYogi Gurukul</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0; padding: 0; font-size: 12px; color: #6c757d; line-height: 18px; font-family: Arial, Helvetica, sans-serif; text-align: center;">
                    © ${currentYear} eYogi Gurukul. All rights reserved.
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
