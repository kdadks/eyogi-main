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
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New User Registration</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #FB7E3F 0%, #FA573C 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">New User Registration</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                      A new user has registered on the eYogi Gurukul platform.
                    </p>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef;">
                          <strong style="color: #495057;">Full Name:</strong>
                        </td>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e9ecef;">
                          ${data.fullName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef;">
                          <strong style="color: #495057;">Email:</strong>
                        </td>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e9ecef;">
                          ${data.email}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef;">
                          <strong style="color: #495057;">Role:</strong>
                        </td>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e9ecef;">
                          ${roleDisplay}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef;">
                          <strong style="color: #495057;">Registration Date:</strong>
                        </td>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e9ecef;">
                          ${registrationDateTime}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa;">
                          <strong style="color: #495057;">Status:</strong>
                        </td>
                        <td style="padding: 15px; background-color: #ffffff;">
                          <span style="padding: 4px 12px; background-color: #28a745; color: #ffffff; border-radius: 4px; font-size: 14px;">
                            ${data.status}
                          </span>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.5; color: #6c757d;">
                      This is an automated notification from the eYogi Gurukul platform.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0; font-size: 14px; color: #6c757d;">
                      © ${new Date().getFullYear()} eYogi Gurukul. All rights reserved.
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

function generatePasswordResetEmailHTML(data: PasswordResetEmailData): string {
  const firstName = data.fullName ? data.fullName.split(' ')[0] : 'User'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset</title>
    </head>
    <body style="background:#f5f5f5; margin:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table width="600" cellpadding="20" cellspacing="0" style="background:#ffffff; font-family:Arial, sans-serif;">
              <tr>
                <td align="center">
                  <img src="https://eyogigurukul.com/logo.png" width="140" alt="eYogi Gurukul">
                </td>
              </tr>
              <tr>
                <td>
                  <h2 style="color:#2c5f2d;">Reset Your Password</h2>
                  <p>Hello ${firstName},</p>
                  <p>
                    We received a request to reset your eYogi Gurukul account password.
                  </p>
                  <p style="text-align:center;">
                    <a href="${data.resetUrl}" style="background:#2c5f2d; color:#fff; padding:12px 22px; text-decoration:none; border-radius:4px;">
                      Reset Password
                    </a>
                  </p>
                  <p>
                    If you did not request this, please ignore this email.
                  </p>
                  <p>
                    For help, contact
                    <a href="mailto:eyogiurukul@gmail.com">eyogiurukul@gmail.com</a>.
                  </p>
                  <p>— Team eYogi Gurukul</p>
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
