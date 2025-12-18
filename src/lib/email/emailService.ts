import nodemailer from 'nodemailer'

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

    const htmlContent = generateContactFormEmailHTML(data)

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'EYogi Gurukul'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `Contact Form: ${data.subject}`,
      html: htmlContent,
      replyTo: data.senderEmail, // Allow direct reply to sender
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Contact form email sent successfully:', {
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
