// Send bulk communication to students via email or SMS
// This uses the main project's email service via API endpoint

interface BulkEmailData {
  studentEmails: string[]
  subject: string
  message: string
}

interface SMSData {
  phoneNumbers: string[]
  message: string
}

/**
 * Send bulk email to multiple students via the main app's API
 */
export async function sendBulkEmail(data: BulkEmailData): Promise<{
  success: boolean
  sent: number
  failed: number
  errors: string[]
}> {
  const results = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [] as string[],
  }

  // Call the main app's API endpoint to send emails
  // The main Next.js app runs on port 3000, SSH app runs on 5174
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Check if the main app is reachable first
  try {
    const healthCheck = await fetch(`${siteUrl}/api/route`, { method: 'GET' })
    if (!healthCheck.ok) {
      throw new Error('Main application API is not responding')
    }
  } catch (error) {
    results.failed = data.studentEmails.length
    results.success = false
    results.errors.push(
      '⚠️ Cannot connect to email service. Please ensure the main Next.js application is running on port 3000.',
      'Start it with: npm run dev (from the project root)',
      `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    return results
  }

  for (const email of data.studentEmails) {
    try {
      const response = await fetch(`${siteUrl}/api/admin/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: data.subject,
          message: data.message,
        }),
      })

      if (response.ok) {
        results.sent++
      } else {
        results.failed++
        let errorText = 'Unknown error'
        try {
          const errorData = await response.json()
          errorText = errorData.error || errorData.message || `HTTP ${response.status}`
        } catch {
          errorText = await response.text()
        }
        results.errors.push(`Failed to send to ${email}: ${errorText}`)
        console.error(`Email API error for ${email}:`, errorText)
      }
    } catch (error) {
      results.failed++
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      results.errors.push(`Error sending to ${email}: ${errorMsg}`)
      console.error(`Email sending exception for ${email}:`, error)
    }
  }

  results.success = results.failed === 0

  return results
}

/**
 * Send SMS to multiple students (placeholder for future implementation)
 */
export async function sendBulkSMS(data: SMSData): Promise<{
  success: boolean
  sent: number
  failed: number
  errors: string[]
}> {
  // SMS functionality not yet implemented
  console.warn('SMS sending is not yet implemented')
  return {
    success: false,
    sent: 0,
    failed: data.phoneNumbers.length,
    errors: ['SMS functionality is not yet implemented'],
  }
}
