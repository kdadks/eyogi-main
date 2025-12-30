import nodemailer from 'nodemailer'
import { sendEmail as sendGraphEmail } from './graphEmailService'

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

interface WelcomeEmailData {
  email: string
  fullName: string
  loginLink: string
  role: 'student' | 'teacher' | 'parent' | 'admin' | 'business_admin' | 'super_admin'
}

// Create transporter once to reuse
let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) {
    return transporter
  }

  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('SMTP configuration is incomplete. Email sending will be disabled.')
    return null
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports like 587
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false, // For self-signed certificates (if needed)
    },
  })

  return transporter
}

export async function sendRegistrationEmail(data: RegistrationEmailData): Promise<boolean> {
  try {
    const transporter = getTransporter()

    if (!transporter) {
      console.error('Email service is not configured')
      return false
    }

    const recipientEmail = process.env.REGISTRATION_EMAIL_TO || process.env.SMTP_USER

    if (!recipientEmail) {
      console.error('REGISTRATION_EMAIL_TO or SMTP_USER not configured')
      return false
    }

    const htmlContent = generateRegistrationEmailHTML(data)

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'EYogi Gurukul'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `New User Registration - ${data.role.replace(/_/g, ' ')}`,
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Registration email sent successfully:', {
      messageId: info.messageId,
      role: data.role,
      timestamp: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error('Error sending registration email:', error)
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
    second: '2-digit',
    timeZoneName: 'short',
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
          }
          .header {
            background-color: #1f2937;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background-color: white;
            padding: 20px;
            border-radius: 0 0 8px 8px;
          }
          .detail-row {
            display: flex;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #6b7280;
            min-width: 150px;
          }
          .detail-value {
            color: #1f2937;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-active {
            background-color: #dbeafe;
            color: #0c4a6e;
          }
          .status-pending {
            background-color: #fef3c7;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New User Registration</h1>
            <p>A new user has registered on EYogi Gurukul</p>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Registration Details</h2>
            
            <div class="detail-row">
              <span class="detail-label">Registration Date:</span>
              <span class="detail-value">${registrationDateTime}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">User Role:</span>
              <span class="detail-value">${roleDisplay}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Account Status:</span>
              <span class="detail-value">
                <span class="status-badge ${data.status === 'active' ? 'status-active' : 'status-pending'}">
                  ${data.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </span>
            </div>

            <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 6px;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                <strong>Note:</strong> This email contains registration details without personally identifiable information (PII) for audit and monitoring purposes.
              </p>
            </div>

            <div class="footer">
              <p>EYogi Gurukul Admin Notification System</p>
              <p>© 2025 EYogi Gurukul. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

// Enrollment confirmation email interface
interface EnrollmentConfirmationEmailData {
  studentEmail: string
  studentFullName: string
  courseName: string
  courseDescription?: string
  confirmationDate: string
}

export async function sendEnrollmentConfirmationEmail(
  data: EnrollmentConfirmationEmailData,
): Promise<boolean> {
  try {
    const transporter = getTransporter()

    if (!transporter) {
      console.error('Email service is not configured')
      return false
    }

    const htmlContent = generateEnrollmentConfirmationEmailHTML(data)

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'EYogi Gurukul'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: data.studentEmail,
      subject: `Enrollment Confirmed - ${data.courseName}`,
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Enrollment confirmation email sent successfully:', {
      messageId: info.messageId,
      studentEmail: data.studentEmail,
      courseName: data.courseName,
      timestamp: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error('Error sending enrollment confirmation email:', error)
    return false
  }
}

function generateEnrollmentConfirmationEmailHTML(data: EnrollmentConfirmationEmailData): string {
  const confirmationDateTime = new Date(data.confirmationDate).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header p {
            margin: 8px 0 0 0;
            opacity: 0.95;
            font-size: 14px;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .greeting {
            font-size: 16px;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .confirmation-box {
            background-color: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 20px;
            margin: 20px 0;
            border-radius: 6px;
          }
          .confirmation-box h2 {
            margin: 0 0 10px 0;
            color: #16a34a;
            font-size: 16px;
            font-weight: 600;
          }
          .course-info {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
            min-width: 120px;
          }
          .info-value {
            color: #1f2937;
            flex: 1;
          }
          .cta-section {
            margin: 30px 0;
            text-align: center;
          }
          .cta-button {
            display: inline-block;
            background-color: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
          }
          .cta-button:hover {
            background-color: #5568d3;
          }
          .description {
            margin: 15px 0;
            color: #6b7280;
            line-height: 1.6;
            font-size: 14px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
          }
          .contact-info {
            margin: 15px 0;
            color: #6b7280;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Enrollment Confirmed!</h1>
            <p>Your enrollment has been approved</p>
          </div>
          <div class="content">
            <p class="greeting">
              Hello,
            </p>
            <p>
              We're excited to confirm that your enrollment has been approved by your instructor. You now have full access to start learning!
            </p>

            <div class="confirmation-box">
              <h2>Enrollment Confirmation</h2>
              <p style="margin: 0; color: #166534;">Your enrollment request has been reviewed and approved.</p>
            </div>

            <div class="course-info">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Course Details</h3>
              
              <div class="info-row">
                <span class="info-label">Course:</span>
                <span class="info-value"><strong>${data.courseName}</strong></span>
              </div>

              <div class="info-row">
                <span class="info-label">Confirmation Date:</span>
                <span class="info-value">${confirmationDateTime}</span>
              </div>
            </div>

            ${
              data.courseDescription
                ? `
            <div class="description">
              <strong>Course Overview:</strong><br>
              ${data.courseDescription}
            </div>
            `
                : ''
            }

            <div class="cta-section">
              <p>Ready to get started?</p>
              <a href="${process.env.NEXT_PUBLIC_SERVER_URL || 'https://eyogigurukul.com'}/dashboard" class="cta-button">
                Go to Dashboard
              </a>
            </div>

            <div class="contact-info">
              <p style="margin: 0;">
                If you have any questions about your enrollment, please contact your instructor or our support team.
              </p>
            </div>

            <div class="footer">
              <p>EYogi Gurukul Learning Platform</p>
              <p>© 2025 EYogi Gurukul. All rights reserved.</p>
              <p style="margin-top: 10px; color: #9ca3af;">
                This email was sent to you because you enrolled in a course on EYogi Gurukul.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

// Contact Form Email Interface
interface ContactFormEmailData {
  senderName: string
  senderEmail: string
  subject: string
  message: string
  submissionDate: string
}

export async function sendContactFormEmail(data: ContactFormEmailData): Promise<boolean> {
  try {
    // Try Microsoft Graph first (if configured)
    const hasMicrosoftGraph =
      process.env.MICROSOFT_TENANT_ID &&
      process.env.MICROSOFT_CLIENT_ID &&
      process.env.MICROSOFT_CLIENT_SECRET

    const recipientEmail =
      process.env.REGISTRATION_EMAIL_TO || process.env.MICROSOFT_FROM_EMAIL || process.env.SMTP_USER

    if (!recipientEmail) {
      console.error(
        'No recipient email configured (REGISTRATION_EMAIL_TO, MICROSOFT_FROM_EMAIL, or SMTP_USER)',
      )
      return false
    }

    const htmlContent = generateContactFormEmailHTML(data)

    // Use Microsoft Graph if available
    if (hasMicrosoftGraph) {
      console.log('Sending contact form email via Microsoft Graph API')
      return await sendGraphEmail({
        to: recipientEmail,
        subject: `Contact Form: ${data.subject}`,
        body: htmlContent,
      })
    }

    // Fallback to SMTP
    const transporter = getTransporter()

    if (!transporter) {
      console.error('Email service is not configured (neither Microsoft Graph nor SMTP)')
      return false
    }

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'eYogi Gurukul'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `Contact Form: ${data.subject}`,
      html: htmlContent,
      replyTo: data.senderEmail, // Allow direct reply to sender
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Contact form email sent successfully via SMTP:', {
      messageId: info.messageId,
      senderEmail: data.senderEmail,
      subject: data.subject,
      timestamp: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error('Error sending contact form email:', error)
    return false
  }
}

function generateContactFormEmailHTML(data: ContactFormEmailData): string {
  const submissionDateTime = new Date(data.submissionDate).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  })

  // Sanitize message content to prevent XSS
  const sanitizedMessage = data.message
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\n/g, '<br>')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
          }
          .header {
            background-color: #1f2937;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background-color: white;
            padding: 20px;
            border-radius: 0 0 8px 8px;
          }
          .detail-row {
            display: flex;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-of-type {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #6b7280;
            min-width: 120px;
          }
          .detail-value {
            color: #1f2937;
            word-break: break-word;
          }
          .message-box {
            margin-top: 20px;
            padding: 15px;
            background-color: #f3f4f6;
            border-left: 4px solid #f59e0b;
            border-radius: 4px;
          }
          .message-box h3 {
            margin: 0 0 10px 0;
            color: #1f2937;
          }
          .message-content {
            margin: 0;
            color: #4b5563;
            font-size: 14px;
            line-height: 1.8;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
          }
          .reply-info {
            background-color: #dbeafe;
            padding: 10px;
            border-radius: 4px;
            font-size: 12px;
            color: #0c4a6e;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Contact Form Submission</h1>
            <p>A visitor has contacted you through the website</p>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Submission Details</h2>
            
            <div class="detail-row">
              <span class="detail-label">Submitted:</span>
              <span class="detail-value">${submissionDateTime}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">From:</span>
              <span class="detail-value">${data.senderName}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value"><a href="mailto:${data.senderEmail}">${data.senderEmail}</a></span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Subject:</span>
              <span class="detail-value"><strong>${data.subject}</strong></span>
            </div>

            <div class="message-box">
              <h3>Message:</h3>
              <p class="message-content">${sanitizedMessage}</p>
            </div>

            <div class="reply-info">
              <strong>💡 Tip:</strong> You can reply to this email directly to respond to ${data.senderName}.
            </div>

            <div class="footer">
              <p>EYogi Gurukul Contact Form System</p>
              <p>© 2025 EYogi Gurukul. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
  try {
    const transporter = getTransporter()

    if (!transporter) {
      console.error('Email service is not configured')
      return false
    }

    const htmlContent = generatePasswordResetEmailHTML(data)

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'EYogi Gurukul'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: data.email,
      subject: 'Reset Your Password - EYogi Gurukul',
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Password reset email sent successfully:', {
      messageId: info.messageId,
      email: data.email,
      timestamp: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}

function generatePasswordResetEmailHTML(data: PasswordResetEmailData): string {
  const greeting = data.fullName ? `Dear ${data.fullName}` : 'Hello'

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .header {
            background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 12px 12px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .greeting {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .message {
            color: #4b5563;
            margin-bottom: 25px;
            line-height: 1.7;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            transition: all 0.3s;
          }
          .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(249, 115, 22, 0.3);
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .alternative-link {
            margin-top: 20px;
            padding: 15px;
            background-color: #f3f4f6;
            border-radius: 8px;
            font-size: 13px;
            color: #6b7280;
            word-break: break-all;
          }
          .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #92400e;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 12px;
            text-align: center;
          }
          .footer p {
            margin: 5px 0;
          }
          .highlight {
            color: #f97316;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p class="greeting">${greeting},</p>
            
            <p class="message">
              We received a request to reset your password for your EYogi Gurukul account. 
              If you made this request, click the button below to create a new password.
            </p>

            <div class="button-container">
              <a href="${data.resetUrl}" class="reset-button">Reset Your Password</a>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in <span class="highlight">24 hours</span> for security reasons.
            </div>

            <p class="message">
              If the button above doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <div class="alternative-link">
              ${data.resetUrl}
            </div>

            <p class="message" style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
              <strong>Didn't request this?</strong><br>
              If you didn't request a password reset, you can safely ignore this email. 
              Your password will remain unchanged.
            </p>

            <div class="footer">
              <p><strong>EYogi Gurukul</strong></p>
              <p>Your journey to Vedic learning</p>
              <p style="margin-top: 15px;">© 2025 EYogi Gurukul. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

// Certificate Issued Email Interface
interface CertificateIssuedEmailData {
  parentEmail: string
  studentName: string
  courseName: string
  certificateUrl: string
}

export async function sendCertificateIssuedEmail(
  data: CertificateIssuedEmailData,
): Promise<boolean> {
  try {
    const transporter = getTransporter()

    if (!transporter) {
      console.error('Email service is not configured')
      return false
    }

    const htmlContent = generateCertificateIssuedEmailHTML(data)

    // Fetch the certificate PDF from the URL to attach it
    let certificateAttachment = null
    try {
      const response = await fetch(data.certificateUrl)
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        certificateAttachment = {
          filename: `Certificate-${data.studentName.replace(/\s+/g, '_')}.pdf`,
          content: Buffer.from(buffer),
          contentType: 'application/pdf',
        }
      }
    } catch (fetchError) {
      console.warn('Could not fetch certificate for attachment:', fetchError)
      // Continue without attachment - the email still has the download link
    }

    const mailOptions: any = {
      from: `${process.env.SMTP_FROM_NAME || 'eYogi Gurukul'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: data.parentEmail,
      subject: `Certificate Issued - ${data.courseName}`,
      html: htmlContent,
    }

    // Add certificate as attachment if successfully fetched
    if (certificateAttachment) {
      mailOptions.attachments = [certificateAttachment]
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Certificate issued email sent successfully:', {
      messageId: info.messageId,
      parentEmail: data.parentEmail,
      courseName: data.courseName,
      hasAttachment: !!certificateAttachment,
      timestamp: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error('Error sending certificate issued email:', error)
    return false
  }
}

function generateCertificateIssuedEmailHTML(data: CertificateIssuedEmailData): string {
  // Extract first name from full name
  const firstName = data.studentName.split(' ')[0]

  return `
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
                  <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">🎉 Certificate Issued!</h2>
                  <p style="margin: 0; padding: 0 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Dear ${firstName},</p>
                  <p style="margin: 0; padding: 0 0 25px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    Congratulations on successfully completing <strong>${data.courseName}</strong>!
                  </p>
                  
                  <!-- Success Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 25px 0;">
                    <tr>
                      <td style="padding: 20px; background-color: #e8f5e9; border-left: 4px solid #2c5f2d;">
                        <p style="margin: 0; padding: 0; line-height: 24px; color: #1b5e20; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">
                          <strong>✅ Achievement Unlocked!</strong><br/>
                          Your certificate of completion is now ready and attached to this email.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${data.certificateUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="13%" strokecolor="#2c5f2d" fillcolor="#2c5f2d">
                          <w:anchorlock/>
                          <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">📥 Download Certificate</center>
                        </v:roundrect>
                        <![endif]-->
                        <![if !mso]>
                        <a href="${data.certificateUrl}" target="_blank" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; border: 2px solid #2c5f2d; border-radius: 6px;">📥 Download Certificate</a>
                        <![endif]>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; padding: 25px 0 15px 0; line-height: 21px; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif; text-align: center;">
                    Or copy this link to download:
                  </p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 12px; background-color: #f8f9fa; word-break: break-all;">
                        <p style="margin: 0; padding: 0; font-size: 13px; color: #666666; font-family: Arial, Helvetica, sans-serif; line-height: 19px;">
                          <a href="${data.certificateUrl}" target="_blank" style="color: #2c5f2d; text-decoration: underline; word-break: break-all;">${data.certificateUrl}</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; padding: 25px 0 15px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    We are proud of your dedication and achievement. This certificate is a testament to your commitment to learning and growth.
                  </p>
                  
                  <p style="margin: 0; padding: 20px 0 10px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    For any questions, contact us at
                    <a href="mailto:office@eyogigurukul.com" style="color: #2c5f2d; text-decoration: underline;">office@eyogigurukul.com</a>
                  </p>
                  
                  <p style="margin: 0; padding: 20px 0 0 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">
                    With blessings,<br/>
                    <strong>Team eYogi Gurukul</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; padding: 0; text-align: center; color: #9ca3af; font-size: 12px; font-family: Arial, Helvetica, sans-serif; line-height: 18px;">
                    <strong>eYogi Gurukul</strong><br/>
                    Your journey to Vedic learning<br/>
                    © 2025 eYogi Gurukul. All rights reserved.
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

// Welcome email function
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const transporter = getTransporter()

    if (!transporter) {
      console.error('Email service is not configured')
      return false
    }

    const htmlContent = generateWelcomeEmailHTML(data)

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'eYogi Gurukul'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: data.email,
      subject: 'Welcome to eYogi Gurukul - Your Learning Journey Begins!',
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Welcome email sent successfully:', {
      messageId: info.messageId,
      recipient: data.email,
      timestamp: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error('Error sending welcome email:', error)
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
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome to eYogi Gurukul</title>
</head>
<body style="margin:0; padding:0; background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="20" cellspacing="0" style="background:#ffffff; font-family:Arial, sans-serif;">
          <tr>
            <td align="center">
              <img src="https://eyogigurukul.com/ssh-app/Images/SSH_Logo.png" width="180" height="auto" alt="eYogi Gurukul">
            </td>
          </tr>
          <tr>
            <td>
              <h2 style="color:#2c5f2d;">${roleGreeting}, ${firstName}!</h2>
              <p>
                ${roleMessage}
              </p>
              <p style="text-align:center;">
                <a href="${data.loginLink}" style="background:#2c5f2d; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:4px;">
                  Go to Dashboard
                </a>
              </p>
              <p>
                If you need any help, contact us at
                <a href="mailto:office@eyogigurukul.com">office@eyogigurukul.com</a>.
              </p>
              <p>Warm regards,<br><strong>Team eYogi Gurukul</strong></p>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-size:12px; color:#777;">
              © ${currentYear} eYogi Gurukul. All rights reserved.
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
