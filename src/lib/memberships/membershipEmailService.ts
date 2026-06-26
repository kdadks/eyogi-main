/**
 * Membership Email Service
 * Handles sending automated emails for membership registration
 */

export interface MembershipWelcomeEmailData {
  firstName: string
  lastName: string
  email: string
  memberId: string
  subscriptionType: 'monthly' | 'annual'
  renewalDate: string
}

export interface MembershipReceiptEmailData {
  firstName: string
  lastName: string
  email: string
  memberId: string
  transactionId: string
  amount: number
  currency: string
  subscriptionType: 'monthly' | 'annual'
  startDate: string
  renewalDate: string
}

export interface MembershipRenewalReminderEmailData {
  firstName: string
  lastName: string
  email: string
  memberId: string
  renewalDate: string
  subscriptionType: 'monthly' | 'annual'
}

/**
 * Generate HTML for welcome email
 */
function generateWelcomeEmailHTML(data: MembershipWelcomeEmailData): string {
  const renewalDate = new Date(data.renewalDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to eYogi Membership</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f7f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #f4a460 0%, #d4853b 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
          }
          .member-id-box {
            background-color: #f9f7f4;
            border-left: 4px solid #f4a460;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
          }
          .member-id-label {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          .member-id {
            font-size: 24px;
            font-weight: 700;
            color: #f4a460;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
          }
          .subscription-details {
            background-color: #f9f7f4;
            padding: 20px;
            border-radius: 4px;
            margin: 30px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e5e5;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #333;
          }
          .detail-value {
            color: #666;
          }
          .footer {
            text-align: center;
            padding: 30px;
            background-color: #f9f7f4;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #e5e5e5;
          }
          .footer a {
            color: #f4a460;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Welcome to eYogi</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Dear ${data.firstName} ${data.lastName},</p>
            
            <p>Welcome to the eYogi Membership community! We're delighted to have you join us. Your membership is now active and you can start enjoying all the benefits.</p>
            
            <div class="member-id-box">
              <div class="member-id-label">Your Member ID</div>
              <div class="member-id">${data.memberId}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 13px;">Please save this ID securely. You'll need it for access to member-only features.</p>
            </div>
            
            <div class="subscription-details">
              <div class="detail-row">
                <span class="detail-label">Subscription Type</span>
                <span class="detail-value">${data.subscriptionType === 'monthly' ? 'Monthly (€11)' : 'Annual (€120)'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Valid Until</span>
                <span class="detail-value">${renewalDate}</span>
              </div>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
            
            <p>Warm regards,<br><strong>eYogi Gurukul Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p><a href="https://eyogi.com">Visit eYogi</a> | <a href="https://eyogi.com/contact">Contact Us</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Generate HTML for receipt email
 */
function generateReceiptEmailHTML(data: MembershipReceiptEmailData): string {
  const startDate = new Date(data.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const renewalDate = new Date(data.renewalDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt - eYogi Membership</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f7f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #f4a460 0%, #d4853b 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .receipt-box {
            background-color: #f9f7f4;
            padding: 30px;
            border-radius: 4px;
            margin: 30px 0;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e5e5;
          }
          .receipt-row:last-child {
            border-bottom: none;
          }
          .receipt-label {
            font-weight: 600;
            color: #333;
          }
          .receipt-value {
            color: #666;
            text-align: right;
          }
          .receipt-total {
            padding-top: 12px;
            font-size: 18px;
            font-weight: 700;
            color: #f4a460;
          }
          .footer {
            text-align: center;
            padding: 30px;
            background-color: #f9f7f4;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #e5e5e5;
          }
          .footer a {
            color: #f4a460;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Payment Receipt</h1>
          </div>
          
          <div class="content">
            <p>Dear ${data.firstName} ${data.lastName},</p>
            
            <p>Thank you for your membership payment. Your payment has been processed successfully.</p>
            
            <div class="receipt-box">
              <div class="receipt-row">
                <span class="receipt-label">Member ID</span>
                <span class="receipt-value">${data.memberId}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Transaction ID</span>
                <span class="receipt-value">${data.transactionId}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Subscription Type</span>
                <span class="receipt-value">${data.subscriptionType === 'monthly' ? 'Monthly' : 'Annual'}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Valid From</span>
                <span class="receipt-value">${startDate}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Valid Until</span>
                <span class="receipt-value">${renewalDate}</span>
              </div>
              <div class="receipt-row receipt-total">
                <span>Amount Paid</span>
                <span>€${data.amount.toFixed(2)}</span>
              </div>
            </div>
            
            <p>Your membership is now active. You can access member-only features using your Member ID.</p>
            
            <p>If you have any questions, please contact us.</p>
            
            <p>Warm regards,<br><strong>eYogi Gurukul Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p><a href="https://eyogi.com">Visit eYogi</a> | <a href="https://eyogi.com/contact">Contact Us</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Generate HTML for renewal reminder email
 */
function generateRenewalReminderEmailHTML(data: MembershipRenewalReminderEmailData): string {
  const renewalDate = new Date(data.renewalDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Membership Renewal Reminder</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f7f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #f4a460 0%, #d4853b 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .info-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            padding: 30px;
            background-color: #f9f7f4;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #e5e5e5;
          }
          .footer a {
            color: #f4a460;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Membership Renewal Reminder</h1>
          </div>
          
          <div class="content">
            <p>Dear ${data.firstName} ${data.lastName},</p>
            
            <p>This is a friendly reminder that your eYogi membership will expire on <strong>${renewalDate}</strong>.</p>
            
            <div class="info-box">
              <p style="margin: 0;"><strong>Don't lose access to member-only content!</strong></p>
              <p style="margin: 8px 0 0 0;">Renew your membership now to maintain uninterrupted access.</p>
            </div>
            
            <p>To renew your membership, please visit our website and complete the renewal process. Your Member ID is <strong>${data.memberId}</strong>.</p>
            
            <p>Thank you for being part of the eYogi community!</p>
            
            <p>Warm regards,<br><strong>eYogi Gurukul Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p><a href="https://eyogi.com">Visit eYogi</a> | <a href="https://eyogi.com/contact">Contact Us</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(data: MembershipWelcomeEmailData): Promise<void> {
  try {
    const html = generateWelcomeEmailHTML(data)
    
    const response = await fetch('/api/memberships/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.email,
        subject: `Welcome to eYogi Membership - Your ID: ${data.memberId}`,
        html,
        emailType: 'welcome',
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to send welcome email')
    }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    throw error
  }
}

/**
 * Send receipt email
 */
export async function sendReceiptEmail(data: MembershipReceiptEmailData): Promise<void> {
  try {
    const html = generateReceiptEmailHTML(data)
    
    const response = await fetch('/api/memberships/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.email,
        subject: `Payment Receipt - eYogi Membership #${data.transactionId}`,
        html,
        emailType: 'receipt',
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to send receipt email')
    }
  } catch (error) {
    console.error('Error sending receipt email:', error)
    throw error
  }
}

/**
 * Send renewal reminder email
 */
export async function sendRenewalReminderEmail(data: MembershipRenewalReminderEmailData): Promise<void> {
  try {
    const html = generateRenewalReminderEmailHTML(data)
    
    const response = await fetch('/api/memberships/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.email,
        subject: `Membership Renewal Reminder - ${data.memberId}`,
        html,
        emailType: 'renewal',
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to send renewal reminder email')
    }
  } catch (error) {
    console.error('Error sending renewal reminder email:', error)
    throw error
  }
}
