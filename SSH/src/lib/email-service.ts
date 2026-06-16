/**
 * Email service for SSH app
 * Sends emails via Next.js API endpoint which uses Microsoft Graph
 */

interface SendEmailOptions {
  to: string
  subject: string
  htmlBody: string
}

/**
 * Send email via Next.js API endpoint
 */
export async function sendEmailViaAPI(options: SendEmailOptions): Promise<boolean> {
  try {
    // Determine API URL based on environment
    const apiUrl = import.meta.env.DEV
      ? import.meta.env.VITE_APP_URL || 'http://localhost:3000'
      : window.location.origin

    console.log('📧 Sending email via API:', {
      apiUrl,
      to: options.to,
      subject: options.subject,
    })

    const response = await fetch(`${apiUrl}/api/admin/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        htmlBody: options.htmlBody,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to send email - HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        to: options.to,
        subject: options.subject,
      })
      return false
    }

    const result = await response.json()
    console.log('✅ Email API response:', {
      success: result.success,
      to: options.to,
      subject: options.subject,
    })
    return result.success === true
  } catch (error) {
    console.error('❌ Error sending email via API - Exception:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      to: options.to,
      subject: options.subject,
    })
    return false
  }
}
