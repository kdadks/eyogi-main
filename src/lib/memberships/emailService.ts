/**
 * Membership Email Service
 * Handles sending welcome, receipt, and confirmation emails
 */

import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Initialize email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export interface MembershipEmailData {
  memberId: string
  firstName: string
  lastName: string
  email: string
  subscriptionType: 'monthly' | 'annual'
  amount: number
  currency: string
  transactionId: string
  registrationDate: string
  renewalDate: string
}

/**
 * Send welcome and confirmation email
 */
export async function sendWelcomeEmail(data: MembershipEmailData): Promise<boolean> {
  try {
    const renewalDateFormatted = new Date(data.renewalDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const registrationDateFormatted = new Date(data.registrationDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const subscriptionPeriod = data.subscriptionType === 'monthly' ? '1 month' : '1 year'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f4a460; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .receipt { background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #f4a460; }
    .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
    .receipt-row.total { border-bottom: none; font-weight: bold; font-size: 18px; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
    .member-id { font-size: 24px; font-weight: bold; color: #f4a460; padding: 15px; background-color: #f0f0f0; text-align: center; margin: 20px 0; }
    a { color: #f4a460; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to eYogi Membership!</h1>
    </div>
    
    <div class="content">
      <p>Dear ${data.firstName} ${data.lastName},</p>
      
      <p>Thank you for registering for eYogi membership! We're excited to have you join our community.</p>
      
      <h2>Your Member ID</h2>
      <div class="member-id">${data.memberId}</div>
      
      <p>Please save your member ID for future reference. You'll need it to access member benefits and for any inquiries.</p>
      
      <h2>Membership Details</h2>
      <div class="receipt">
        <div class="receipt-row">
          <span>Membership Type:</span>
          <span>${data.subscriptionType === 'monthly' ? 'Monthly' : 'Annual'}</span>
        </div>
        <div class="receipt-row">
          <span>Registration Date:</span>
          <span>${registrationDateFormatted}</span>
        </div>
        <div class="receipt-row">
          <span>Renewal Date:</span>
          <span>${renewalDateFormatted}</span>
        </div>
        <div class="receipt-row">
          <span>Subscription Period:</span>
          <span>${subscriptionPeriod}</span>
        </div>
      </div>
      
      <h2>Payment Receipt</h2>
      <div class="receipt">
        <div class="receipt-row">
          <span>Transaction ID:</span>
          <span>${data.transactionId}</span>
        </div>
        <div class="receipt-row">
          <span>Amount Charged:</span>
          <span>${data.amount.toFixed(2)} ${data.currency}</span>
        </div>
        <div class="receipt-row total">
          <span>Total:</span>
          <span>${data.currency} ${data.amount.toFixed(2)}</span>
        </div>
      </div>
      
      <p>If you have any questions about your membership or need assistance, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>The eYogi Team</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2026 eYogi. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@eyogi.com',
      to: data.email,
      subject: `Welcome to eYogi Membership - Your Member ID: ${data.memberId}`,
      html: htmlContent,
      replyTo: process.env.EMAIL_REPLY_TO || 'support@eyogi.com',
    }

    const info = await transporter.sendMail(mailOptions)

    // Log email sending
    await logEmailSent({
      memberId: data.memberId,
      email: data.email,
      emailType: 'welcome',
      subject: mailOptions.subject,
      messageId: info.messageId,
    })

    console.log('Welcome email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending welcome email:', error)
    throw error
  }
}

/**
 * Send receipt email
 */
export async function sendReceiptEmail(data: MembershipEmailData): Promise<boolean> {
  try {
    const renewalDateFormatted = new Date(data.renewalDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f4a460; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .receipt { background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #f4a460; }
    .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
    .receipt-row.total { border-bottom: none; font-weight: bold; font-size: 18px; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Receipt</h1>
    </div>
    
    <div class="content">
      <p>Dear ${data.firstName},</p>
      
      <p>Thank you for your payment. Here's your official receipt.</p>
      
      <h2>Invoice Details</h2>
      <div class="receipt">
        <div class="receipt-row">
          <span>Member ID:</span>
          <span>${data.memberId}</span>
        </div>
        <div class="receipt-row">
          <span>Transaction ID:</span>
          <span>${data.transactionId}</span>
        </div>
        <div class="receipt-row">
          <span>Amount:</span>
          <span>${data.amount.toFixed(2)} ${data.currency}</span>
        </div>
        <div class="receipt-row">
          <span>Membership Type:</span>
          <span>${data.subscriptionType === 'monthly' ? 'Monthly' : 'Annual'}</span>
        </div>
        <div class="receipt-row">
          <span>Valid Until:</span>
          <span>${renewalDateFormatted}</span>
        </div>
        <div class="receipt-row total">
          <span>Total Amount Paid:</span>
          <span>${data.currency} ${data.amount.toFixed(2)}</span>
        </div>
      </div>
      
      <p>Please keep this receipt for your records. If you need a VAT invoice or have any questions, please contact our support team.</p>
      
      <p>Best regards,<br>The eYogi Team</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2026 eYogi. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@eyogi.com',
      to: data.email,
      subject: `Receipt for eYogi Membership - Transaction ID: ${data.transactionId}`,
      html: htmlContent,
      replyTo: process.env.EMAIL_REPLY_TO || 'support@eyogi.com',
    }

    const info = await transporter.sendMail(mailOptions)

    await logEmailSent({
      memberId: data.memberId,
      email: data.email,
      emailType: 'receipt',
      subject: mailOptions.subject,
      messageId: info.messageId,
    })

    console.log('Receipt email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending receipt email:', error)
    throw error
  }
}

/**
 * Send renewal reminder email
 */
export async function sendRenewalReminderEmail(data: MembershipEmailData): Promise<boolean> {
  try {
    const renewalDateFormatted = new Date(data.renewalDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f4a460; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Membership Renewal Reminder</h1>
    </div>
    
    <div class="content">
      <p>Dear ${data.firstName},</p>
      
      <p>Your eYogi membership will expire on ${renewalDateFormatted}.</p>
      
      <p>To continue enjoying your membership benefits, please renew your subscription. Renewing is easy and takes just a few minutes.</p>
      
      <p>Best regards,<br>The eYogi Team</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2026 eYogi. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@eyogi.com',
      to: data.email,
      subject: `Membership Renewal Reminder - ${data.memberId}`,
      html: htmlContent,
      replyTo: process.env.EMAIL_REPLY_TO || 'support@eyogi.com',
    }

    const info = await transporter.sendMail(mailOptions)

    await logEmailSent({
      memberId: data.memberId,
      email: data.email,
      emailType: 'renewal',
      subject: mailOptions.subject,
      messageId: info.messageId,
    })

    console.log('Renewal reminder email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending renewal reminder email:', error)
    throw error
  }
}

/**
 * Log email sending in database
 */
async function logEmailSent(params: {
  memberId: string
  email: string
  emailType: 'welcome' | 'receipt' | 'confirmation' | 'renewal' | 'cancellation' | 'refund'
  subject: string
  messageId?: string
}): Promise<void> {
  try {
    // Get member ID from database
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('member_id', params.memberId)
      .single()

    if (!member) {
      console.warn(`Member not found for member_id: ${params.memberId}`)
      return
    }

    await supabase.from('memberships_email_logs').insert({
      member_id: member.id,
      email_type: params.emailType,
      recipient_email: params.email,
      subject: params.subject,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error logging email:', error)
    // Don't throw, just log the error
  }
}

/**
 * Resend email from admin dashboard
 */
export async function resendMemberEmail(
  memberId: string,
  emailType: 'welcome' | 'receipt' | 'renewal',
  data: MembershipEmailData
): Promise<boolean> {
  try {
    switch (emailType) {
      case 'welcome':
        return await sendWelcomeEmail(data)
      case 'receipt':
        return await sendReceiptEmail(data)
      case 'renewal':
        return await sendRenewalReminderEmail(data)
      default:
        throw new Error(`Unknown email type: ${emailType}`)
    }
  } catch (error) {
    console.error(`Error resending ${emailType} email:`, error)
    throw error
  }
}
