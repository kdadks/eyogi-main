/**
 * Donation Email Service
 * Handles sending donation receipt emails to donors
 */

import nodemailer from 'nodemailer'
import { sendEmail as sendGraphEmail } from '@/lib/email/graphEmailService'

export interface DonationReceiptEmailData {
  donorFirstName: string
  donorLastName: string
  donorEmail: string
  amount: number
  currency: string
  donationDate: string
  transactionId: string
  checkoutReference: string
  donorMessage?: string
  paymentMethod?: string
}

// Create transporter once to reuse
let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) {
    return transporter
  }

  // Check for SMTP configuration
  if (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASSWORD &&
    process.env.EMAIL_PORT
  ) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
    return transporter
  }

  return null
}

/**
 * Generate HTML content for donation receipt email
 */
function generateDonationReceiptHTML(data: DonationReceiptEmailData): string {
  const donationDateFormatted = new Date(data.donationDate).toLocaleDateString('en-US', {
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation Receipt - eYogi Gurukul</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }

    .container {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .header {
      background: linear-gradient(135deg, #5a4438 0%, #7a5d4f 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }

    .header h1 {
      font-size: 28px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .header p {
      font-size: 14px;
      opacity: 0.95;
    }

    .content {
      padding: 40px 30px;
    }

    .greeting {
      margin-bottom: 30px;
      font-size: 16px;
      color: #333;
    }

    .greeting strong {
      color: #2c5f2d;
    }

    .section {
      margin: 30px 0;
      padding: 20px;
      background-color: #f9f9f9;
      border-left: 4px solid #5a4438;
      border-radius: 4px;
    }

    .section h2 {
      font-size: 16px;
      color: #2c5f2d;
      margin-bottom: 15px;
      font-weight: 600;
    }

    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e5e5;
      font-size: 14px;
    }

    .receipt-row:last-child {
      border-bottom: none;
    }

    .receipt-row .label {
      font-weight: 500;
      color: #555;
    }

    .receipt-row .value {
      color: #333;
      text-align: right;
      word-break: break-all;
    }

    .receipt-row.total {
      padding-top: 15px;
      font-size: 18px;
      font-weight: bold;
      color: #2c5f2d;
      border-top: 2px solid #5a4438;
      border-bottom: none;
    }

    .receipt-row.total .label {
      font-weight: 700;
      color: #2c5f2d;
    }

    .receipt-row.total .value {
      color: #2c5f2d;
      font-weight: 700;
    }

    .amount-highlighted {
      font-size: 24px;
      font-weight: bold;
      color: #2c5f2d;
      text-align: center;
      padding: 20px;
      background-color: #e8f5e9;
      border-radius: 4px;
      margin: 20px 0;
    }

    .donor-message {
      margin: 20px 0;
      padding: 15px;
      background-color: #f0f7ff;
      border-left: 4px solid #2196f3;
      border-radius: 4px;
    }

    .donor-message strong {
      color: #1976d2;
      display: block;
      margin-bottom: 8px;
    }

    .donor-message p {
      color: #424242;
      font-size: 14px;
      font-style: italic;
    }

    .tax-info {
      margin: 20px 0;
      padding: 15px;
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 4px;
      font-size: 12px;
      color: #555;
    }

    .cta {
      margin: 30px 0;
      text-align: center;
    }

    .cta p {
      font-size: 14px;
      color: #555;
      margin-bottom: 15px;
    }

    .cta-button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #2c5f2d;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      font-size: 14px;
    }

    .cta-button:hover {
      background-color: #1e4620;
    }

    .footer {
      background-color: #f5f5f5;
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid #e5e5e5;
      font-size: 12px;
      color: #777;
    }

    .footer p {
      margin: 5px 0;
    }

    .contact-info {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e5e5e5;
      font-size: 12px;
    }

    .contact-info a {
      color: #2c5f2d;
      text-decoration: none;
    }

    .contact-info a:hover {
      text-decoration: underline;
    }

    .badge {
      display: inline-block;
      padding: 5px 12px;
      background-color: #e8f5e9;
      color: #2c5f2d;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    @media (max-width: 600px) {
      .container {
        border-radius: 0;
      }

      .content {
        padding: 20px 15px;
      }

      .header {
        padding: 30px 15px;
      }

      .header h1 {
        font-size: 24px;
      }

      .section {
        padding: 15px;
      }

      .amount-highlighted {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>✓ Donation Receipt</h1>
      <p>Thank you for your generous support!</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <div class="greeting">
        <p>Dear <strong>${data.donorFirstName} ${data.donorLastName}</strong>,</p>
        <p style="margin-top: 12px;">
          We deeply appreciate your generous donation to eYogi Gurukul. Your contribution helps us continue 
          our mission of providing authentic Vedic education rooted in Sanatana Dharma to seekers worldwide.
        </p>
      </div>

      <!-- Amount Highlight -->
      <div class="amount-highlighted">
        ${data.currency} ${data.amount.toFixed(2)}
      </div>

      <!-- Donation Details -->
      <div class="section">
        <h2>📋 Donation Details</h2>
        <div class="receipt-row">
          <span class="label">Donation Date:</span>
          <span class="value">${donationDateFormatted}</span>
        </div>
        <div class="receipt-row">
          <span class="label">Amount:</span>
          <span class="value">${data.currency} ${data.amount.toFixed(2)}</span>
        </div>
        <div class="receipt-row">
          <span class="label">Currency:</span>
          <span class="value">${data.currency}</span>
        </div>
        ${data.paymentMethod ? `
        <div class="receipt-row">
          <span class="label">Payment Method:</span>
          <span class="value">${data.paymentMethod}</span>
        </div>
        ` : ''}
      </div>

      <!-- Transaction Details -->
      <div class="section">
        <h2>🔐 Transaction Details</h2>
        <div class="receipt-row">
          <span class="label">Transaction ID:</span>
          <span class="value">${data.transactionId}</span>
        </div>
        <div class="receipt-row">
          <span class="label">Checkout Reference:</span>
          <span class="value">${data.checkoutReference}</span>
        </div>
        <div class="receipt-row">
          <span class="label">Status:</span>
          <span class="value"><span class="badge">Completed</span></span>
        </div>
      </div>

      <!-- Donor Message (if provided) -->
      ${
        data.donorMessage
          ? `
      <div class="donor-message">
        <strong>💬 Your Message:</strong>
        <p>"${data.donorMessage}"</p>
      </div>
      `
          : ''
      }

      <!-- Tax Information -->
      <div class="tax-info">
        <strong>📝 Tax Deductibility Information:</strong>
        <p>eYogi Gurukul is a registered Irish charity (Charity Number: 20208551). Your donation may be eligible 
        for tax relief. Please consult with a tax professional or visit <a href="https://www.revenue.ie/" target="_blank">www.revenue.ie</a> 
        for more information about tax deductions for charitable donations in Ireland.</p>
      </div>

      <!-- Call to Action -->
      <div class="cta">
        <p>Thank you for being part of our educational mission!</p>
        <a href="https://www.eyogigurukul.com" class="cta-button">Visit Our Website</a>
      </div>

      <!-- Message -->
      <div style="margin-top: 30px; padding: 20px; background-color: #f0f7ff; border-radius: 4px; text-align: center;">
        <p style="font-size: 14px; color: #333; margin: 0;">
          If you have any questions about your donation, please don't hesitate to reach out to us. 
          We're always happy to help!
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="font-weight: 600; color: #333;">eYogi Gurukul</p>
      <p>Authentic Vedic Education Rooted in Sanatana Dharma</p>
      
      <div class="contact-info">
        <p>Email: <a href="mailto:office@eyogigurukul.com">office@eyogigurukul.com</a></p>
        <p>Website: <a href="https://www.eyogigurukul.com" target="_blank">www.eyogigurukul.com</a></p>
        <p>Charity Number: 20208551</p>
        <p style="margin-top: 10px;">
          © 2026 eYogi Gurukul. All rights reserved.<br>
          Registered Irish Charity
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Send donation receipt email
 */
export async function sendDonationReceiptEmail(
  data: DonationReceiptEmailData,
): Promise<boolean> {
  try {
    // Try Microsoft Graph first (if configured)
    const hasMicrosoftGraph =
      process.env.MICROSOFT_TENANT_ID &&
      process.env.MICROSOFT_CLIENT_ID &&
      process.env.MICROSOFT_CLIENT_SECRET

    const htmlContent = generateDonationReceiptHTML(data)

    // Use Microsoft Graph if available
    if (hasMicrosoftGraph) {
      console.log('Sending donation receipt email via Microsoft Graph API')
      const result = await sendGraphEmail({
        to: data.donorEmail,
        subject: `Donation Receipt - eYogi Gurukul (Ref: ${data.checkoutReference})`,
        body: htmlContent,
      })

      if (result) {
        console.log('Donation receipt email sent successfully via Graph API:', {
          email: data.donorEmail,
          amount: data.amount,
          currency: data.currency,
          transactionId: data.transactionId,
          timestamp: new Date().toISOString(),
        })
      }

      return result
    }

    // Fallback to SMTP
    const transporter = getTransporter()

    if (!transporter) {
      console.error(
        'Email service is not configured (neither Microsoft Graph nor SMTP)',
      )
      return false
    }

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'eYogi Gurukul'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: data.donorEmail,
      subject: `Donation Receipt - eYogi Gurukul (Ref: ${data.checkoutReference})`,
      html: htmlContent,
      replyTo: process.env.SMTP_REPLY_TO || 'office@eyogigurukul.com',
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Donation receipt email sent successfully via SMTP:', {
      messageId: info.messageId,
      email: data.donorEmail,
      amount: data.amount,
      currency: data.currency,
      transactionId: data.transactionId,
      timestamp: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error('Error sending donation receipt email:', error)
    return false
  }
}

/**
 * Send donation confirmation email to admin
 */
export async function sendDonationNotificationToAdmin(
  data: DonationReceiptEmailData,
): Promise<boolean> {
  try {
    const adminEmail = process.env.DONATION_NOTIFICATION_EMAIL || 'office@eyogigurukul.com'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2c5f2d; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #ddd; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #2c5f2d; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Donation Received</h1>
    </div>
    
    <div class="content">
      <h2>Donation Details</h2>
      
      <div class="detail-row">
        <span class="label">Donor Name:</span>
        <span>${data.donorFirstName} ${data.donorLastName}</span>
      </div>
      
      <div class="detail-row">
        <span class="label">Donor Email:</span>
        <span>${data.donorEmail}</span>
      </div>
      
      <div class="detail-row">
        <span class="label">Amount:</span>
        <span>${data.currency} ${data.amount.toFixed(2)}</span>
      </div>
      
      <div class="detail-row">
        <span class="label">Date & Time:</span>
        <span>${new Date(data.donationDate).toLocaleString()}</span>
      </div>
      
      <div class="detail-row">
        <span class="label">Transaction ID:</span>
        <span>${data.transactionId}</span>
      </div>
      
      <div class="detail-row">
        <span class="label">Checkout Reference:</span>
        <span>${data.checkoutReference}</span>
      </div>
      
      ${
        data.donorMessage
          ? `
      <div class="detail-row">
        <span class="label">Donor Message:</span>
        <span>"${data.donorMessage}"</span>
      </div>
      `
          : ''
      }
    </div>
    
    <div class="footer">
      <p>This is an automated notification. Please check your admin dashboard for more details.</p>
    </div>
  </div>
</body>
</html>
    `

    // Try Microsoft Graph first
    const hasMicrosoftGraph =
      process.env.MICROSOFT_TENANT_ID &&
      process.env.MICROSOFT_CLIENT_ID &&
      process.env.MICROSOFT_CLIENT_SECRET

    if (hasMicrosoftGraph) {
      return await sendGraphEmail({
        to: adminEmail,
        subject: `[New Donation] ${data.currency} ${data.amount.toFixed(2)} from ${data.donorFirstName} ${data.donorLastName}`,
        body: htmlContent,
      })
    }

    // Fallback to SMTP
    const transporter = getTransporter()

    if (!transporter) {
      console.error('Email service is not configured')
      return false
    }

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'eYogi Gurukul'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[New Donation] ${data.currency} ${data.amount.toFixed(2)} from ${data.donorFirstName} ${data.donorLastName}`,
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)

    return true
  } catch (error) {
    console.error('Error sending donation notification to admin:', error)
    return false
  }
}
